import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export async function GET() {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, food_prefs, slack_id")
    .order("slack_id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const slackId = body?.slackId;
  const foodPrefs = body?.foodPrefs ?? null;
  const name = body?.name ?? null;

  if (!slackId || typeof slackId !== "string") {
    return NextResponse.json(
      { error: "slackId is required." },
      { status: 400 }
    );
  }

  if (foodPrefs !== null && !isStringArray(foodPrefs)) {
    return NextResponse.json(
      { error: "foodPrefs must be an array of strings." },
      { status: 400 }
    );
  }

  if (name !== null && typeof name !== "string") {
    return NextResponse.json(
      { error: "name must be a string." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      slack_id: slackId,
      food_prefs: foodPrefs,
      name,
    })
    .select("id, name, food_prefs, slack_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
