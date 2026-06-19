import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import {
  createOrUpdatePreferenceRow,
  hydrateFoodItem,
} from '@/lib/backend'
import {
  allergyColumns,
  buildBooleanRecord,
  cuisineColumns,
  dietaryRestrictionColumns,
  parseSelectedColumns,
} from '@/lib/preferences'

/**
 * GET /api/chef/meals
 * Returns the current chef's food-availability rows, each with hydrated food
 * item data and the number of assignments made against it.
 * Accepts an optional `?chefId=<uuid>` query param.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chefId = searchParams.get('chefId')

  let query = supabase
    .from('food_availability')
    .select('id, food_item_id, quantity, status, description, created_at, expires_at, chef_id')
    .order('created_at', { ascending: false })

  if (chefId) {
    query = query.eq('chef_id', chefId)
  }

  const { data: availability, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Hydrate food items and count assignments
  const meals = await Promise.all(
    (availability ?? []).map(async (row) => {
      const { data: foodItem } = await supabase
        .from('food_items')
        .select('id, name')
        .eq('id', row.food_item_id)
        .single()

      const { count: assignmentsCount } = await supabase
        .from('food_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('food_availability_id', row.id)
        .eq('status', 'claimed')

      let hydratedItem = null
      if (foodItem) {
        hydratedItem = await hydrateFoodItem(foodItem)
      }

      return {
        id: row.id,
        chefId: row.chef_id,
        name: foodItem?.name ?? 'Unknown meal',
        quantity: row.quantity,
        status: row.status,
        description: row.description ?? null,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        assignmentsCount: assignmentsCount ?? 0,
        foodItem: hydratedItem,
      }
    })
  )

  return NextResponse.json({ meals })
}

/**
 * POST /api/chef/meals
 * Creates a food item and a food-availability row in one shot.
 *
 * Body (JSON):
 *   chefId       string   — UUID of the chef user
 *   name         string   — meal name
 *   description  string?  — free-text description (optional)
 *   quantity     number   — number of servings
 *   cuisines     string[] — from cuisineColumns
 *   dietaryTags  string[] — from dietaryRestrictionColumns
 *   allergens    string[] — from allergyColumns
 *   expiresAt    string?  — ISO datetime (optional)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { chefId, name, quantity, expiresAt } = body
    const description: string | null = body?.description ?? null

    if (!chefId || typeof chefId !== 'string') {
      return NextResponse.json({ error: 'chefId is required.' }, { status: 400 })
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required.' }, { status: 400 })
    }

    const parsedQuantity = Number(quantity)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json(
        { error: 'quantity must be a positive integer.' },
        { status: 400 }
      )
    }

    const cuisines = parseSelectedColumns(body?.cuisines ?? [], cuisineColumns, 'cuisines')
    const dietaryTags = parseSelectedColumns(
      body?.dietaryTags ?? [],
      dietaryRestrictionColumns,
      'dietaryTags'
    )
    const allergens = parseSelectedColumns(body?.allergens ?? [], allergyColumns, 'allergens')

    // 1. Create the food item
    const { data: foodItem, error: foodError } = await supabase
      .from('food_items')
      .insert({ name })
      .select('id, name')
      .single()

    if (foodError) {
      return NextResponse.json({ error: foodError.message }, { status: 500 })
    }

    // 2. Create preference rows for the food item
    await Promise.all([
      createOrUpdatePreferenceRow(
        'food_item_cuisines',
        'food_item_id',
        foodItem.id,
        buildBooleanRecord(cuisines, cuisineColumns)
      ),
      createOrUpdatePreferenceRow(
        'food_item_dietary_tags',
        'food_item_id',
        foodItem.id,
        buildBooleanRecord(dietaryTags, dietaryRestrictionColumns)
      ),
      createOrUpdatePreferenceRow(
        'food_item_allergens',
        'food_item_id',
        foodItem.id,
        buildBooleanRecord(allergens, allergyColumns)
      ),
    ])

    // 3. Create the food-availability row
    const { data: availability, error: availError } = await supabase
      .from('food_availability')
      .insert({
        food_item_id: foodItem.id,
        chef_id: chefId,
        quantity: parsedQuantity,
        status: 'available',
        description,
        expires_at: expiresAt ?? null,
      })
      .select('id, food_item_id, chef_id, quantity, status, description, created_at, expires_at')
      .single()

    if (availError) {
      return NextResponse.json({ error: availError.message }, { status: 500 })
    }

    const hydratedItem = await hydrateFoodItem(foodItem)

    return NextResponse.json(
      {
        id: availability.id,
        chefId: availability.chef_id,
        name: foodItem.name,
        quantity: availability.quantity,
        status: availability.status,
        description: availability.description ?? null,
        createdAt: availability.created_at,
        expiresAt: availability.expires_at,
        assignmentsCount: 0,
        foodItem: hydratedItem,
      },
      { status: 201 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
