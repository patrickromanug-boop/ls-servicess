import { ArrowRight, Globe, ShieldCheck } from "lucide-react";
import { WHATSAPP_COMPLIANCE, WHATSAPP_WEB_DEV } from "@/lib/constants";

/** Shared "Other services" pair — used on the homepage and in the dashboard. */
export function OtherServicesCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
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
    <div className="border-border flex flex-col rounded-2xl border bg-card p-6">
      <span className="bg-brand-soft text-brand grid size-10 place-items-center rounded-lg">
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
