import { NextResponse } from "next/server";

import {
  createOrUpdatePreferenceRow,
  hydrateUser,
  hydrateUsers,
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
    .from("users")
    .select("id, name, slack_id, role")
    .order("slack_id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(await hydrateUsers(data ?? []));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slackId = body?.slackId;
    const name = body?.name ?? null;
    const role = body?.role ?? "employee";
    const cuisines = parseSelectedColumns(body?.cuisines, cuisineColumns, "cuisines");
    const dietaryRestrictions = parseSelectedColumns(
      body?.dietaryRestrictions,
      dietaryRestrictionColumns,
      "dietaryRestrictions"
    );
    const allergies = parseSelectedColumns(
      body?.allergies,
      allergyColumns,
      "allergies"
    );

    if (!slackId || typeof slackId !== "string") {
      return NextResponse.json(
        { error: "slackId is required." },
        { status: 400 }
      );
    }

    if (name !== null && typeof name !== "string") {
      return NextResponse.json(
        { error: "name must be a string." },
        { status: 400 }
      );
    }

    if (role !== "employee" && role !== "chef") {
      return NextResponse.json(
        { error: "role must be employee or chef." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        slack_id: slackId,
        name,
        role,
      })
      .select("id, name, slack_id, role")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await Promise.all([
      createOrUpdatePreferenceRow(
        "user_cuisines",
        "user_id",
        data.id,
        buildBooleanRecord(cuisines, cuisineColumns)
      ),
      createOrUpdatePreferenceRow(
        "user_dietary_restrictions",
        "user_id",
        data.id,
        buildBooleanRecord(dietaryRestrictions, dietaryRestrictionColumns)
      ),
      createOrUpdatePreferenceRow(
        "user_allergies",
        "user_id",
        data.id,
        buildBooleanRecord(allergies, allergyColumns)
      ),
    ]);

    return NextResponse.json(await hydrateUser(data), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
