import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/account-deleted")({
  head: () => ({
    meta: [
      { title: "Account deleted — LS Services" },
      {
        name: "description",
        content: "Your LS Services account and all related data have been permanently deleted.",
      },
      { property: "og:title", content: "Account deleted — LS Services" },
      { property: "og:description", content: "Your LS Services account has been deleted." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountDeletedPage,
});

function AccountDeletedPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-20 text-center">
        <CheckCircle2 className="text-brand mx-auto size-12" />
        <h1 className="font-display mt-4 text-2xl font-bold">Your account has been deleted</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Your profile, plan, billing history and document requests have all been permanently
          removed, and you&apos;ve been signed out. Thank you for using LS Services — you&apos;re
          welcome back any time.
        </p>
        <Link
          to="/jobs"
          className="bg-brand text-brand-foreground mt-8 inline-block rounded-lg px-6 py-3 text-sm font-bold"
        >
          Browse jobs
        </Link>
      </main>
      <Footer />
    </div>
  );
}
