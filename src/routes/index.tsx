import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { ArrowRight, Briefcase, MessageSquare, Globe, ShieldCheck, Sparkles } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { JobFeed } from "@/components/jobs/JobFeed";
import { jobsQueryOptions } from "@/lib/jobs";
import { WHATSAPP_COMPLIANCE, WHATSAPP_HIRE_TALENT, WHATSAPP_WEB_DEV } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LS Services — Find Jobs in Uganda" },
      {
        name: "description",
        content:
          "Browse verified job openings across Uganda and apply through official channels. LS Services helps Ugandans find work.",
      },
      { property: "og:title", content: "LS Services — Find Jobs in Uganda" },
      {
        property: "og:description",
        content: "Browse verified job openings across Uganda and apply through official channels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(jobsQueryOptions());
  },
  component: Home,
});

function Home() {
  return (
    <div className="site-shell flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border/70 bg-brand text-brand-foreground overflow-hidden">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <span className="bg-brand-foreground/15 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
                <Sparkles className="size-3.5" />
                Uganda&apos;s job portal
              </span>
              <h1 className="mt-5 text-4xl leading-[1.02] font-bold sm:text-6xl lg:text-7xl">
                Helping Ugandans find work — one honest listing at a time.
              </h1>
              <p className="text-brand-foreground/80 mt-5 max-w-xl text-base sm:text-lg">
                Every open role in one place. Search, filter and apply through the official channel —
                no middlemen, no fees to browse.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#jobs"
                  className="bg-accent-orange text-accent-orange-foreground hover:bg-accent-orange/90 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-colors"
                >
                  Find work
                  <ArrowRight className="size-4" />
                </a>
                <Link
                  to="/hire-talent"
                  className="border-brand-foreground/30 hover:bg-brand-foreground/10 inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-sm font-bold transition-colors"
                >
                  Hire talent
                </Link>
              </div>
            </div>

            <div className="border-brand-foreground/15 bg-brand-foreground/8 hidden rounded-3xl border p-7 shadow-2xl lg:block">
              <p className="text-brand-foreground/60 text-xs font-bold tracking-widest">
                WHY LS SERVICES
              </p>
              <ul className="mt-5 space-y-5">
                {[
                  {
                    icon: <ShieldCheck className="size-4" />,
                    title: "Apply on the official site",
                    body: "Every listing links to the employer's own channel. No fees, no middlemen.",
                  },
                  {
                    icon: <Briefcase className="size-4" />,
                    title: "Deadlines you can see",
                    body: "Each role shows the days left, so nothing expires quietly on you.",
                  },
                  {
                    icon: <Sparkles className="size-4" />,
                    title: "Built for any phone",
                    body: "Fast search and filters that work on low data and small screens.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3.5">
                    <span className="bg-accent-orange text-accent-orange-foreground grid size-8 shrink-0 place-items-center rounded-lg">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-brand-foreground/70 mt-1 text-sm leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>


        <section id="jobs" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-14">
          <h2 className="text-2xl font-bold">Open jobs</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Fresh listings from organizations hiring across Uganda.
          </p>
          <div className="mt-6">
            <Suspense
              fallback={<p className="text-muted-foreground text-sm">Loading jobs…</p>}
            >
              <JobFeed />
            </Suspense>
          </div>
        </section>

        <section className="border-border bg-muted/55 border-y">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
            <h2 className="text-2xl font-bold">Other services</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Beyond jobs, we support individuals and small businesses.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <ServiceCard
                icon={<ShieldCheck className="size-5" />}
                title="Bulk SMS & Business Compliance Services"
                body="Reach your customers with reliable bulk SMS, and get hands-on support with business registrations, statutory documentation and staying compliant."
                href={WHATSAPP_COMPLIANCE}
                cta="Talk to us on WhatsApp"
              />
              <ServiceCard
                icon={<Globe className="size-5" />}
                title="Web Development"
                body="Websites, mobile apps and custom systems built for Ugandan businesses — from a simple landing page to a full internal platform."
                href={WHATSAPP_WEB_DEV}
                cta="Start a project"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
          <div className="border-border flex flex-col items-start gap-6 rounded-3xl border bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Briefcase className="text-accent-orange size-5" />
                Hiring? Advertise your job with us
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl text-sm">
                No account, no dashboard, no forms. Message our team directly and we&apos;ll publish
                your opening to thousands of Ugandan job seekers.
              </p>
            </div>
            <a
              href={WHATSAPP_HIRE_TALENT}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand text-brand-foreground hover:bg-brand/90 inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-colors"
            >
              <MessageSquare className="size-4" />
              Advertise a job
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="border-border flex flex-col rounded-3xl border bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
      <span className="bg-brand-soft text-brand grid size-11 place-items-center rounded-2xl">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">{body}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand mt-5 inline-flex items-center gap-1.5 text-sm font-bold"
      >
        {cta}
        <ArrowRight className="size-4" />
      </a>
    </div>
  );
}
