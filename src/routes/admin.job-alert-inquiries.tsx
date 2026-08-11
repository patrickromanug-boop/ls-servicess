import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { AdminShell } from "@/components/admin/AdminShell";
import { format } from "date-fns"; // optional, you can display raw date

interface InquiryRow {
  id: number;
  full_name: string | null;
  phone: string | null;
  attempted_delivery: string;
  created_at: string;
}

async function fetchInquiries(): Promise<InquiryRow[]> {
  const { data, error } = await supabase
    .from("job_alert_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as InquiryRow[];
}

export const Route = createFileRoute("/admin/job-alert-inquiries")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Job Alert Inquiries — LS Services Admin" },
      { name: "description", content: "Dashboard alert cancellations by users." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: JobAlertInquiriesPage,
});

function JobAlertInquiriesPage() {
  const { data: inquiries, isLoading, error } = useQuery({
    queryKey: ["admin", "job-alert-inquiries"],
    queryFn: fetchInquiries,
    staleTime: 30_000,
  });

  return (
    <AdminShell
      title="Job Alert Inquiries"
      description="Users who cancelled a dashboard-only alert request."
    >
      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">Error loading inquiries.</p>}
      {inquiries && inquiries.length === 0 && (
        <p className="text-muted-foreground text-sm">No inquiries yet.</p>
      )}
      {inquiries && inquiries.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Name</th>
                <th className="px-4 py-3 text-left font-bold">Phone</th>
                <th className="px-4 py-3 text-left font-bold">Attempted Delivery</th>
                <th className="px-4 py-3 text-left font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{inq.full_name ?? "—"}</td>
                  <td className="px-4 py-3">{inq.phone ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{inq.attempted_delivery}</td>
                  <td className="px-4 py-3 text-xs">
                    {format(new Date(inq.created_at), "MMM d, yyyy HH:mm")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
