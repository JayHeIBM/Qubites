import { generateWatsonxText } from "./lib/watsonx";

export default async function Home() {
  let output: string;

  try {
    output = await generateWatsonxText(
      "Write one short sentence describing why a quinoa bowl could be a healthy lunch."
    );
  } catch (error) {
    output = error instanceof Error ? error.message : "Unknown watsonx.ai error.";
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            IBM watsonx.ai test
          </p>
          <h1 className="text-3xl font-semibold">Basic watsonx.ai call</h1>
          <p className="text-sm text-zinc-600">
            This page makes a server-side call using your configured environment variables.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Prompt</h2>
          <p className="rounded-lg bg-zinc-100 p-4 text-sm text-zinc-700">
            Write one short sentence describing why a quinoa bowl could be a healthy lunch.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Response</h2>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm whitespace-pre-wrap text-zinc-100">
            {output}
          </pre>
        </section>
      </div>
    </main>
  );
}
