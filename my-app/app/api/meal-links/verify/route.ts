import { NextRequest, NextResponse } from "next/server";
import { verifyMealLinkToken } from "@/app/lib/meal-link-token";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  const payload = verifyMealLinkToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }

  return NextResponse.json(payload);
}
