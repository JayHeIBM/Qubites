import { NextRequest, NextResponse } from "next/server";
import { createMealLink } from "@/app/lib/meal-link-token";

const defaultExpirySeconds = 60 * 60;
const internalApiKey = process.env.INTERNAL_API_KEY;

function getBaseUrl(request: NextRequest) {
  const envBaseUrl = process.env.APP_BASE_URL;

  if (envBaseUrl) {
    return envBaseUrl;
  }

  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!internalApiKey) {
    return NextResponse.json(
      { error: "Missing INTERNAL_API_KEY environment variable." },
      { status: 500 }
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${internalApiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    userId?: string;
    mealWindowId?: string;
    expiresInSeconds?: number;
  };

  if (!body.userId || !body.mealWindowId) {
    return NextResponse.json(
      { error: "userId and mealWindowId are required." },
      { status: 400 }
    );
  }

  const link = createMealLink({
    baseUrl: getBaseUrl(request),
    userId: body.userId,
    mealWindowId: body.mealWindowId,
    expiresInSeconds: body.expiresInSeconds ?? defaultExpirySeconds,
  });

  return NextResponse.json({ link });
}
