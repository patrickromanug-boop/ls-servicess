import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/auth";
import { AuthShell, GoogleButton } from "@/components/auth/AuthShell";

const emailSchema = z.string().trim().email({ message: "Enter a valid email address" }).max(255);

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — LS Services" },
      {
        name: "description",
        content: "Reset the password for your LS Services job seeker account.",
      },
      { property: "og:title", content: "Reset your password — LS Services" },
      { property: "og:description", content: "Reset the password for your LS Services account." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/auth/forgot-password" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [googleOnly, setGoogleOnly] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setBusy(false);
    if (error) {
      // Supabase returns an error for identities without a password (e.g.
      // Google-only accounts). Guide the user to Google instead of a reset email.
      if (/provider|password|identity|oauth/i.test(error.message)) {
        setGoogleOnly(true);
        return;
      }
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <AuthShell
        title="Forgot your password?"
        subtitle="We'll email you a secure link to set a new one."
      >
        {googleOnly ? (
          <div>
            <div className="bg-accent-orange-soft flex items-start gap-2 rounded-lg p-3 text-xs font-medium">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                This account was created with Google, so it has no password to reset. Use
                &quot;Continue with Google&quot; to sign in instead.
              </span>
            </div>
            <div className="mt-4">
              <GoogleButton onClick={() => signInWithGoogle("/jobs")} />
            </div>
          </div>
        ) : sent ? (
          <div>
            <p className="text-sm">
              If an account exists for <strong>{email}</strong>, a password reset link is on its way.
              Check your inbox and spam folder.
            </p>
            <p className="text-muted-foreground mt-3 text-xs">
              Signed up with Google? You won&apos;t get a reset email — use &quot;Continue with
              Google&quot; on the sign-in page.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold">Email</span>
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="border-border focus:border-brand mt-1 h-11 w-full rounded-lg border bg-card px-3 text-sm outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="bg-brand text-brand-foreground w-full rounded-lg py-3 text-sm font-bold disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-muted-foreground mt-5 text-center text-sm">
          <Link to="/auth/login" className="text-brand font-semibold">
            Back to sign in
          </Link>
        </p>
      </AuthShell>
      <Footer />
    </div>
  );
}
