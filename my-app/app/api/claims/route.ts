import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { verifyMealLinkToken } from '@/app/lib/meal-link-token'
import { hydrateFoodItem } from '@/lib/backend'

/**
 * GET /api/claims?assignmentId=<uuid>
 * Returns the food assignment detail for the confirm page.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const assignmentId = searchParams.get('assignmentId')

  if (!assignmentId) {
    return NextResponse.json({ error: 'assignmentId is required.' }, { status: 400 })
  }

  const { data: assignment, error } = await supabase
    .from('food_assignments')
    .select('id, status, food_item_id, food_availability_id')
    .eq('id', assignmentId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 })
  }

  // Get description from food_availability
  const { data: availability } = await supabase
    .from('food_availability')
    .select('description')
    .eq('id', assignment.food_availability_id)
    .maybeSingle()

  // Get food item with tags
  const { data: foodItem } = await supabase
    .from('food_items')
    .select('id, name, image_url')
    .eq('id', assignment.food_item_id)
    .maybeSingle()

  if (!foodItem) {
    return NextResponse.json({ error: 'Food item not found.' }, { status: 404 })
  }

  const hydrated = await hydrateFoodItem(foodItem)

  return NextResponse.json({
    id: assignment.id,
    status: assignment.status,
    food_item_id: assignment.food_item_id,
    foodName: hydrated.name,
    description: availability?.description ?? null,
    cuisines: hydrated.cuisines,
    dietaryTags: hydrated.dietaryTags,
    allergens: hydrated.allergens,
  })
}

/**
 * POST /api/claims
 * Marks a food_assignment as claimed after verifying the signed token.
 * Body: { assignmentId: string, token: string }
 */
export async function POST(request: Request) {
  const body = (await request.json()) as { assignmentId?: string; token?: string }

  if (!body.assignmentId || !body.token) {
    return NextResponse.json(
      { error: 'assignmentId and token are required.' },
      { status: 400 }
    )
  }

  // Verify the token — ensures the link hasn't expired and belongs to this assignment
  const payload = verifyMealLinkToken(body.token)
  if (!payload) {
    return NextResponse.json({ error: 'Link is invalid or has expired.' }, { status: 401 })
  }

  // mealWindowId was repurposed to hold the assignmentId
  if (payload.mealWindowId !== body.assignmentId) {
    return NextResponse.json({ error: 'Token does not match this assignment.' }, { status: 403 })
  }

  // Fetch current status
  const { data: assignment, error: fetchError } = await supabase
    .from('food_assignments')
    .select('id, status, user_id')
    .eq('id', body.assignmentId)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 })
  }

  if (assignment.user_id !== payload.userId) {
    return NextResponse.json({ error: 'This link does not belong to you.' }, { status: 403 })
  }

  if (assignment.status === 'claimed') {
    return NextResponse.json({ error: 'Already claimed.' }, { status: 409 })
  }

  // Mark as claimed
  const { error: updateError } = await supabase
    .from('food_assignments')
    .update({ status: 'claimed' })
    .eq('id', body.assignmentId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
