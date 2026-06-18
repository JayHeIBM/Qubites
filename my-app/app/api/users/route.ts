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
import { sendSlackDirectMessage } from "@/lib/slack";
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
  console.log("[POST /api/users] Request received");

  try {
    const body = await request.json();
    console.log("[POST /api/users] Parsed request body", body);

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

    console.log("[POST /api/users] Validated payload", {
      slackId,
      name,
      role,
      cuisines,
      dietaryRestrictions,
      allergies,
    });

    if (!slackId || typeof slackId !== "string") {
      console.warn("[POST /api/users] Missing or invalid slackId", { slackId });
      return NextResponse.json(
        { error: "slackId is required." },
        { status: 400 }
      );
    }

    if (name !== null && typeof name !== "string") {
      console.warn("[POST /api/users] Invalid name", { name });
      return NextResponse.json(
        { error: "name must be a string." },
        { status: 400 }
      );
    }

    if (role !== "employee" && role !== "chef") {
      console.warn("[POST /api/users] Invalid role", { role });
      return NextResponse.json(
        { error: "role must be employee or chef." },
        { status: 400 }
      );
    }

    console.log("[POST /api/users] Inserting user row");
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
      console.error("[POST /api/users] Failed to insert user row", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[POST /api/users] User row inserted", data);
    console.log("[POST /api/users] Upserting preference rows");

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

    console.log("[POST /api/users] Preference rows upserted", { userId: data.id });

    try {
      console.log("[POST /api/users] Sending Slack welcome DM", {
        slackId: data.slack_id,
      });
      await sendSlackDirectMessage(
        data.slack_id,
        `Welcome to Qubites${data.name ? `, ${data.name}` : ""}! Your food preferences have been saved.`
      );
      console.log("[POST /api/users] Slack welcome DM sent", {
        slackId: data.slack_id,
      });
    } catch (slackError) {
      console.error("[POST /api/users] Slack welcome DM failed", slackError);
    }

    const hydratedUser = await hydrateUser(data);
    console.log("[POST /api/users] Returning created user", hydratedUser);

    return NextResponse.json(hydratedUser, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    console.error("[POST /api/users] Request failed", error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
