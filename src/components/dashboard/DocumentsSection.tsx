import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download, FileText, Lock, ShieldCheck } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Card } from "./ProfileSection";
import {
  attachDocumentPdf,
  createDocumentRequest,
  documentRequestsQueryOptions,
  documentsRemaining,
  type WebSubscription,
} from "@/lib/account";
import { buildDocumentPdf, signedDocumentUrl, uploadDocumentPdf } from "@/lib/documents";
import {
  DOCUMENT_TYPES,
  documentTypeLabel,
  requestStatusLabel,
  type DocumentType,
} from "@/lib/plans";
import { WHATSAPP_DOCUMENT_REQUEST } from "@/lib/constants";

type FieldSpec = { key: string; label: string; placeholder: string; long?: boolean };

const FORMS: Record<DocumentType, FieldSpec[]> = {
  cv: [
    { key: "headline", label: "Professional headline", placeholder: "e.g. Accounts Assistant" },
    { key: "contact", label: "Contact details", placeholder: "Phone, email, address" },
    { key: "summary", label: "Personal summary", placeholder: "2–3 sentences about you", long: true },
    { key: "education", label: "Education", placeholder: "School, award, years", long: true },
    { key: "experience", label: "Work experience", placeholder: "Role, employer, dates, duties", long: true },
    { key: "skills", label: "Skills", placeholder: "e.g. QuickBooks, data entry, customer care", long: true },
    { key: "referees", label: "Referees", placeholder: "Name, title, contact", long: true },
  ],
  cover_letter: [
    { key: "job_title", label: "Job you're applying for", placeholder: "e.g. Sales Officer" },
    { key: "company", label: "Company / organization", placeholder: "e.g. Centenary Bank" },
    { key: "contact", label: "Your contact details", placeholder: "Phone, email" },
    { key: "highlights", label: "Key points to highlight", placeholder: "Why you're a great fit", long: true },
    { key: "experience", label: "Relevant experience", placeholder: "Most relevant roles and results", long: true },
  ],
  application_letter: [
    { key: "job_title", label: "Position applied for", placeholder: "e.g. Enrolled Nurse" },
    { key: "company", label: "Addressed to", placeholder: "Organization or hiring manager" },
    { key: "reference", label: "Advert reference (optional)", placeholder: "e.g. HR/2026/014" },
    { key: "contact", label: "Your contact details", placeholder: "Phone, email" },
    { key: "body", label: "What you want to say", placeholder: "Your qualifications and interest", long: true },
  ],
};

