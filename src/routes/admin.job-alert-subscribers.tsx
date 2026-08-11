import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { AdminShell } from "@/components/admin/AdminShell";

// ---- Types ----
interface SubscriberRow {
  full_name: string | null;
  phone: string | null;
  preferred_categories: string[] | null;
  preferred_locations: string[] | null;
  tier: string | null;
  alert_delivery: string;
}

// ---- Phone formatting ----
function cleanUgandaPhone(phone: string | null): string | null {
  if (!phone) return null;
  // Remove everything except digits and leading +
  let cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("256")) return "+" + cleaned;
  if (cleaned.startsWith("0")) return "+256" + cleaned.substring(1);
  return "+256" + cleaned; // assume bare local number
}

function waLink(phone: string | null): string | null {
  const formatted = cleanUgandaPhone(phone);
  if (!formatted) return null;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(
    "Hi, following up on your job alert preferences at LS Services"
  )}`;
}

// ---- Data fetch ----
async function fetchSubscribers(): Promise<SubscriberRow[]> {
  const { data, error } = await supabase
    .from("web_subscriptions")
    .select(`
      alert_delivery,
      tier,
      profiles!inner(full_name, phone, preferred_categories, preferred_locations)
    `)
    .in("alert_delivery", ["whatsapp", "both"])
    .not("profiles", "is", null);

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    full_name: row.profiles?.full_name ?? null,
    phone: row.profiles?.phone ?? null,
    preferred_categories: row.profiles?.preferred_categories ?? null,
    preferred_locations: row.profiles?.preferred_locations ?? null,
    tier: row.tier ?? null,
    alert_delivery: row.alert_delivery,
  }));
}

// ---- Route ----
export const Route = createFileRoute("/admin/job-alert-subscribers")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Job Alert Subscribers — LS Services Admin" },
      { name: "description", content: "Users who requested WhatsApp reach-out for job alerts." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: JobAlertSubscribersPage,
});

function JobAlertSubscribersPage() {
  const { data: subscribers, isLoading, error } = useQuery({
    queryKey: ["admin", "job-alert-subscribers"],
    queryFn: fetchSubscribers,
    staleTime: 30_000,
  });

  return (
    <AdminShell
      title="Job Alert Subscribers"
      description="Users who opted into WhatsApp outreach for job matches."
    >
      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">Error loading subscribers.</p>}
      {subscribers && subscribers.length === 0 && (
        <p className="text-muted-foreground text-sm">No subscribers yet.</p>
      )}
      {subscribers && subscribers.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Name</th>
                <th className="px-4 py-3 text-left font-bold">Phone</th>
                <th className="px-4 py-3 text-left font-bold">Preferred Categories</th>
                <th className="px-4 py-3 text-left font-bold">Preferred Locations</th>
                <th className="px-4 py-3 text-left font-bold">Plan</th>
                <th className="px-4 py-3 text-left font-bold">Alert Via</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscribers.map((sub, idx) => {
                const link = waLink(sub.phone);
                return (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{sub.full_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:underline"
                        >
                          {cleanUgandaPhone(sub.phone)}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{sub.phone ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sub.preferred_categories?.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {sub.preferred_locations?.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 capitalize">{sub.tier ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">
                      {sub.alert_delivery === "both" ? "WhatsApp + Dashboard" : "WhatsApp"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
