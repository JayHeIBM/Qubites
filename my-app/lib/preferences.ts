export const cuisineColumns = [
  "american",
  "mexican",
  "italian",
  "french",
  "spanish",
  "portuguese",
  "greek",
  "turkish",
  "lebanese",
  "middle_eastern",
  "mediterranean",
  "indian",
  "pakistani",
  "bangladeshi",
  "chinese",
  "japanese",
  "korean",
  "thai",
  "vietnamese",
  "filipino",
  "indonesian",
  "malaysian",
  "ethiopian",
  "west_african",
  "north_african",
  "caribbean",
  "latin_american",
  "brazilian",
  "peruvian",
] as const;

export const dietaryRestrictionColumns = [
  "vegetarian",
  "vegan",
  "pescatarian",
  "halal",
  "kosher",
  "jain",
  "plant_based",
  "low_carb",
  "keto",
  "paleo",
  "low_sodium",
  "low_sugar",
  "high_protein",
  "organic",
  "no_beef",
  "no_pork",
  "no_alcohol",
  "onion_free",
  "garlic_free",
] as const;

export const allergyColumns = [
  "dairy",
  "milk",
  "egg",
  "peanut",
  "tree_nut",
  "soy",
  "wheat",
  "gluten",
  "sesame",
  "fish",
  "shellfish",
  "mustard",
  "celery",
  "sulfites",
  "lupin",
  "coconut",
  "almond",
  "cashew",
  "walnut",
  "pecan",
  "pistachio",
  "hazelnut",
  "shrimp",
  "crab",
] as const;

export type PreferenceColumn =
  | (typeof cuisineColumns)[number]
  | (typeof dietaryRestrictionColumns)[number]
  | (typeof allergyColumns)[number];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseSelectedColumns(
  value: unknown,
  allowedColumns: readonly string[],
  fieldName: string
) {
  if (value === undefined) {
    return undefined;
  }

  if (!isStringArray(value)) {
    throw new Error(`${fieldName} must be an array of strings.`);
  }

  const invalidValue = value.find((item) => !allowedColumns.includes(item));

  if (invalidValue) {
    throw new Error(`${fieldName} contains an invalid value: ${invalidValue}.`);
  }

  return value;
}

export function buildBooleanRecord(
  selectedColumns: string[] | undefined,
  allowedColumns: readonly string[]
) {
  if (!selectedColumns) {
    return undefined;
  }

  return Object.fromEntries(
    allowedColumns.map((column) => [column, selectedColumns.includes(column)])
  );
}

export function toSelectedColumns(
  record: Record<string, boolean | null | undefined> | null | undefined,
  allowedColumns: readonly string[]
) {
  if (!record) {
    return [];
  }

  return allowedColumns.filter((column) => Boolean(record[column]));
}
