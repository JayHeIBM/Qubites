import { readFile } from "node:fs/promises";
import path from "node:path";

const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const modelId = process.env.OLLAMA_MODEL || "qwen2.5:7b";

type FoodTaggingInput = {
  foodName: string;
  description?: string;
};

class WatsonxTaggingError extends Error {
  constructor(
    message: string,
    public readonly watsonxOutput: string
  ) {
    super(message);
    this.name = "WatsonxTaggingError";
  }
}

export type FoodTaggingResult = {
  allergens: string[];
  restrictions: string[];
  cuisines: string[];
};

let taxonomyCache: Promise<FoodTaggingResult> | undefined;

async function readTagsFile(filename: string) {
  const filePath = path.join(process.cwd(), "app", "lib", filename);
  const contents = await readFile(filePath, "utf8");

  return contents
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

async function getTaxonomy() {
  taxonomyCache ??= Promise.all([
    readTagsFile("allergens.txt"),
    readTagsFile("restrictions.txt"),
    readTagsFile("cuisines.txt"),
  ]).then(([allergens, restrictions, cuisines]) => ({
    allergens,
    restrictions,
    cuisines,
  }));

  return taxonomyCache;
}

function buildFoodTaggingPrompt(
  input: FoodTaggingInput,
  taxonomy: FoodTaggingResult
) {
  return [
    "You are a strict JSON classification API.",
    "Each request is independent and must be answered using only the current input.",
    "Return exactly one JSON object and nothing else.",
    "Do not describe the food.",
    "Do not write sentences.",
    "Do not explain your reasoning.",
    "Do not use markdown.",
    "If you are uncertain, return empty arrays for the uncertain categories.",
    "Required output shape:",
    '{"allergens":[],"restrictions":[],"cuisines":[]}',
    "Example valid output:",
    '{"allergens":["soy"],"restrictions":["vegetarian","vegan","plant_based"],"cuisines":[]}',
    "Rules:",
    "- Only use tags from the provided allowed lists.",
    "- Include only relevant tags.",
    "- Order tags in each list from most relevant to least relevant.",
    "- If no tags are relevant for a category, return an empty array.",
    "- Do not include any keys other than allergens, restrictions, and cuisines.",
    "Allowed allergens:",
    taxonomy.allergens.join(", "),
    "Allowed restrictions:",
    taxonomy.restrictions.join(", "),
    "Allowed cuisines:",
    taxonomy.cuisines.join(", "),
    `Food name: ${input.foodName}`,
    `Description: ${input.description?.trim() || ""}`,
  ].join("\n");
}

function extractJsonObject(content: string) {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new WatsonxTaggingError(
      "The local model did not return a JSON object.",
      content
    );
  }

  return content.slice(start, end + 1);
}

function parseFoodTaggingResult(content: string) {
  let parsed: Partial<FoodTaggingResult>;

  try {
    parsed = JSON.parse(extractJsonObject(content)) as Partial<FoodTaggingResult>;
  } catch (error) {
    if (error instanceof WatsonxTaggingError) {
      throw error;
    }

    throw new WatsonxTaggingError(
      "The local model returned invalid JSON.",
      content
    );
  }

  return {
    allergens: Array.isArray(parsed.allergens) ? parsed.allergens : [],
    restrictions: Array.isArray(parsed.restrictions) ? parsed.restrictions : [],
    cuisines: Array.isArray(parsed.cuisines) ? parsed.cuisines : [],
  };
}

export async function generateWatsonxText(prompt: string) {
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 150,
      },
    }),
  });

  const data = (await response.json()) as {
    error?: string;
    response?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "Failed to call the local model.");
  }

  return data.response?.trim() || "No response returned.";
}

export async function classifyFoodTags(input: FoodTaggingInput) {
  const foodName = input.foodName.trim();

  if (!foodName) {
    throw new Error("Food name is required.");
  }

  const taxonomy = await getTaxonomy();
  const prompt = buildFoodTaggingPrompt(
    {
      foodName,
      description: input.description,
    },
    taxonomy
  );
  const content = await generateWatsonxText(prompt);

  return parseFoodTaggingResult(content);
}
