import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const { data, error } = await supabase
    .from("users")
    .select("id, name, food_prefs, slack_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  const updates: {
    food_prefs?: string[] | null;
    slack_id?: string;
    name?: string | null;
  } = {};

  if ("foodPrefs" in body) {
    if (body.foodPrefs !== null && !isStringArray(body.foodPrefs)) {
      return NextResponse.json(
        { error: "foodPrefs must be an array of strings." },
        { status: 400 }
      );
    }

    updates.food_prefs = body.foodPrefs;
  }

  if ("slackId" in body) {
    if (!body.slackId || typeof body.slackId !== "string") {
      return NextResponse.json(
        { error: "slackId must be a non-empty string." },
        { status: 400 }
      );
    }

    updates.slack_id = body.slackId;
  }

  if ("name" in body) {
    if (body.name !== null && typeof body.name !== "string") {
      return NextResponse.json(
        { error: "name must be a string." },
        { status: 400 }
      );
    }

    updates.name = body.name;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields provided for update." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select("id, name, food_prefs, slack_id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const { data, error } = await supabase
    .from("users")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
