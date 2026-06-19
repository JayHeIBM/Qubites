import { NextResponse } from "next/server";

import { hydrateFoodAvailabilityRow } from "@/lib/backend";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("food_availability")
    .select("id, food_item_id, chef_id, quantity, status, description, created_at, expires_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    await Promise.all((data ?? []).map(hydrateFoodAvailabilityRow))
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const foodItemId = body?.foodItemId;
  const chefId = body?.chefId;
  const quantity = body?.quantity;
  const status = body?.status ?? "available";
  const description = body?.description ?? null;
  const expiresAt = body?.expiresAt ?? null;

  if (!foodItemId || typeof foodItemId !== "string") {
    return NextResponse.json(
      { error: "foodItemId is required." },
      { status: 400 }
    );
  }

  if (!chefId || typeof chefId !== "string") {
    return NextResponse.json(
      { error: "chefId is required." },
      { status: 400 }
    );
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json(
      { error: "quantity must be a positive integer." },
      { status: 400 }
    );
  }

  if (!["available", "claimed", "expired"].includes(status)) {
    return NextResponse.json(
      { error: "status is invalid." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("food_availability")
    .insert({
      food_item_id: foodItemId,
      chef_id: chefId,
      quantity,
      status,
      description,
      expires_at: expiresAt,
    })
    .select("id, food_item_id, chef_id, quantity, status, description, created_at, expires_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(await hydrateFoodAvailabilityRow(data), { status: 201 });
}
