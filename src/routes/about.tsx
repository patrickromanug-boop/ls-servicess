import { createFileRoute } from "@tanstack/react-router";
import { Target, Eye, HeartHandshake, Briefcase } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About LS Services — Helping Ugandans Find Work" },
      {
        name: "description",
        content:
          "LS Services is a Ugandan company built around one objective: helping Ugandans find jobs, with honest listings and practical document support.",
      },
      { property: "og:title", content: "About LS Services — Helping Ugandans Find Work" },
      {
        property: "og:description",
        content: "A Ugandan company built around helping Ugandans find jobs.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

const VALUES = [
  {
    icon: <Target className="size-5" />,
    title: "One clear objective",
    body: "Everything we build exists to shorten the distance between a Ugandan looking for work and a real opening.",
  },
  {
    icon: <Eye className="size-5" />,
    title: "Honest listings",
    body: "Every job carries its source, its deadline and its official application link. You always apply through the employer's own channel.",
  },
  {
    icon: <HeartHandshake className="size-5" />,
    title: "Respect for your data",
    body: "We never sell or share your information. It is used only to help you find work or prepare your documents.",
  },
  {
    icon: <Briefcase className="size-5" />,
    title: "Practical support",
    body: "Beyond listings, we help with the paperwork side of work and business so opportunities don't slip away over documentation.",
  },
];

function AboutPage() {
  return (
    <div className="site-shell flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="page-grid border-border border-b bg-brand-soft/45">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-accent-orange text-xs font-bold tracking-widest">ABOUT US</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
              We exist to help Ugandans find work.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-2xl leading-relaxed">
              LS Services is a Ugandan company. We gather job openings from employers,
              organisations and public notices, publish them in one place that is fast on any phone,
              and keep the path to applying as short as possible. Alongside the job portal, we support
              individuals and small businesses with the documentation and communication work that
              often stands between them and an opportunity.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
          <p className="eyebrow">The LS promise</p><h2 className="mt-2 text-3xl font-bold">What we stand for</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.title} className="border-border rounded-3xl border bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
                <span className="bg-brand-soft text-brand grid size-11 place-items-center rounded-2xl">
                  {v.icon}
                </span>
                <h3 className="mt-4 text-lg font-bold">{v.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
