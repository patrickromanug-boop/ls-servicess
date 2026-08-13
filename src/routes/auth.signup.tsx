import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/auth";
import { AuthShell, GoogleButton } from "@/components/auth/AuthShell";
import { ensureWebSubscription, updateProfile } from "@/lib/account";

const schema = z.object({
  fullName: z.string().trim().min(2, { message: "Enter your full name" }).max(100),
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  phone: z.string().trim().min(9, { message: "Enter your phone number" }).max(20),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72),
});

export const Route = createFileRoute("/auth/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search['redirect'] === "string" ? (search['redirect'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create your account — LS Services" },
      {
        name: "description",
        content: "Create a free LS Services account to apply for jobs across Uganda.",
      },
      { property: "og:title", content: "Create your account — LS Services" },
      { property: "og:description", content: "Create a free account to apply for jobs across Uganda." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/auth/signup" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const safeRedirect = redirect && redirect.startsWith("/") ? redirect : "/jobs";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please agree to the Terms & Conditions and Privacy Policy");
      return;
    }
    const parsed = schema.safeParse({ fullName, email, phone, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
        emailRedirectTo: `${window.location.origin}/plans`,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // With email confirmation enabled, there is no session yet.
    if (!data.session) {
      setSent(true);
      return;
    }
    // Save the profile (phone drives the trial-abuse check), create the trial
    // row, then send them to the plans screen before the dashboard.
    try {
      await updateProfile(data.user!.id, {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
      });
      await ensureWebSubscription();
    } catch {
      // Non-fatal: the plans screen retries this.
    }
    navigate({ to: "/plans", replace: true });
  }

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <AuthShell title="Check your email" subtitle="One quick step before you can apply.">
          <p className="text-sm">
            We sent a confirmation link to <strong>{email}</strong>. Open it to activate your account,
            then come back and sign in to continue your application.
          </p>
          <Link
            to="/auth/login"
            search={{ redirect: "/plans" }}
            className="bg-brand text-brand-foreground mt-5 block rounded-lg py-3 text-center text-sm font-bold"
          >
            Go to sign in
          </Link>
        </AuthShell>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <AuthShell title="Create your account" subtitle="Free to join. Apply to jobs in minutes.">
        <div className="bg-brand-soft text-brand flex items-start gap-2 rounded-lg p-3 text-xs font-medium">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <span>
            Your information is safe with us. We never sell or share your data — it&apos;s only used to
            help you find work or prepare your documents.
          </span>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <Field label="Full name" type="text" value={fullName} onChange={setFullName} />
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field label="Phone number" type="tel" value={phone} onChange={setPhone} autoComplete="tel" />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />

          <label className="flex items-start gap-2.5 pt-1 text-xs">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="accent-brand mt-0.5 size-4"
            />
            <span>
              I agree to the{" "}
              <Link to="/terms" className="text-brand font-semibold">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-brand font-semibold">
                Privacy Policy
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={busy || !agreed}
            className="bg-brand text-brand-foreground w-full rounded-lg py-3 text-sm font-bold disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <span className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs">or</span>
          <span className="bg-border h-px flex-1" />
        </div>

        <GoogleButton onClick={() => signInWithGoogle("/dashboard")} label="Sign up with Google" />

        <p className="text-muted-foreground mt-5 text-center text-sm">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            search={{ redirect: "/plans" }}
            className="text-brand font-semibold"
          >
            Sign in
          </Link>
        </p>
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
