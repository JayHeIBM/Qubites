import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/assignments/pending?userId=<uuid>
 *
 * Returns the food_availability IDs for which this user has a pending assignment.
 * Uses the service-role client so RLS never blocks the read.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('food_assignments')
    .select('food_availability_id')
    .eq('user_id', userId)
    .eq('status', 'pending')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    availabilityIds: (data ?? []).map((r) => r.food_availability_id),
  })
}
