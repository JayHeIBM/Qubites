"use client";

import { FormEvent, useState } from "react";

type FoodTagsResponse = {
  allergens?: string[];
  restrictions?: string[];
  cuisines?: string[];
  error?: string;
  ollamaOutput?: string;
};

export default function Home() {
  const [foodName, setFoodName] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<FoodTagsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/food-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          foodName,
          description: description || undefined,
        }),
      });

      const data = (await response.json()) as FoodTagsResponse;
      setResult(data);
    } catch {
      setResult({ error: "Failed to call the Ollama API." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Ollama local model test
          </p>
          <h1 className="text-3xl font-semibold">Food tag classifier</h1>
          <p className="text-sm text-zinc-600">
            Enter a food name and optional description to classify allergens,
            restrictions, and cuisines.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="foodName">
              Food name
            </label>
            <input
              id="foodName"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500"
              value={foodName}
              onChange={(event) => setFoodName(event.target.value)}
              placeholder="Chicken tikka masala"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">
              Description (optional)
            </label>
            <textarea
              id="description"
              className="min-h-28 w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Creamy tomato curry with chicken and yogurt"
            />
          </div>

          <button
            className="rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Classifying..." : "Classify food"}
          </button>
        </form>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Response</h2>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm whitespace-pre-wrap text-zinc-100">
            {result ? JSON.stringify(result, null, 2) : "Submit a food to see tags."}
          </pre>
        </section>
      </div>
    </main>
  );
}
