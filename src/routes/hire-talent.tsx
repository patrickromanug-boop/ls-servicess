import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Megaphone, Users, Clock } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WHATSAPP_HIRE_TALENT } from "@/lib/constants";

export const Route = createFileRoute("/hire-talent")({
  head: () => ({
    meta: [
      { title: "Hire Talent in Uganda — Advertise a Job | LS Services" },
      {
        name: "description",
        content:
          "Advertise your job opening to thousands of Ugandan job seekers. No account or forms — message the LS Services team and we publish it for you.",
      },
      { property: "og:title", content: "Hire Talent in Uganda — Advertise a Job" },
      {
        property: "og:description",
        content: "Advertise your job opening to thousands of Ugandan job seekers.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/hire-talent" }],
  }),
  component: HireTalentPage,
});

const STEPS = [
  {
    icon: <MessageSquare className="size-5" />,
    title: "Message our team",
    body: "Tap the button below and tell us the role you're hiring for. No sign-up, no dashboard.",
  },
  {
    icon: <Megaphone className="size-5" />,
    title: "We publish your listing",
    body: "We format and post the opening with your requirements, deadline and official application link.",
  },
  {
    icon: <Users className="size-5" />,
    title: "Candidates reach you",
    body: "Job seekers apply through your own official channel — you stay in full control of screening.",
  },
];

function HireTalentPage() {
  return (
    <div className="site-shell flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="page-grid border-b border-border/70 bg-brand text-brand-foreground">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">
              Hire talent. Advertise a job in minutes.
            </h1>
            <p className="text-brand-foreground/80 mt-4 max-w-xl">
              Employers don&apos;t need an account here — intentionally. Send us the details and your
              opening goes live in front of Ugandans actively looking for work.
            </p>
            <a
              href={WHATSAPP_HIRE_TALENT}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent-orange text-accent-orange-foreground hover:bg-accent-orange/90 mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-colors"
            >
              <MessageSquare className="size-4" />
              Advertise a job on WhatsApp
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
          <p className="eyebrow">Simple by design</p><h2 className="mt-2 text-3xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="border-border rounded-3xl border bg-card p-6 shadow-sm">
                <span className="bg-brand-soft text-brand grid size-11 place-items-center rounded-2xl">
                  {step.icon}
                </span>
                <p className="text-muted-foreground mt-4 text-xs font-bold">STEP {i + 1}</p>
                <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="border-border bg-accent-orange-soft/50 mt-10 flex items-start gap-3 rounded-3xl border p-6">
            <Clock className="text-accent-orange mt-0.5 size-5 shrink-0" />
            <p className="text-sm">
              <strong>Turnaround:</strong> most listings are reviewed and published the same working
              day. Urgent roles can be prioritised — just mention it in your message.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