export function DocumentsSection({
  user,
  sub,
  fullName,
}: {
  user: User;
  sub: WebSubscription | null;
  fullName: string;
}) {
  const qc = useQueryClient();
  const [active, setActive] = useState<DocumentType | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const requests = useQuery(documentRequestsQueryOptions());

  const remaining = documentsRemaining(sub);
  const blocked = remaining !== null && remaining <= 0;

  const submit = useMutation({
    mutationFn: async (documentType: DocumentType) => {
      const specs = FORMS[documentType];
      const formData = Object.fromEntries(
        specs.map((spec) => [spec.key, (values[spec.key] ?? "").trim()]),
      );
      if (!Object.values(formData).some((v) => v)) {
        throw new Error("Fill in at least one field before submitting");
      }

      // The limit is re-checked server-side inside web_create_document_request.
      const request = await createDocumentRequest(documentType, formData);

      const blob = buildDocumentPdf({
        documentType,
        personName: fullName,
        fields: specs.map((spec) => ({ label: spec.label, value: formData[spec.key] ?? "" })),
      });
      const path = await uploadDocumentPdf(user.id, request.id, blob);
      await attachDocumentPdf(request.id, path);
      return documentType;
    },
    onSuccess: (documentType) => {
      setActive(null);
      setValues({});
      void qc.invalidateQueries({ queryKey: ["document_requests"] });
      void qc.invalidateQueries({ queryKey: ["web_subscription"] });
      toast.success("Request submitted — we're notifying the LS Services team");
      window.open(WHATSAPP_DOCUMENT_REQUEST(documentTypeLabel(documentType)), "_blank", "noopener");
    },
    onError: (error: Error) => {
      if (error.message.includes("DOCUMENT_LIMIT_REACHED")) {
        toast.error("You've used all document generations for this period — upgrade to continue");
        return;
      }
      toast.error(error.message);
    },
  });

  async function download(path: string) {
    try {
      window.open(await signedDocumentUrl(path), "_blank", "noopener");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Generate a document">
        <p className="text-muted-foreground text-sm">
          Pick a document type, fill in your details, and we&apos;ll build a clean PDF and send it
          through to our team for review.{" "}
          <strong className="text-foreground">
            {remaining === null ? "Unlimited generations available" : `${remaining} left this period`}
          </strong>
          .
        </p>

        {blocked ? (
          <div className="border-accent-orange/40 bg-accent-orange/10 mt-4 rounded-xl border p-5">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Lock className="size-4" />
              You&apos;ve used all your document generations for this period
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Upgrade your plan to generate more CVs, cover letters and application letters.
            </p>
            <Link
              to="/plans"
              className="bg-brand text-brand-foreground mt-4 inline-block rounded-lg px-5 py-2.5 text-sm font-bold"
            >
              See plans
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {DOCUMENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setActive(type.value);
                    setValues({});
                  }}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-bold transition-colors ${
                    active === type.value ? "border-brand border-2" : "border-border hover:border-brand"
                  }`}
                >
                  <FileText className="text-brand size-5" />
                  {type.label}
                </button>
              ))}
            </div>

            {active && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit.mutate(active);
                }}
                className="mt-6 space-y-3"
              >
                <h3 className="font-display text-base font-bold">
                  {documentTypeLabel(active)} details
                </h3>
                {FORMS[active].map((spec) => (
                  <label key={spec.key} className="block">
                    <span className="text-xs font-semibold">{spec.label}</span>
                    {spec.long ? (
                      <textarea
                        rows={3}
                        value={values[spec.key] ?? ""}
                        placeholder={spec.placeholder}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [spec.key]: e.target.value }))
                        }
                        className="border-border focus:border-brand mt-1 w-full rounded-lg border bg-background p-3 text-sm outline-none"
                      />
                    ) : (
                      <input
                        value={values[spec.key] ?? ""}
                        placeholder={spec.placeholder}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [spec.key]: e.target.value }))
                        }
                        className="border-border focus:border-brand mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none"
                      />
                    )}
                  </label>
                ))}

                <div className="bg-brand-soft text-brand flex items-start gap-2 rounded-lg p-3 text-xs font-medium">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Your information is safe with us. We never sell or share your data — it&apos;s
                    only used to help you find work or prepare your documents.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submit.isPending}
                  className="bg-brand text-brand-foreground w-full rounded-lg py-3 text-sm font-bold disabled:opacity-60 sm:w-auto sm:px-8"
                >
                  {submit.isPending ? "Generating…" : `Submit ${documentTypeLabel(active)} request`}
                </button>
              </form>
            )}
          </>
        )}
      </Card>

      <Card title="Your document requests">
        {requests.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (requests.data ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">
            You haven&apos;t requested any documents yet.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {(requests.data ?? []).map((request) => (
              <li key={request.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-bold">{documentTypeLabel(request.document_type)}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(request.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {request.pdf_url && (
                    <button
                      onClick={() => download(request.pdf_url!)}
                      className="text-brand inline-flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Download className="size-3.5" />
                      PDF
                    </button>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      request.status === "completed"
                        ? "bg-brand-soft text-brand"
                        : request.status === "sent_to_admin"
                          ? "bg-accent-orange/15 text-accent-orange"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {requestStatusLabel(request.status)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
