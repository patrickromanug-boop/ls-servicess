import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchMyRole } from "@/lib/admin";
import { LOGO_SRC } from "@/lib/constants";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin portal login — LS Services" },
      { name: "description", content: "Staff-only access to the LS Services admin portal." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin portal login — LS Services" },
      { property: "og:description", content: "Staff-only access to the LS Services admin portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const role = await fetchMyRole().catch(() => null);
      if (role === "admin") navigate({ to: "/admin/dashboard", replace: true });
    })();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setBusy(false);
      setError(signInError.message);
      return;
    }
    const role = await fetchMyRole().catch(() => null);
    if (role !== "admin") {
      await supabase.auth.signOut();
      setBusy(false);
      setError("You don't have access to this portal.");
      return;
    }
    navigate({ to: "/admin/dashboard", replace: true });
  }

  const input =
    "mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent-orange";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0E1738] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-lg bg-white px-2.5 py-2">
            <img src={LOGO_SRC} alt="LS Services" className="h-7 w-auto" />
          </span>
          <span className="text-accent-orange text-[11px] font-bold tracking-[0.18em] uppercase">
            Admin
          </span>
        </div>

        <h1 className="font-display mt-8 text-2xl font-bold text-white">Staff portal</h1>
        <p className="mt-1 text-sm text-white/50">
          Internal use only. Jobseeker accounts sign in on the{" "}
          <Link to="/auth/login" search={{ redirect: undefined }} className="text-accent-orange font-semibold">
            main site
          </Link>
          .
        </p>

        <form
          onSubmit={submit}
          className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6"
        >
          <label className="block text-xs font-bold tracking-wide text-white/60 uppercase">
            Work email
            <input
              className={input}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="mt-4 block text-xs font-bold tracking-wide text-white/60 uppercase">
            Password
            <input
              className={input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p className="mt-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="bg-accent-orange mt-6 w-full rounded-lg py-2.5 text-sm font-bold text-black disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in to admin portal"}
          </button>

          <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-white/40">
            <ShieldCheck className="text-accent-orange mt-0.5 h-3.5 w-3.5 shrink-0" />
            Admin accounts are created manually by LS Services. There is no sign-up here.
          </p>
        </form>
      </div>
    </main>
  );
}
