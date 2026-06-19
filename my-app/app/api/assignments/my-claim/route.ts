import { NextResponse } from 'next/server'
import { createMealLinkToken } from '@/app/lib/meal-link-token'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/assignments/my-claim?availabilityId=<uuid>&userId=<uuid>
 *
 * Returns a signed claim token for the user's pending assignment against
 * the given food_availability row.  Used by the home feed Claim button.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const availabilityId = searchParams.get('availabilityId')
  const userId = searchParams.get('userId')

  if (!availabilityId || !userId) {
    return NextResponse.json(
      { error: 'availabilityId and userId are required.' },
      { status: 400 }
    )
  }

  // Find the pending assignment for this user + availability
  const { data: assignment, error } = await supabase
    .from('food_assignments')
    .select('id, status, food_availability_id')
    .eq('food_availability_id', availabilityId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!assignment) {
    return NextResponse.json({ error: 'No pending assignment found.' }, { status: 404 })
  }

  // Fetch expiry from food_availability
  const { data: availability } = await supabase
    .from('food_availability')
    .select('expires_at')
    .eq('id', availabilityId)
    .maybeSingle()

  const mealExpiry = availability?.expires_at
    ? new Date(availability.expires_at).getTime()
    : Date.now() + 24 * 60 * 60 * 1000

  const expiresInSeconds = Math.max(60, Math.floor((mealExpiry - Date.now()) / 1000))

  const token = createMealLinkToken({
    userId,
    mealWindowId: assignment.id,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  })

  return NextResponse.json({ token })
}
