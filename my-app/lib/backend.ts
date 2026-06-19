import { PostgrestSingleResponse } from "@supabase/supabase-js";

import {
  allergyColumns,
  cuisineColumns,
  dietaryRestrictionColumns,
  toSelectedColumns,
} from "@/lib/preferences";
import { supabase } from "@/lib/supabase";

type UserRow = {
  id: string;
  slack_id: string;
  name: string | null;
  role: string;
};

type FoodItemRow = {
  id: string;
  name: string;
};

type FoodAvailabilityRow = {
  id: string;
  food_item_id: string;
  chef_id: string;
  quantity: number;
  status: string;
  description: string | null;
  created_at: string;
  expires_at: string | null;
};

async function getSingleTableRecord(
  table: string,
  foreignKey: string,
  id: string,
  columns: readonly string[]
) {
  const { data, error } = await supabase
    .from(table)
    .select([foreignKey, ...columns].join(", "))
    .eq(foreignKey, id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Record<string, boolean | null | undefined> | null;
}

export async function hydrateUser(user: UserRow) {
  const [cuisines, dietaryRestrictions, allergies] = await Promise.all([
    getSingleTableRecord("user_cuisines", "user_id", user.id, cuisineColumns),
    getSingleTableRecord(
      "user_dietary_restrictions",
      "user_id",
      user.id,
      dietaryRestrictionColumns
    ),
    getSingleTableRecord("user_allergies", "user_id", user.id, allergyColumns),
  ]);

  return {
    id: user.id,
    slackId: user.slack_id,
    name: user.name,
    role: user.role,
    cuisines: toSelectedColumns(cuisines, cuisineColumns),
    dietaryRestrictions: toSelectedColumns(
      dietaryRestrictions,
      dietaryRestrictionColumns
    ),
    allergies: toSelectedColumns(allergies, allergyColumns),
  };
}

export async function hydrateUsers(users: UserRow[]) {
  return Promise.all(users.map(hydrateUser));
}

export async function hydrateFoodItem(foodItem: FoodItemRow) {
  const [cuisines, dietaryTags, allergens] = await Promise.all([
    getSingleTableRecord(
      "food_item_cuisines",
      "food_item_id",
      foodItem.id,
      cuisineColumns
    ),
    getSingleTableRecord(
      "food_item_dietary_tags",
      "food_item_id",
      foodItem.id,
      dietaryRestrictionColumns
    ),
    getSingleTableRecord(
      "food_item_allergens",
      "food_item_id",
      foodItem.id,
      allergyColumns
    ),
  ]);

  return {
    id: foodItem.id,
    name: foodItem.name,
    cuisines: toSelectedColumns(cuisines, cuisineColumns),
    dietaryTags: toSelectedColumns(dietaryTags, dietaryRestrictionColumns),
    allergens: toSelectedColumns(allergens, allergyColumns),
  };
}

export async function hydrateFoodItems(foodItems: FoodItemRow[]) {
  return Promise.all(foodItems.map(hydrateFoodItem));
}

export async function createOrUpdatePreferenceRow(
  table: string,
  foreignKey: string,
  id: string,
  payload: Record<string, boolean> | undefined
) {
  if (!payload) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = (await (supabase.from(table) as any).upsert({
    [foreignKey]: id,
    ...payload,
  })) as PostgrestSingleResponse<null>;

  if (response.error) {
    throw response.error;
  }
}

export async function hydrateFoodAvailabilityRow(availability: FoodAvailabilityRow) {
  const { data: foodItem, error } = await supabase
    .from("food_items")
    .select("id, name")
    .eq("id", availability.food_item_id)
    .single();

  if (error) {
    throw error;
  }

  return {
    id: availability.id,
    chefId: availability.chef_id,
    quantity: availability.quantity,
    status: availability.status,
    description: availability.description,
    createdAt: availability.created_at,
    expiresAt: availability.expires_at,
    foodItem: await hydrateFoodItem(foodItem as FoodItemRow),
  };
}
