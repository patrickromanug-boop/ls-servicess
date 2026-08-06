import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, MessageSquare, MapPin, Clock } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WHATSAPP_HIRE_TALENT } from "@/lib/constants";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact LS Services — Talk to Our Team in Uganda" },
      {
        name: "description",
        content:
          "Reach the LS Services team about job listings, hiring, compliance support or web development. WhatsApp us or send a message from this page.",
      },
      { property: "og:title", content: "Contact LS Services" },
      {
        property: "og:description",
        content: "Reach our team about job listings, hiring or business support.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, { message: "Enter your name" }).max(100),
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  message: z.string().trim().min(10, { message: "Tell us a little more (10+ characters)" }).max(1000),
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    // Forwarded to our WhatsApp desk; the number is never rendered on screen.
    const text = `Hi LS Services, I'm ${parsed.data.name} (${parsed.data.email}).\n\n${parsed.data.message}`;
    window.open(`https://wa.me/256772702263?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    setMessage("");
    toast.success("Opening WhatsApp to send your message");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
        <p className="text-accent-orange text-xs font-bold tracking-widest">CONTACT US</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">We&apos;re a message away.</h1>
        <p className="text-muted-foreground mt-4 max-w-xl">
          Questions about a listing, hiring, or our other services? Send a note and we&apos;ll get
          back to you.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            <InfoRow
              icon={<MessageSquare className="size-5" />}
              title="WhatsApp"
              body="Fastest way to reach us — chat directly with our team."
              action={{ label: "Open WhatsApp", href: WHATSAPP_HIRE_TALENT }}
            />
            <InfoRow
              icon={<Mail className="size-5" />}
              title="Email"
              body="info@lsservices.co.ug"
            />
            <InfoRow icon={<MapPin className="size-5" />} title="Location" body="Kampala, Uganda" />
            <InfoRow
              icon={<Clock className="size-5" />}
              title="Working hours"
              body="Monday – Saturday, 8:00am – 6:00pm (EAT)"
            />
          </div>

          <form onSubmit={submit} className="border-border rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-bold">Send us a message</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold">Your name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="border-border focus:border-brand mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  className="border-border focus:border-brand mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold">Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={1000}
                  className="border-border focus:border-brand mt-1 w-full resize-none rounded-lg border bg-background p-3 text-sm outline-none"
                />
              </label>
              <button
                type="submit"
                className="bg-brand text-brand-foreground w-full rounded-lg py-3 text-sm font-bold"
              >
                Send message
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function InfoRow({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="border-border flex gap-4 rounded-2xl border p-5">
      <span className="bg-brand-soft text-brand grid size-10 shrink-0 place-items-center rounded-lg">
        {icon}
      </span>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{body}</p>
        {action ? (
          <a
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand mt-2 inline-block text-sm font-semibold"
          >
            {action.label} →
          </a>
        ) : null}
      </div>
    </div>
  );
}
