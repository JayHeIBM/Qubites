import { UserForm } from "./user-form";

export default function UserPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            User setup
          </p>
          <h1 className="text-3xl font-semibold">Tell us your food preferences</h1>
          <p className="text-sm text-zinc-600">
            Fill in your user information, select your food preferences and dietary restrictions, then confirm to save the details in the database.
          </p>
        </div>

        <UserForm />
      </div>
    </main>
  );
}
