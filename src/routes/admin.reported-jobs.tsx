import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  dismissReport,
  removeReportedJob,
  reportsQueryOptions,
  type ReportRow,
} from "@/lib/admin";
import { jobQueryOptions } from "@/lib/jobs";

export const Route = createFileRoute("/admin/reported-jobs")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reported jobs — LS Services admin" },
      { name: "description", content: "Review jobseeker reports and archive bad listings." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Reported jobs — LS Services admin" },
      { property: "og:description", content: "Review jobseeker reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportedJobsPage,
});

function ReportedJobsPage() {
  const qc = useQueryClient();
  const reports = useQuery(reportsQueryOptions());
  const [selected, setSelected] = useState<ReportRow | null>(null);

  const done = (msg: string) => {
    qc.invalidateQueries({ queryKey: ["admin_reports"] });
    qc.invalidateQueries({ queryKey: ["admin_jobs"] });
    qc.invalidateQueries({ queryKey: ["jobs"] });
    setSelected(null);
    toast.success(msg);
  };

  const dismiss = useMutation({
    mutationFn: (r: ReportRow) => dismissReport(r.id),
    onSuccess: () => done("Report dismissed"),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (r: ReportRow) => removeReportedJob(r.id, r.job_id),
    onSuccess: () => done("Job archived"),
    onError: (e: Error) => toast.error(e.message),
  });

  const detail = useQuery({
    ...jobQueryOptions(selected?.job_id ?? ""),
    enabled: !!selected,
  });

  return (
    <AdminShell
      title="Reported jobs"
      description={`${reports.data?.length ?? 0} pending report(s)`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="border-border overflow-hidden rounded-2xl border bg-white">
          {reports.isPending && (
            <p className="text-muted-foreground p-6 text-sm">Loading reports…</p>
          )}
          {!reports.isPending && (reports.data?.length ?? 0) === 0 && (
            <p className="text-muted-foreground p-6 text-sm">
              No pending reports. Nothing needs your attention.
            </p>
          )}
          {(reports.data ?? []).map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`border-border block w-full border-b p-4 text-left last:border-b-0 ${
                selected?.id === r.id ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              <p className="text-sm font-bold">{r.jobs?.title ?? "Job removed"}</p>
              <p className="text-muted-foreground text-xs">{r.jobs?.organization}</p>
              <p className="mt-1 text-xs font-semibold text-red-600">{r.reason}</p>
              <p className="text-muted-foreground mt-1 text-[11px]">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>

        <div className="border-border rounded-2xl border bg-white p-5">
          {!selected ? (
            <p className="text-muted-foreground text-sm">
              Select a report to see the full listing beside the reason given.
            </p>
          ) : (
            <div>
              <p className="text-xs font-bold tracking-wide text-red-600 uppercase">
                Reason: {selected.reason}
              </p>
              {selected.details && (
                <p className="text-muted-foreground mt-1 text-sm">{selected.details}</p>
              )}

              <hr className="border-border my-4" />

              {detail.isPending ? (
                <p className="text-muted-foreground text-sm">Loading the listing…</p>
              ) : detail.data ? (
                <div className="space-y-3 text-sm">
                  <h2 className="font-display text-lg font-bold">{detail.data.title}</h2>
                  <p className="text-muted-foreground">
                    {detail.data.organization} · {detail.data.locations?.name ?? "—"} ·{" "}
                    {detail.data.job_types?.name ?? "—"}
                  </p>
                  <p>
                    <strong>Deadline:</strong> {detail.data.deadline}
                  </p>
                  <Block label="Purpose" value={detail.data.purpose} />
                  <Block label="Requirements" value={detail.data.requirements} />
                  <Block label="Other details" value={detail.data.other_details} />
                  <Block label="Official link" value={detail.data.official_link} />
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">This job no longer exists.</p>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => dismiss.mutate(selected)}
                  disabled={dismiss.isPending}
                  className="border-border rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-60"
                >
                  Dismiss report
                </button>
                <button
                  onClick={() => remove.mutate(selected)}
                  disabled={remove.isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  Remove job
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function Block({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">{label}</p>
      <p className="mt-1 whitespace-pre-line">{value}</p>
    </div>
  );
}
