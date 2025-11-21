export const revalidate = 3600;

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Pricing</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-bold">Free</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Personal projects</p>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-bold">Pro</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Teams and companies</p>
        </div>
      </div>
    </main>
  );
}


