import { readFile } from "node:fs/promises";
import path from "node:path";

const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const modelId = process.env.OLLAMA_MODEL || "llama3.1:8b";

type FoodTaggingInput = {
  foodName: string;
  description?: string;
};

class OllamaTaggingError extends Error {
  constructor(
    message: string,
    public readonly ollamaOutput: string
  ) {
    super(message);
    this.name = "OllamaTaggingError";
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
    "Required output shape:",
    '{"allergens":[],"restrictions":[],"cuisines":[]}',

    "Classification goal:",
    "- These tags are suggestions, so prefer including likely relevant tags rather than missing them.",
    "- If a tag is reasonably supported by the food name or description, include it.",
    "- Use common culinary knowledge when the food strongly implies ingredients, dietary patterns, or cuisine.",
    "- Only leave a category empty when there is little or no reasonable evidence.",

    "Category guidance:",
    "- allergens: include allergens that are explicit or reasonably implied by the dish or its common ingredients.",
    "- restrictions: include dietary or cultural tags that are likely compatible with the dish, unless contradicted.",
    "- cuisines: include cuisines that are reasonably associated with the dish name or description.",

    "Examples:",
    'Input: Food name: Fried Tofu | Description:',
    'Output: {"allergens":["soy"],"restrictions":["vegetarian","vegan","plant_based"],"cuisines":["chinese"]}',

    'Input: Food name: Chicken Tikka Masala | Description: Creamy tomato curry with chicken and yogurt',
    'Output: {"allergens":["dairy"],"restrictions":[],"cuisines":["indian"]}',

    'Input: Food name: Cheese Pizza | Description:',
    'Output: {"allergens":["dairy","gluten"],"restrictions":["vegetarian"],"cuisines":["italian"]}',

    "Rules:",
    "- Only use tags from the provided allowed lists.",
    "- Include only relevant tags.",
    "- Order tags in each list from most relevant to least relevant.",
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
    throw new OllamaTaggingError(
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
    if (error instanceof OllamaTaggingError) {
      throw error;
    }

    throw new OllamaTaggingError(
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

export async function generateOllamaText(prompt: string) {
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
  const content = await generateOllamaText(prompt);

  return parseFoodTaggingResult(content);
}
