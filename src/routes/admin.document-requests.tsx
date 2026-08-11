import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  adminDocRequestsQueryOptions,
  completeDocRequest,
  type AdminDocRequest,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/document-requests")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Document requests — LS Services admin" },
      { name: "description", content: "Review CV, cover letter and application letter requests." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Document requests — LS Services admin" },
      { property: "og:description", content: "Review jobseeker document requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentRequestsPage,
});

const TYPE_LABELS: Record<string, string> = {
  cv: "CV",
  cover_letter: "Cover letter",
  application_letter: "Application letter",
};

function DocumentRequestsPage() {
  const qc = useQueryClient();
  const requests = useQuery(adminDocRequestsQueryOptions());
  const [selected, setSelected] = useState<AdminDocRequest | null>(null);

  const complete = useMutation({
    mutationFn: (r: AdminDocRequest) => completeDocRequest(r.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_doc_requests"] });
      qc.invalidateQueries({ queryKey: ["document_requests"] });
      setSelected(null);
      toast.success("Marked as completed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell
      title="Document requests"
      description={`${requests.data?.length ?? 0} open request(s)`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="border-border overflow-hidden rounded-2xl border bg-white">
          {requests.isPending && (
            <p className="text-muted-foreground p-6 text-sm">Loading requests…</p>
          )}
          {!requests.isPending && (requests.data?.length ?? 0) === 0 && (
            <p className="text-muted-foreground p-6 text-sm">No open document requests.</p>
          )}
          {(requests.data ?? []).map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`border-border block w-full border-b p-4 text-left last:border-b-0 ${
                selected?.id === r.id ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              <p className="text-sm font-bold">{r.profiles?.full_name ?? "Unnamed user"}</p>
              <p className="text-muted-foreground text-xs">
                {TYPE_LABELS[r.document_type] ?? r.document_type} ·{" "}
                {new Date(r.created_at).toLocaleDateString()}
              </p>
              <span className="text-muted-foreground mt-1 inline-block text-[11px] font-semibold capitalize">
                {r.status.replace(/_/g, " ")}
              </span>
            </button>
          ))}
        </div>

        <div className="border-border rounded-2xl border bg-white p-5">
          {!selected ? (
            <p className="text-muted-foreground text-sm">
              Select a request to view what the jobseeker submitted.
            </p>
          ) : (
            <div>
              <h2 className="font-display text-lg font-bold">
                {TYPE_LABELS[selected.document_type] ?? selected.document_type}
              </h2>
              <p className="text-muted-foreground text-sm">
                {selected.profiles?.full_name ?? "Unnamed user"}
                {selected.profiles?.phone ? ` · ${selected.profiles.phone}` : ""}
              </p>

              <dl className="mt-4 space-y-3 text-sm">
                {Object.entries(selected.form_data ?? {}).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-line">
                      {typeof value === "string" ? value : JSON.stringify(value)}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-wrap gap-2">
                {selected.pdf_url ? (
                  <a
                    href={selected.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="border-border rounded-lg border px-4 py-2 text-sm font-bold"
                  >
                    Open generated PDF
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">No PDF attached yet.</span>
                )}
                <button
                  onClick={() => complete.mutate(selected)}
                  disabled={complete.isPending}
                  className="bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-60"
                >
                  Mark as completed
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
