import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AdminShell } from "@/components/admin/AdminShell";
import { format } from "date-fns";

interface PendingPlanRequest {
  id: string;
  requested_tier: string;
  requested_billing_cycle: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    phone: string | null;
  } | null;
}

async function fetchPendingPlanRequests(): Promise<PendingPlanRequest[]> {
  const { data, error } = await supabase
    .from("plan_requests")
    .select(`
      id,
      requested_tier,
      requested_billing_cycle,
      created_at,
      profiles!inner(full_name, phone)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PendingPlanRequest[];
}

export const Route = createFileRoute("/admin/plan-requests")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Plan Requests — LS Services Admin" },
      { name: "description", content: "Pending plan activation requests." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PlanRequestsPage,
});

function PlanRequestsPage() {
  const qc = useQueryClient();
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ["admin", "plan-requests", "pending"],
    queryFn: fetchPendingPlanRequests,
    staleTime: 30_000,
  });

  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  async function approve(id: string) {
    try {
      await supabase.rpc("web_admin_approve_plan_request", { _request_id: id });
      toast.success("Plan request approved");
      qc.invalidateQueries({ queryKey: ["admin", "plan-requests", "pending"] });
      qc.invalidateQueries({ queryKey: ["web_subscription"] });
      qc.invalidateQueries({ queryKey: ["plan_requests"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function reject(id: string) {
    const note = rejectNotes[id] ?? "";
    try {
      await supabase.rpc("web_admin_reject_plan_request", {
        _request_id: id,
        _note: note || null,
      });
      toast.success("Plan request rejected");
      qc.invalidateQueries({ queryKey: ["admin", "plan-requests", "pending"] });
      qc.invalidateQueries({ queryKey: ["plan_requests"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <AdminShell
      title="Plan Requests"
      description="Pending plan activation requests waiting for payment verification."
    >
      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">Error loading requests.</p>}
      {requests && requests.length === 0 && (
        <p className="text-muted-foreground text-sm">No pending requests.</p>
      )}
      {requests && requests.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-bold">User</th>
                <th className="px-4 py-3 text-left font-bold">Phone</th>
                <th className="px-4 py-3 text-left font-bold">Tier</th>
                <th className="px-4 py-3 text-left font-bold">Billing Cycle</th>
                <th className="px-4 py-3 text-left font-bold">Submitted</th>
                <th className="px-4 py-3 text-left font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">
                    {req.profiles?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{req.profiles?.phone ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{req.requested_tier}</td>
                  <td className="px-4 py-3 capitalize">{req.requested_billing_cycle}</td>
                  <td className="px-4 py-3 text-xs">
                    {format(new Date(req.created_at), "MMM d, yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => approve(req.id)}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => reject(req.id)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                      <input
                        value={rejectNotes[req.id] ?? ""}
                        onChange={(e) =>
                          setRejectNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        placeholder="Optional rejection note"
                        className="border-border text-xs rounded-md border bg-background px-2 py-1 outline-none focus:border-brand"
                      />
                    </div>
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
