import { NextResponse } from 'next/server'

/**
 * GET /api/auth/slack
 * Redirects the browser to the Slack OAuth authorization URL.
 */
export async function GET() {
  const clientId = process.env.SLACK_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'SLACK_CLIENT_ID is not configured.' }, { status: 500 })
  }

  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000'
  const redirectUri = `${baseUrl}/api/auth/slack/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    // openid + profile give us identity; email is optional but useful
    scope: 'openid,profile,email',
    response_type: 'code',
  })

  return NextResponse.redirect(`https://slack.com/openid/connect/authorize?${params}`)
}
