import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { employerInquiriesQueryOptions, weeklyBuckets } from "@/lib/admin";

export const Route = createFileRoute("/admin/employer-inquiries")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Employer inquiries — LS Services admin" },
      { name: "description", content: "Running total of employer hiring inquiries." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Employer inquiries — LS Services admin" },
      { property: "og:description", content: "Employer inquiry volume log." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmployerInquiriesPage,
});

function EmployerInquiriesPage() {
  const inquiries = useQuery(employerInquiriesQueryOptions());
  const rows = inquiries.data ?? [];
  const buckets = weeklyBuckets(rows.map((r) => r.created_at));

  return (
    <AdminShell
      title="Employer inquiries"
      description="This table stores timestamps only — no employer contact details exist to show."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border-border rounded-2xl border bg-white p-5">
          <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
            Total inquiries
          </p>
          <p className="font-display mt-3 text-4xl font-bold">
            {inquiries.isPending ? "—" : rows.length}
          </p>
        </div>
        <div className="border-border rounded-2xl border bg-white p-5">
          <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
            Per week
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {buckets.map((b) => (
              <li key={b.label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-bold">{b.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-border mt-4 overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left font-bold">Received</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="text-muted-foreground px-4 py-8 text-center">
                  {inquiries.isPending ? "Loading…" : "No employer inquiries yet."}
                </td>
              </tr>
            )}
            {rows.slice(0, 100).map((r) => (
              <tr key={r.created_at} className="border-border border-t">
                <td className="px-4 py-3">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
