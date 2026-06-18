import { createHmac, timingSafeEqual } from "node:crypto";

const tokenSecret = process.env.MEAL_LINK_TOKEN_SECRET;

export type MealLinkPayload = {
  userId: string;
  mealWindowId: string;
  exp: number;
};

function getTokenSecret() {
  if (!tokenSecret) {
    throw new Error("Missing MEAL_LINK_TOKEN_SECRET environment variable.");
  }

  return tokenSecret;
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getTokenSecret()).update(value).digest("base64url");
}

export function createMealLinkToken(payload: MealLinkPayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyMealLinkToken(token: string) {
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  let payload: MealLinkPayload;

  try {
    payload = JSON.parse(fromBase64Url(encodedPayload)) as MealLinkPayload;
  } catch {
    return null;
  }

  if (
    typeof payload.userId !== "string" ||
    typeof payload.mealWindowId !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export function createMealLink({
  baseUrl,
  userId,
  mealWindowId,
  expiresInSeconds,
}: {
  baseUrl: string;
  userId: string;
  mealWindowId: string;
  expiresInSeconds: number;
}) {
  const payload: MealLinkPayload = {
    userId,
    mealWindowId,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const token = createMealLinkToken(payload);

  return `${baseUrl}/meal-link?token=${encodeURIComponent(token)}`;
}
