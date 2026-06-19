import { NextResponse } from "next/server";

import {
  createOrUpdatePreferenceRow,
  hydrateFoodItem,
} from "@/lib/backend";
import {
  allergyColumns,
  buildBooleanRecord,
  cuisineColumns,
  dietaryRestrictionColumns,
  parseSelectedColumns,
} from "@/lib/preferences";
import { supabase } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const { data, error } = await supabase
    .from("food_items")
    .select("id, name, image_url")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Food item not found." }, { status: 404 });
  }

  return NextResponse.json(await hydrateFoodItem(data));
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const updates: {
      name?: string;
      image_url?: string | null;
    } = {};

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

    if ("imageUrl" in body) {
      updates.image_url =
        body.imageUrl === null || typeof body.imageUrl === "string"
          ? body.imageUrl
          : null;
    }

    if ("name" in body) {
      if (!body.name || typeof body.name !== "string") {
        return NextResponse.json(
          { error: "name must be a non-empty string." },
          { status: 400 }
        );
      }

      updates.name = body.name;
    }

    let foodItemRecord;

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from("food_items")
        .update(updates)
        .eq("id", id)
        .select("id, name, image_url")
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: "Food item not found." }, { status: 404 });
      }

      foodItemRecord = data;
    } else {
      const { data, error } = await supabase
        .from("food_items")
        .select("id, name, image_url")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: "Food item not found." }, { status: 404 });
      }

      foodItemRecord = data;
    }

    await Promise.all([
      createOrUpdatePreferenceRow(
        "food_item_cuisines",
        "food_item_id",
        id,
        buildBooleanRecord(cuisines, cuisineColumns)
      ),
      createOrUpdatePreferenceRow(
        "food_item_dietary_tags",
        "food_item_id",
        id,
        buildBooleanRecord(dietaryTags, dietaryRestrictionColumns)
      ),
      createOrUpdatePreferenceRow(
        "food_item_allergens",
        "food_item_id",
        id,
        buildBooleanRecord(allergens, allergyColumns)
      ),
    ]);

    return NextResponse.json(await hydrateFoodItem(foodItemRecord));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const { data, error } = await supabase
    .from("food_items")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Food item not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
