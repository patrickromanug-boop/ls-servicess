import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { JobForm, type JobFormValues } from "@/components/admin/JobForm";
import { adminJobsQueryOptions, updateJob, type AdminJobRow } from "@/lib/admin";

export const Route = createFileRoute("/admin/jobs")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Manage jobs — LS Services admin" },
      { name: "description", content: "Review, edit and archive job listings." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Manage jobs — LS Services admin" },
      { property: "og:description", content: "Review, edit and archive job listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManageJobsPage,
});

function ManageJobsPage() {
  const qc = useQueryClient();
  const jobs = useQuery(adminJobsQueryOptions());
  const [status, setStatus] = useState<"all" | "active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminJobRow | null>(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (jobs.data ?? []).filter(
      (j) =>
        (status === "all" || j.status === status) &&
        (!term ||
          j.title.toLowerCase().includes(term) ||
          j.organization.toLowerCase().includes(term)),
    );
  }, [jobs.data, status, search]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin_jobs"] });
    qc.invalidateQueries({ queryKey: ["jobs"] });
  };

  const save = useMutation({
    mutationFn: (values: JobFormValues) => updateJob(editing!.id, values),
    onSuccess: () => {
      invalidate();
      toast.success("Job updated");
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (job: AdminJobRow) =>
      updateJob(job.id, { status: job.status === "active" ? "archived" : "active" }),
    onSuccess: () => {
      invalidate();
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (editing) {
    return (
      <AdminShell
        title={`Edit: ${editing.title}`}
        description={editing.organization}
        actions={
          <button
            onClick={() => setEditing(null)}
            className="border-border rounded-lg border px-3 py-2 text-xs font-bold"
          >
            Back to list
          </button>
        }
      >
        <div className="max-w-3xl space-y-4">
          <div className="border-border flex items-center justify-between rounded-2xl border bg-white p-4">
            <div>
              <p className="text-xs font-bold tracking-wide uppercase">Current status</p>
              <p className="text-muted-foreground text-sm capitalize">{editing.status}</p>
            </div>
            <button
              onClick={() => {
                toggle.mutate(editing);
                setEditing({
                  ...editing,
                  status: editing.status === "active" ? "archived" : "active",
                });
              }}
              className="bg-brand text-brand-foreground rounded-lg px-3 py-2 text-xs font-bold"
            >
              {editing.status === "active" ? "Archive job" : "Make active"}
            </button>
          </div>
          <JobForm
            initial={editing}
            submitLabel="Save changes"
            pending={save.isPending}
            onSubmit={(values) => save.mutate(values)}
          />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Manage jobs" description={`${rows.length} job(s) shown`}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["active", "archived", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
              status === s ? "bg-[#14204F] text-white" : "border-border border bg-white"
            }`}
          >
            {s}
          </button>
        ))}
        <input
          placeholder="Search title or organization"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-border ml-auto w-64 rounded-lg border bg-white px-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="border-border overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              {["Title", "Organization", "Location", "Deadline", "Status", "Views", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.isPending && (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                  Loading jobs…
                </td>
              </tr>
            )}
            {!jobs.isPending && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                  No jobs match this filter.
                </td>
              </tr>
            )}
            {rows.map((job) => (
              <tr key={job.id} className="border-border border-t">
                <td className="px-4 py-3 font-semibold">{job.title}</td>
                <td className="px-4 py-3">{job.organization}</td>
                <td className="px-4 py-3">{job.locations?.name ?? "—"}</td>
                <td className="px-4 py-3">{job.deadline}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      job.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3">{job.views_count}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing(job)}
                    className="text-brand text-xs font-bold underline"
                  >
                    View / edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
