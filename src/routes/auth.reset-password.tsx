import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth/AuthShell";

const schema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(72);

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — LS Services" },
      { name: "description", content: "Choose a new password for your LS Services account." },
      { property: "og:title", content: "Set a new password — LS Services" },
      { property: "og:description", content: "Choose a new password for your LS Services account." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/auth/reset-password" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/jobs", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <AuthShell title="Set a new password" subtitle="Choose something you'll remember.">
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold">New password</span>
            <input
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              className="border-border focus:border-brand mt-1 h-11 w-full rounded-lg border bg-card px-3 text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="bg-brand text-brand-foreground w-full rounded-lg py-3 text-sm font-bold disabled:opacity-60"
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      </AuthShell>
      <Footer />
    </div>
  );
}
