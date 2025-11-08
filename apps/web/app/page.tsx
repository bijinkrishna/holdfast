import Link from "next/link";

import { getMissingEnvKeys, getServerEnv } from "@/lib/env";

const SECRET_KEYS = new Set(["SUPABASE_ANON_KEY", "TWILIO_AUTH_TOKEN"]);

function maskSecret(value: string | undefined) {
  if (!value) return "not set";
  return `${value.slice(0, 4)}•••${value.slice(-3)}`;
}

export default function Home() {
  const env = getServerEnv();
  const missing = getMissingEnvKeys();

  return (
    <main className="flex min-h-screen flex-col gap-12 bg-slate-950 px-6 py-12 text-slate-100">
      <header>
        <p className="text-sm uppercase tracking-[0.35rem] text-teal-300">
          DM HoldFast
        </p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
          Welcome to the unified portal
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300">
          This Next.js 14 app router experience connects to the Express API and
          Supabase services through shared type definitions. Start by wiring
          your Supabase + Twilio credentials and running both `web` and `api`
          workspaces.
        </p>
      </header>

      <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-medium text-teal-200">Environment map</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(env).map(([key, value]) => (
            <div
              key={key}
              className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
            >
              <span className="text-xs uppercase text-slate-400">{key}</span>
              <span className="mt-1 font-mono text-sm text-slate-100">
                {SECRET_KEYS.has(key) ? maskSecret(value) : value ?? "not set"}
              </span>
            </div>
          ))}
        </div>
        {missing.length > 0 && (
          <p className="text-sm text-amber-300">
            Missing: {missing.join(", ")} — add them to your `.env` file before
            deploying.
          </p>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-medium text-teal-200">Next steps</h2>
        <ul className="grid gap-3 text-sm text-slate-200">
          <li>
            • Start the API server:
            <code className="ml-2 rounded bg-slate-800 px-2 py-1 font-mono text-xs text-teal-200">
              npm run dev:api
            </code>
          </li>
          <li>
            • Check the health endpoint at{" "}
            <Link
              href="http://localhost:4000/health"
              className="text-teal-300 underline decoration-dotted underline-offset-4"
            >
              localhost:4000/health
            </Link>
          </li>
          <li>
            • Launch the web portal:
            <code className="ml-2 rounded bg-slate-800 px-2 py-1 font-mono text-xs text-teal-200">
              npm run dev:web
            </code>
          </li>
        </ul>
      </section>
    </main>
  );
}
