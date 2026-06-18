"use client";

import { useState } from "react";

const cuisineOptions = [
  { label: "American", value: "american" },
  { label: "Mexican", value: "mexican" },
  { label: "Italian", value: "italian" },
  { label: "French", value: "french" },
  { label: "Spanish", value: "spanish" },
  { label: "Portuguese", value: "portuguese" },
  { label: "Greek", value: "greek" },
  { label: "Turkish", value: "turkish" },
  { label: "Lebanese", value: "lebanese" },
  { label: "Middle Eastern", value: "middle_eastern" },
  { label: "Mediterranean", value: "mediterranean" },
  { label: "Indian", value: "indian" },
  { label: "Pakistani", value: "pakistani" },
  { label: "Bangladeshi", value: "bangladeshi" },
  { label: "Chinese", value: "chinese" },
  { label: "Japanese", value: "japanese" },
  { label: "Korean", value: "korean" },
  { label: "Thai", value: "thai" },
  { label: "Vietnamese", value: "vietnamese" },
  { label: "Filipino", value: "filipino" },
  { label: "Indonesian", value: "indonesian" },
  { label: "Malaysian", value: "malaysian" },
  { label: "Ethiopian", value: "ethiopian" },
  { label: "West African", value: "west_african" },
  { label: "North African", value: "north_african" },
  { label: "Caribbean", value: "caribbean" },
  { label: "Latin American", value: "latin_american" },
  { label: "Brazilian", value: "brazilian" },
  { label: "Peruvian", value: "peruvian" },
];

const dietaryRestrictionOptions = [
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Vegan", value: "vegan" },
  { label: "Pescatarian", value: "pescatarian" },
  { label: "Halal", value: "halal" },
  { label: "Kosher", value: "kosher" },
  { label: "Jain", value: "jain" },
  { label: "Plant Based", value: "plant_based" },
  { label: "Low Carb", value: "low_carb" },
  { label: "Keto", value: "keto" },
  { label: "Paleo", value: "paleo" },
  { label: "Low Sodium", value: "low_sodium" },
  { label: "Low Sugar", value: "low_sugar" },
  { label: "High Protein", value: "high_protein" },
  { label: "Organic", value: "organic" },
  { label: "No Beef", value: "no_beef" },
  { label: "No Pork", value: "no_pork" },
  { label: "No Alcohol", value: "no_alcohol" },
  { label: "Onion Free", value: "onion_free" },
  { label: "Garlic Free", value: "garlic_free" },
];

const allergyOptions = [
  { label: "Dairy", value: "dairy" },
  { label: "Milk", value: "milk" },
  { label: "Egg", value: "egg" },
  { label: "Peanut", value: "peanut" },
  { label: "Tree Nut", value: "tree_nut" },
  { label: "Soy", value: "soy" },
  { label: "Wheat", value: "wheat" },
  { label: "Gluten", value: "gluten" },
  { label: "Sesame", value: "sesame" },
  { label: "Fish", value: "fish" },
  { label: "Shellfish", value: "shellfish" },
  { label: "Mustard", value: "mustard" },
  { label: "Celery", value: "celery" },
  { label: "Sulfites", value: "sulfites" },
  { label: "Lupin", value: "lupin" },
  { label: "Coconut", value: "coconut" },
  { label: "Almond", value: "almond" },
  { label: "Cashew", value: "cashew" },
  { label: "Walnut", value: "walnut" },
  { label: "Pecan", value: "pecan" },
  { label: "Pistachio", value: "pistachio" },
  { label: "Hazelnut", value: "hazelnut" },
  { label: "Shrimp", value: "shrimp" },
  { label: "Crab", value: "crab" },
];

function toggleValue(
  value: string,
  currentValues: string[],
  setValues: (values: string[]) => void
) {
  if (currentValues.includes(value)) {
    setValues(currentValues.filter((item) => item !== value));
    return;
  }

  setValues([...currentValues, value]);
}

export function UserForm() {
  const [name, setName] = useState("");
  const [slackId, setSlackId] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        slackId,
        role: "employee",
        cuisines: selectedCuisines,
        dietaryRestrictions: selectedDietaryRestrictions,
        allergies: selectedAllergies,
      }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus(payload.error ?? "Failed to save user information.");
      setIsSubmitting(false);
      return;
    }

    setStatus("User information saved.");
    setName("");
    setSlackId("");
    setSelectedCuisines([]);
    setSelectedDietaryRestrictions([]);
    setSelectedAllergies([]);
    setIsSubmitting(false);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-900" htmlFor="name">
          Name
        </label>
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          id="name"
          onChange={(event) => setName(event.target.value)}
          required
          type="text"
          value={name}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-900" htmlFor="slackId">
          Slack ID
        </label>
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          id="slackId"
          onChange={(event) => setSlackId(event.target.value)}
          required
          type="text"
          value={slackId}
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-zinc-900">Preferred cuisines</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {cuisineOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
            >
              <input
                checked={selectedCuisines.includes(option.value)}
                onChange={() =>
                  toggleValue(option.value, selectedCuisines, setSelectedCuisines)
                }
                type="checkbox"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-zinc-900">Dietary restrictions</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {dietaryRestrictionOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
            >
              <input
                checked={selectedDietaryRestrictions.includes(option.value)}
                onChange={() =>
                  toggleValue(
                    option.value,
                    selectedDietaryRestrictions,
                    setSelectedDietaryRestrictions
                  )
                }
                type="checkbox"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-zinc-900">Allergies</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {allergyOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
            >
              <input
                checked={selectedAllergies.includes(option.value)}
                onChange={() =>
                  toggleValue(option.value, selectedAllergies, setSelectedAllergies)
                }
                type="checkbox"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Saving..." : "Confirm"}
      </button>

      {status ? <p className="text-sm text-zinc-600">{status}</p> : null}
    </form>
  );
}
