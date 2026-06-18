"use client";

import { useState } from "react";

const foodOptions = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
];

const dietaryRestrictionOptions = [
  "No Pork",
  "No Beef",
  "No Seafood",
  "No Shellfish",
  "Low Sodium",
  "No Added Sugar",
];

export function UserForm() {
  const [name, setName] = useState("");
  const [slackId, setSlackId] = useState("");
  const [selectedFoodPrefs, setSelectedFoodPrefs] = useState<string[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleValue(value: string, currentValues: string[], setValues: (values: string[]) => void) {
    if (currentValues.includes(value)) {
      setValues(currentValues.filter((item) => item !== value));
      return;
    }

    setValues([...currentValues, value]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const foodPrefs = [...selectedFoodPrefs, ...selectedRestrictions];

    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        slackId,
        foodPrefs,
      }),
    });

    const payload = (await response.json()) as { error?: string; name?: string };

    if (!response.ok) {
      setStatus(payload.error ?? "Failed to save user information.");
      setIsSubmitting(false);
      return;
    }

    setStatus("User information saved.");
    setName("");
    setSlackId("");
    setSelectedFoodPrefs([]);
    setSelectedRestrictions([]);
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
        <legend className="text-sm font-medium text-zinc-900">Food preferences</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {foodOptions.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
            >
              <input
                checked={selectedFoodPrefs.includes(option)}
                onChange={() => toggleValue(option, selectedFoodPrefs, setSelectedFoodPrefs)}
                type="checkbox"
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-zinc-900">Dietary restrictions</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {dietaryRestrictionOptions.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
            >
              <input
                checked={selectedRestrictions.includes(option)}
                onChange={() => toggleValue(option, selectedRestrictions, setSelectedRestrictions)}
                type="checkbox"
              />
              {option}
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
