import { NextResponse } from "next/server";
import { classifyFoodTags } from "../../lib/ollama";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      foodName?: string;
      description?: string;
    };

    const foodName = body.foodName?.trim() || "";

    if (!foodName) {
      return NextResponse.json(
        { error: "foodName is required." },
        { status: 400 }
      );
    }

    const tags = await classifyFoodTags({
      foodName,
      description: body.description,
    });

    return NextResponse.json(tags);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Ollama error.";
    const ollamaOutput =
      error instanceof Error && "ollamaOutput" in error
        ? String(error.ollamaOutput)
        : undefined;

    return NextResponse.json(
      {
        error: message,
        ollamaOutput,
      },
      { status: 500 }
    );
  }
}
