import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground mt-2 text-sm">Last updated: {updated}</p>

        {/* PLACEHOLDER LEGAL CONTENT — must be reviewed and replaced by a
            qualified Ugandan legal practitioner before launch. */}
        <div className="bg-accent-orange-soft mt-6 flex items-start gap-2.5 rounded-lg p-4 text-xs font-medium">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Placeholder content. This document is a working draft and must be reviewed and approved by
            a qualified legal practitioner before launch.
          </span>
        </div>

        <div className="mt-8 space-y-6">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold">{heading}</h2>
      <div className="text-muted-foreground mt-2 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}
