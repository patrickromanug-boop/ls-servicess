import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/auth";
import { GoogleButton, AuthShell } from "@/components/auth/AuthShell";

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72),
});

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — LS Services" },
      { name: "description", content: "Sign in to your LS Services account to continue your job application." },
      { property: "og:title", content: "Sign in — LS Services" },
      { property: "og:description", content: "Sign in to continue your job application." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/auth/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const safeRedirect = redirect && redirect.startsWith("/") ? redirect : "/jobs";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: safeRedirect, replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <AuthShell title="Welcome back" subtitle="Sign in to continue where you left off.">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-brand text-brand-foreground w-full rounded-lg py-3 text-sm font-bold disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <span className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs">or</span>
          <span className="bg-border h-px flex-1" />
        </div>

        <GoogleButton onClick={() => signInWithGoogle(safeRedirect)} />

        <div className="mt-5 space-y-2 text-center text-sm">
          <Link to="/auth/forgot-password" className="text-brand block font-semibold">
            Forgot your password?
          </Link>
          <p className="text-muted-foreground">
            New here?{" "}
            <Link
              to="/auth/signup"
              search={{ redirect: safeRedirect }}
              className="text-brand font-semibold"
            >
              Create an account
            </Link>
          </p>
        </div>
      </AuthShell>
      <Footer />
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="border-border focus:border-brand mt-1 h-11 w-full rounded-lg border bg-card px-3 text-sm outline-none"
      />
    </label>
  );
}
