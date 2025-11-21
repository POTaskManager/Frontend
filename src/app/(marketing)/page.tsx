export const revalidate = 60;

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-bold">Task Manager</h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
          Kanban boards, RBAC, sprints, and more. Blazing-fast SPA experience.
        </p>
        <div className="mt-6 flex gap-3">
          <a className="rounded bg-black px-5 py-2.5 text-white dark:bg-white dark:text-black" href="/login">
            Get Started
          </a>
          <a className="rounded border px-5 py-2.5" href="/pricing">
            Pricing
          </a>
        </div>
      </header>
    </main>
  );
}


