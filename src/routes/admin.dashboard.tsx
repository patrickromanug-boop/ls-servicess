import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Users, CreditCard, FileText } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  adminStatsQueryOptions,
  employerInquiriesQueryOptions,
  weeklyBuckets,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin dashboard — LS Services" },
      { name: "description", content: "Overview of jobs, users, subscribers and document requests." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin dashboard — LS Services" },
      { property: "og:description", content: "LS Services staff overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const stats = useQuery(adminStatsQueryOptions());
  const inquiries = useQuery(employerInquiriesQueryOptions());

  const cards = [
    { label: "Active jobs", value: stats.data?.activeJobs, icon: Briefcase },
    { label: "Registered users", value: stats.data?.users, icon: Users },
    { label: "Active subscribers", value: stats.data?.activeSubscribers, icon: CreditCard },
    { label: "Pending document requests", value: stats.data?.pendingDocuments, icon: FileText },
  ];

  const buckets = weeklyBuckets((inquiries.data ?? []).map((r) => r.created_at));
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <AdminShell title="Dashboard" description="A quick read on the portal right now.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="border-border rounded-2xl border bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                {card.label}
              </span>
              <card.icon className="text-brand h-4 w-4" />
            </div>
            <p className="font-display mt-3 text-3xl font-bold">
              {stats.isPending ? "—" : (card.value ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-border mt-6 rounded-2xl border bg-white p-5">
        <h2 className="font-display text-sm font-bold tracking-wide uppercase">
          Employer inquiries — last 4 weeks
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          This site has no applications table of its own (jobseekers apply on the employer's own
          channel), so employer inquiry volume is the closest clean proxy for activity.
        </p>
        <div className="mt-6 flex h-40 items-end gap-6">
          {buckets.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-bold">{b.count}</span>
              <div
                className="bg-brand w-full rounded-t-md"
                style={{ height: `${Math.max(4, (b.count / max) * 100)}%` }}
              />
              <span className="text-muted-foreground text-[11px]">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
