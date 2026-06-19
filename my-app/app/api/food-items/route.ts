import { NextResponse } from "next/server";

import {
  createOrUpdatePreferenceRow,
  hydrateFoodItem,
  hydrateFoodItems,
} from "@/lib/backend";
import {
  allergyColumns,
  buildBooleanRecord,
  cuisineColumns,
  dietaryRestrictionColumns,
  parseSelectedColumns,
} from "@/lib/preferences";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("food_items")
    .select("id, name, image_url")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(await hydrateFoodItems(data ?? []));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = body?.name;
    const imageUrl = body?.imageUrl ?? null;
    const cuisines = parseSelectedColumns(body?.cuisines, cuisineColumns, "cuisines");
    const dietaryTags = parseSelectedColumns(
      body?.dietaryTags,
      dietaryRestrictionColumns,
      "dietaryTags"
    );
    const allergens = parseSelectedColumns(
      body?.allergens,
      allergyColumns,
      "allergens"
    );

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "name is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("food_items")
      .insert({ name, image_url: imageUrl })
      .select("id, name, image_url")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await Promise.all([
      createOrUpdatePreferenceRow(
        "food_item_cuisines",
        "food_item_id",
        data.id,
        buildBooleanRecord(cuisines, cuisineColumns)
      ),
      createOrUpdatePreferenceRow(
        "food_item_dietary_tags",
        "food_item_id",
        data.id,
        buildBooleanRecord(dietaryTags, dietaryRestrictionColumns)
      ),
      createOrUpdatePreferenceRow(
        "food_item_allergens",
        "food_item_id",
        data.id,
        buildBooleanRecord(allergens, allergyColumns)
      ),
    ]);

    return NextResponse.json(await hydrateFoodItem(data), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
