import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  const { data: meals, error } = await supabase
    .from('meal_windows')
    .select('id, name, available_from, quantity, dietary_tags')
    .order('available_from', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get claim counts for each meal
  const mealsWithCounts = await Promise.all(
    (meals ?? []).map(async (meal) => {
      const { count } = await supabase
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('meal_window_id', meal.id)
      return { ...meal, claims_count: count ?? 0 }
    })
  )

  return NextResponse.json({ meals: mealsWithCounts })
}

export async function POST(request: Request) {
  const supabase = createClient()

  const formData = await request.formData()
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const quantity = Number(formData.get('quantity'))
  const dietary_tags = JSON.parse(formData.get('dietary_tags') as string) as string[]
  const available_from = formData.get('available_from') as string
  const available_until = formData.get('available_until') as string
  const imageFile = formData.get('image') as File | null

  let image_url: string | null = null

  if (imageFile && imageFile.size > 0) {
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`

    const { error: uploadError } = await supabase.storage
      .from('meal-images')
      .upload(fileName, buffer, { contentType: imageFile.type })

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('meal-images')
        .getPublicUrl(fileName)
      image_url = urlData.publicUrl
    }
  }

  const { error } = await supabase.from('meal_windows').insert({
    name,
    description,
    quantity,
    dietary_tags,
    available_from,
    available_until,
    image_url,
    is_active: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
