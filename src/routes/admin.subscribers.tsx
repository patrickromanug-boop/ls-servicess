import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { subscribersQueryOptions } from "@/lib/admin";

export const Route = createFileRoute("/admin/subscribers")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Subscribers — LS Services admin" },
      { name: "description", content: "Trial, active and expired website subscriptions." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Subscribers — LS Services admin" },
      { property: "og:description", content: "Website subscription overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubscribersPage,
});

export function fmt(date: string | null) {
  return date ? new Date(date).toLocaleDateString() : "—";
}

function SubscribersPage() {
  const subs = useQuery(subscribersQueryOptions());
  const [tier, setTier] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (subs.data ?? []).filter(
      (s) =>
        (tier === "all" || s.tier === tier) &&
        (status === "all" || s.status === status) &&
        (!term ||
          (s.profiles?.full_name ?? "").toLowerCase().includes(term) ||
          (s.profiles?.phone ?? "").includes(term)),
    );
  }, [subs.data, tier, status, search]);

  const select = "border-border rounded-lg border bg-white px-3 py-2 text-sm outline-none";

  return (
    <AdminShell title="Subscribers" description={`${rows.length} subscription(s) shown`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <select className={select} value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="all">All tiers</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
        <select className={select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
        <input
          className={`${select} ml-auto w-64`}
          placeholder="Search name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border-border overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              {["Name", "Phone", "Tier", "Cycle", "Status", "Trial ends", "Renews"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subs.isPending && (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                  Loading subscribers…
                </td>
              </tr>
            )}
            {!subs.isPending && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                  No subscriptions match this filter.
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id} className="border-border border-t">
                <td className="px-4 py-3 font-semibold">{s.profiles?.full_name ?? "—"}</td>
                <td className="px-4 py-3">{s.profiles?.phone ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{s.tier ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{s.billing_cycle ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{s.status}</td>
                <td className="px-4 py-3">{fmt(s.trial_ends_at)}</td>
                <td className="px-4 py-3">{fmt(s.renewal_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
