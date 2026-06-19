import { NextResponse } from "next/server";

import { allergyColumns, dietaryRestrictionColumns } from "@/lib/preferences";
import { createMealLinkToken } from "@/app/lib/meal-link-token";
import { sendSlackDirectMessage } from "@/lib/slack";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  slack_id: string;
  name: string | null;
  dietary: Record<string, boolean | null | undefined> | null;
  allergies: Record<string, boolean | null | undefined> | null;
};

type FoodAvailabilityRecord = {
  id: string;
  food_item_id: string;
  quantity: number;
  description: string | null;
  expires_at: string | null;
  // Supabase returns a many-to-one FK join as a single object, not an array
  food_items: {
    id: string;
    name: string;
    food_item_dietary_tags: Array<Record<string, boolean | null | undefined>> | null;
    food_item_allergens: Array<Record<string, boolean | null | undefined>> | null;
    food_item_cuisines: Array<Record<string, boolean | null | undefined>> | null;
  } | null;
};

function shuffle<T>(values: T[]) {
  const items = [...values];

  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }

  return items;
}

function userMatchesFood(user: UserProfile, food: FoodAvailabilityRecord) {
  const foodItem = food.food_items ?? null;
  const dietaryTags = foodItem?.food_item_dietary_tags?.[0] ?? null;
  const allergens = foodItem?.food_item_allergens?.[0] ?? null;

  for (const column of dietaryRestrictionColumns) {
    if (user.dietary?.[column] && !dietaryTags?.[column]) {
      return false;
    }
  }

  for (const column of allergyColumns) {
    if (user.allergies?.[column] && allergens?.[column]) {
      return false;
    }
  }

  return true;
}

function buildClaimLink(baseUrl: string, assignmentId: string, userId: string, expiresAt: string | null): string {
  const mealExpiry = expiresAt ? new Date(expiresAt).getTime() : Date.now() + 24 * 60 * 60 * 1000;
  const expiresInSeconds = Math.max(60, Math.floor((mealExpiry - Date.now()) / 1000));
  const token = createMealLinkToken({
    userId,
    mealWindowId: assignmentId,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
  return `${baseUrl}/confirm?token=${encodeURIComponent(token)}`;
}

function buildAssignmentMessage(
  userName: string | null,
  food: FoodAvailabilityRecord,
  claimLink: string,
): string {
  const foodItem = food.food_items ?? null;
  const mealName = foodItem?.name ?? "a meal";

  const lines: string[] = [];

  // Greeting
  lines.push(`🍽️ *Hey${userName ? ` ${userName}` : ""}!* You've been matched with a meal.`);
  lines.push("");

  // Meal name
  lines.push(`*${mealName}*`);

  // Description
  if (food.description) {
    lines.push(food.description);
  }

  // Tags — collect active keys from each preference table
  const dietaryTags = foodItem?.food_item_dietary_tags?.[0] ?? null;
  const allergens = foodItem?.food_item_allergens?.[0] ?? null;
  const cuisines = foodItem?.food_item_cuisines?.[0] ?? null;

  const activeDietary = dietaryTags
    ? Object.entries(dietaryTags)
        .filter(([k, v]) => k !== "food_item_id" && v === true)
        .map(([k]) => k.replace(/_/g, " "))
    : [];

  const activeAllergens = allergens
    ? Object.entries(allergens)
        .filter(([k, v]) => k !== "food_item_id" && v === true)
        .map(([k]) => k.replace(/_/g, " "))
    : [];

  const activeCuisines = cuisines
    ? Object.entries(cuisines)
        .filter(([k, v]) => k !== "food_item_id" && v === true)
        .map(([k]) => k.replace(/_/g, " "))
    : [];

  if (activeCuisines.length > 0) {
    lines.push(`🌍 *Cuisine:* ${activeCuisines.join(", ")}`);
  }

  if (activeDietary.length > 0) {
    lines.push(`✅ *Dietary tags:* ${activeDietary.join(", ")}`);
  }

  if (activeAllergens.length > 0) {
    lines.push(`⚠️ *Contains allergens:* ${activeAllergens.join(", ")}`);
  }

  // Expiry
  if (food.expires_at) {
    const exp = new Date(food.expires_at);
    const formatted = exp.toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    lines.push(`⏰ *Pick up by:* ${formatted}`);
  }

  lines.push("");
  lines.push(`👉 *Claim your meal:* ${claimLink}`);
  lines.push("_This link is personal to you and expires when the meal does._");

  return lines.join("\n");
}

export async function POST(request: Request) {
  const baseUrl = process.env.APP_BASE_URL ?? new URL(request.url).origin;
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(`
      id,
      slack_id,
      name,
      user_dietary_restrictions(*),
      user_allergies(*)
    `)
    .eq("role", "employee");

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const { data: availability, error: availabilityError } = await supabase
    .from("food_availability")
    .select(`
      id,
      food_item_id,
      quantity,
      description,
      expires_at,
      food_items(
        id,
        name,
        food_item_dietary_tags(*),
        food_item_allergens(*),
        food_item_cuisines(*)
      )
    `)
    .eq("status", "available");

  if (availabilityError) {
    return NextResponse.json(
      { error: availabilityError.message },
      { status: 500 }
    );
  }

  const assignedUserIds = new Set<string>();
  const createdAssignments: Array<{
    foodAvailabilityId: string;
    userId: string;
    slackId: string;
    foodName: string;
  }> = [];

  for (const food of (availability ?? []) as unknown as FoodAvailabilityRecord[]) {
    const eligibleUsers = ((users ?? []) as Array<
      UserProfile & {
        user_dietary_restrictions: UserProfile["dietary"][];
        user_allergies: UserProfile["allergies"][];
      }
    >)
      .map((user) => ({
        id: user.id,
        slack_id: user.slack_id,
        name: user.name,
        dietary: user.user_dietary_restrictions?.[0] ?? null,
        allergies: user.user_allergies?.[0] ?? null,
      }))
      .filter((user) => !assignedUserIds.has(user.id))
      .filter((user) => userMatchesFood(user, food));

    const selectedUsers = shuffle(eligibleUsers).slice(0, food.quantity);

    for (const user of selectedUsers) {
      const { data: assignment, error } = await supabase
        .from("food_assignments")
        .insert({
          food_availability_id: food.id,
          food_item_id: food.food_item_id,
          user_id: user.id,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const claimLink = buildClaimLink(baseUrl, assignment.id, user.id, food.expires_at);

      await sendSlackDirectMessage(
        user.slack_id,
        buildAssignmentMessage(user.name, food, claimLink)
      );

      assignedUserIds.add(user.id);
      createdAssignments.push({
        foodAvailabilityId: food.id,
        userId: user.id,
        slackId: user.slack_id,
        foodName: food.food_items?.name ?? "Unknown food",
      });
    }
  }

  return NextResponse.json({ assignments: createdAssignments });
}
