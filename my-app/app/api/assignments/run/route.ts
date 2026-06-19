import { NextResponse } from "next/server";

import { allergyColumns, dietaryRestrictionColumns, toSelectedColumns } from "@/lib/preferences";
import { createMealLinkToken } from "@/app/lib/meal-link-token";
import { sendSlackDirectMessage } from "@/lib/slack";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  slack_id: string;
  name: string | null;
  // arrays of active tag keys e.g. ["halal", "vegetarian"]
  dietaryRestrictions: string[];
  allergies: string[];
};

type FoodTags = {
  name: string;
  dietaryTags: string[];   // active dietary tag keys on the food
  allergens: string[];     // active allergen keys on the food
};

function shuffle<T>(values: T[]) {
  const items = [...values];

  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }

  return items;
}

/**
 * Fetch the food item's dietary tags and allergens directly from their own tables.
 * This avoids the fragile nested-join approach where a missing row returns null
 * and causes everyone with a restriction to be incorrectly excluded.
 */
async function getFoodTags(foodItemId: string): Promise<FoodTags> {
  const [nameRes, tagsRes, allergensRes] = await Promise.all([
    supabase.from("food_items").select("name").eq("id", foodItemId).single(),
    supabase.from("food_item_dietary_tags").select("*").eq("food_item_id", foodItemId).maybeSingle(),
    supabase.from("food_item_allergens").select("*").eq("food_item_id", foodItemId).maybeSingle(),
  ]);

  return {
    name: nameRes.data?.name ?? "Unknown",
    dietaryTags: toSelectedColumns(
      tagsRes.data as Record<string, boolean | null | undefined> | null,
      dietaryRestrictionColumns
    ),
    allergens: toSelectedColumns(
      allergensRes.data as Record<string, boolean | null | undefined> | null,
      allergyColumns
    ),
  };
}

/**
 * Returns true if the user can receive this food.
 *
 * Dietary restriction: if the user has a restriction (e.g. halal) the food
 * MUST also be tagged with that restriction — otherwise exclude.
 *
 * Allergen: if the user is allergic to something AND the food contains it — exclude.
 */
function userMatchesFood(user: UserProfile, food: FoodTags): boolean {
  // Dietary restrictions — food must satisfy ALL of the user's restrictions
  for (const restriction of user.dietaryRestrictions) {
    if (!food.dietaryTags.includes(restriction)) {
      return false;
    }
  }

  // Allergens — food must NOT contain any of the user's allergens
  for (const allergen of user.allergies) {
    if (food.allergens.includes(allergen)) {
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

type AvailabilityRow = {
  id: string;
  food_item_id: string;
  quantity: number;
  description: string | null;
  expires_at: string | null;
};

function buildAssignmentMessage(
  userName: string | null,
  mealName: string,
  description: string | null,
  foodTags: FoodTags,
  expiresAt: string | null,
  claimLink: string,
): string {
  const lines: string[] = [];

  lines.push(`🍽️ *Hey${userName ? ` ${userName}` : ""}!* You've been matched with a meal.`);
  lines.push("");
  lines.push(`*${mealName}*`);

  if (description) {
    lines.push(description);
  }

  if (foodTags.dietaryTags.length > 0) {
    lines.push(`✅ *Dietary tags:* ${foodTags.dietaryTags.map(t => t.replace(/_/g, " ")).join(", ")}`);
  }

  if (foodTags.allergens.length > 0) {
    lines.push(`⚠️ *Contains allergens:* ${foodTags.allergens.map(a => a.replace(/_/g, " ")).join(", ")}`);
  }

  if (expiresAt) {
    const exp = new Date(expiresAt);
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

  const body = await request.json().catch(() => ({})) as { availabilityId?: string };
  const availabilityId = body?.availabilityId ?? null;

  // ── Load employees with their preference rows ────────────────────────────────
  const { data: rawUsers, error: usersError } = await supabase
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

  // Flatten nested preference rows into clean string arrays
  type RawUser = {
    id: string;
    slack_id: string;
    name: string | null;
    user_dietary_restrictions: Array<Record<string, boolean | null | undefined>>;
    user_allergies: Array<Record<string, boolean | null | undefined>>;
  };

  const allUsers: UserProfile[] = (rawUsers ?? []).map((u) => {
    const raw = u as unknown as RawUser;
    return {
      id: raw.id,
      slack_id: raw.slack_id,
      name: raw.name,
      dietaryRestrictions: toSelectedColumns(
        raw.user_dietary_restrictions?.[0] ?? null,
        dietaryRestrictionColumns
      ),
      allergies: toSelectedColumns(
        raw.user_allergies?.[0] ?? null,
        allergyColumns
      ),
    };
  });

  // ── Load availability rows ───────────────────────────────────────────────────
  let availabilityQuery = supabase
    .from("food_availability")
    .select("id, food_item_id, quantity, description, expires_at")
    .eq("status", "available");

  if (availabilityId) {
    availabilityQuery = availabilityQuery.eq("id", availabilityId);
  }

  const { data: availability, error: availabilityError } = await availabilityQuery;

  if (availabilityError) {
    return NextResponse.json({ error: availabilityError.message }, { status: 500 });
  }

  const assignedUserIds = new Set<string>();
  const createdAssignments: Array<{
    foodAvailabilityId: string;
    userId: string;
    userName: string | null;
    slackId: string;
    foodName: string;
    slackSent: boolean;
    slackError: string | null;
  }> = [];

  for (const food of (availability ?? []) as AvailabilityRow[]) {
    // Fetch food tags via direct queries — clean boolean columns, no nested join issues
    const foodTags = await getFoodTags(food.food_item_id);

    const eligibleUsers = allUsers
      .filter((user) => !assignedUserIds.has(user.id))
      .filter((user) => userMatchesFood(user, foodTags));

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

      let slackSent = false;
      let slackError: string | null = null;
      try {
        await sendSlackDirectMessage(
          user.slack_id,
          buildAssignmentMessage(user.name, foodTags.name, food.description, foodTags, food.expires_at, claimLink)
        );
        slackSent = true;
      } catch (err) {
        slackError = err instanceof Error ? err.message : "Unknown Slack error";
        console.error("[assignments/run] Slack DM failed for user", user.id, slackError);
      }

      assignedUserIds.add(user.id);
      createdAssignments.push({
        foodAvailabilityId: food.id,
        userId: user.id,
        userName: user.name,
        slackId: user.slack_id,
        foodName: foodTags.name,
        slackSent,
        slackError,
      });
    }
  }

  return NextResponse.json({ assignments: createdAssignments });
}
