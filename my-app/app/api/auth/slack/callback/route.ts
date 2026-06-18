import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * GET /api/auth/slack/callback
 *
 * Slack redirects here after the user grants permission.
 * Steps:
 *  1. Exchange the `code` for a Slack access token (OIDC flow).
 *  2. Fetch the user's Slack identity (sub = Slack user ID, name, email).
 *  3. Upsert a row into the `users` table keyed on slack_id.
 *  4. Sign the user into Supabase Auth (magic-link / admin createUser + session).
 *  5. Redirect: /onboarding for brand-new users, /home for returning users.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    console.error('[slack/callback] OAuth error or missing code:', error)
    return NextResponse.redirect(`${origin}/login?error=slack_denied`)
  }

  const clientId = process.env.SLACK_CLIENT_ID!
  const clientSecret = process.env.SLACK_CLIENT_SECRET!
  const baseUrl = process.env.APP_BASE_URL ?? origin
  const redirectUri = `${baseUrl}/api/auth/slack/callback`

  // ── Step 1: Exchange code for tokens ──────────────────────────────────────
  const tokenRes = await fetch('https://slack.com/api/openid.connect.token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = (await tokenRes.json()) as {
    ok: boolean
    access_token?: string
    id_token?: string
    error?: string
  }

  if (!tokenData.ok || !tokenData.access_token) {
    console.error('[slack/callback] Token exchange failed:', tokenData.error)
    return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`)
  }

  // ── Step 2: Fetch Slack identity ───────────────────────────────────────────
  const userInfoRes = await fetch('https://slack.com/api/openid.connect.userInfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  const userInfo = (await userInfoRes.json()) as {
    ok: boolean
    sub?: string          // Slack user ID
    name?: string
    email?: string
    error?: string
  }

  if (!userInfo.ok || !userInfo.sub) {
    console.error('[slack/callback] userInfo failed:', userInfo.error)
    return NextResponse.redirect(`${origin}/login?error=userinfo_failed`)
  }

  const slackId = userInfo.sub
  const name = userInfo.name ?? null
  const email = userInfo.email ?? `${slackId}@slack.local`

  // ── Step 3: Upsert into public.users table (service-role client) ───────────
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const adminSupabase = createAdminClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Check if this Slack user already exists
  const { data: existingRow } = await adminSupabase
    .from('users')
    .select('id')
    .eq('slack_id', slackId)
    .maybeSingle()

  const isNewUser = !existingRow

  if (isNewUser) {
    const { error: insertError } = await adminSupabase
      .from('users')
      .insert({ slack_id: slackId, name, role: 'employee' })

    if (insertError) {
      console.error('[slack/callback] Failed to insert user row:', insertError.message)
      return NextResponse.redirect(`${origin}/login?error=db_insert_failed`)
    }
  }

  // ── Step 4: Create / fetch a Supabase Auth user and issue a session ────────
  // Look up the auth user by email; create one if it doesn't exist yet.
  const { data: { users: authUsers }, error: listError } =
    await adminSupabase.auth.admin.listUsers()

  if (listError) {
    console.error('[slack/callback] listUsers failed:', listError.message)
    return NextResponse.redirect(`${origin}/login?error=auth_lookup_failed`)
  }

  let authUserId: string

  const existingAuthUser = authUsers.find(u => u.email === email)
  if (existingAuthUser) {
    authUserId = existingAuthUser.id
  } else {
    const { data: created, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name, slack_id: slackId },
    })

    if (createError || !created.user) {
      console.error('[slack/callback] createUser failed:', createError?.message)
      return NextResponse.redirect(`${origin}/login?error=auth_create_failed`)
    }
    authUserId = created.user.id
  }

  // Generate a short-lived session link and exchange it for real session cookies
  const { data: linkData, error: linkError } =
    await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

  if (linkError || !linkData.properties?.hashed_token) {
    console.error('[slack/callback] generateLink failed:', linkError?.message)
    return NextResponse.redirect(`${origin}/login?error=session_failed`)
  }

  // ── Step 5: Set session cookies via browser client ─────────────────────────
  const cookieStore = await cookies()
  const browserSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options: Parameters<typeof cookieStore.set>[2]
          }>
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  await browserSupabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  })

  // Redirect new users to onboarding, returning users to home
  const destination = isNewUser ? '/onboarding' : '/home'
  return NextResponse.redirect(`${origin}${destination}`)
}
