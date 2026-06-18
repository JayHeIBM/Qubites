import { NextResponse } from "next/server";

import { allergyColumns, dietaryRestrictionColumns } from "@/lib/preferences";
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
  expires_at: string | null;
  food_items: {
    id: string;
    name: string;
    food_item_dietary_tags: Array<Record<string, boolean | null | undefined>> | null;
    food_item_allergens: Array<Record<string, boolean | null | undefined>> | null;
  }[] | null;
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
  const foodItem = food.food_items?.[0] ?? null;
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

export async function POST() {
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
      expires_at,
      food_items(
        id,
        name,
        food_item_dietary_tags(*),
        food_item_allergens(*)
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

  for (const food of (availability ?? []) as FoodAvailabilityRecord[]) {
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
      const { error } = await supabase.from("food_assignments").insert({
        food_availability_id: food.id,
        food_item_id: food.food_item_id,
        user_id: user.id,
        status: "pending",
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await sendSlackDirectMessage(
        user.slack_id,
        `You have been matched with ${food.food_items?.[0]?.name ?? "a meal"}. Please pick it up before it is gone.`
      );

      assignedUserIds.add(user.id);
      createdAssignments.push({
        foodAvailabilityId: food.id,
        userId: user.id,
        slackId: user.slack_id,
        foodName: food.food_items?.[0]?.name ?? "Unknown food",
      });
    }
  }

  return NextResponse.json({ assignments: createdAssignments });
}
