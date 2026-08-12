import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  addLookup,
  lookupQueryOptions,
  type AdminJobRow,
  type JobInput,
  type Lookup,
} from "@/lib/admin";

const METHODS = [
  { value: "auto_apply_supported", label: "Website" },
  { value: "email_only", label: "Email only" },
  { value: "requires_personal_account", label: "Requires personal account on employer site" },
] as const;

const BASE_DOCS = [
  "National ID",
  "Academic Transcript",
  "Passport Photo",
  "Recommendation Letter",
];

const input =
  "border-border focus:border-brand w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none";
const label = "text-xs font-bold uppercase tracking-wide text-muted-foreground";

function LookupSelect({
  table,
  value,
  onChange,
  title,
}: {
  table: "categories" | "locations" | "job_types";
  value: string | null;
  onChange: (id: string) => void;
  title: string;
}) {
  const qc = useQueryClient();
  const query = useQuery(lookupQueryOptions(table));
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const add = useMutation({
    mutationFn: () => addLookup(table, name.trim()),
    onSuccess: (row: Lookup) => {
      qc.invalidateQueries({ queryKey: ["lookup", table] });
      onChange(row.id);
      setName("");
      setAdding(false);
      toast.success(`${title} added`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <label className={label}>{title}</label>
      <div className="mt-1 flex gap-2">
        <select className={input} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select {title.toLowerCase()}…</option>
          {(query.data ?? []).map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="border-border shrink-0 rounded-lg border px-3 text-xs font-bold"
        >
          Add new
        </button>
      </div>
      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            className={input}
            value={name}
            placeholder={`New ${title.toLowerCase()}`}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="button"
            disabled={!name.trim() || add.isPending}
            onClick={() => add.mutate()}
            className="bg-brand text-brand-foreground shrink-0 rounded-lg px-3 text-xs font-bold disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

export type JobFormValues = JobInput;

export function JobForm({
  initial,
  submitLabel,
  onSubmit,
  pending,
}: {
  initial?: AdminJobRow;
  submitLabel: string;
  onSubmit: (values: JobFormValues) => void;
  pending?: boolean;
}) {
  const [values, setValues] = useState<JobFormValues>({
    title: initial?.title ?? "",
    organization: initial?.organization ?? "",
    deadline: initial?.deadline ?? "",
    category_id: initial?.category_id ?? null,
    location_id: initial?.location_id ?? null,
    job_type_id: initial?.job_type_id ?? null,
    purpose: initial?.purpose ?? "",
    requirements: initial?.requirements ?? "",
    other_details: initial?.other_details ?? "",
    application_instructions: initial?.application_instructions ?? "",
    application_method: initial?.application_method ?? "auto_apply_supported",
    official_link: initial?.official_link ?? "",
    application_email: initial?.application_email ?? "",
    opens_externally: initial?.opens_externally ?? false,
    required_documents: initial?.required_documents ?? [],
  });
  const [customDoc, setCustomDoc] = useState("");

  const set = <K extends keyof JobFormValues>(key: K, v: JobFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const emailOnly = values.application_method === "email_only";
  const docOptions = Array.from(new Set([...BASE_DOCS, ...values.required_documents]));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim() || !values.organization.trim() || !values.deadline) {
      toast.error("Title, organization and deadline are required");
      return;
    }
    if (emailOnly && !values.application_email?.trim()) {
      toast.error("Add the application email for email-only jobs");
      return;
    }
    if (!emailOnly && !values.official_link?.trim()) {
      toast.error("Add the official application link");
      return;
    }
    onSubmit({
      ...values,
      other_details: values.other_details?.trim() || null,
      application_instructions: values.application_instructions?.trim() || null,
      official_link: emailOnly ? null : (values.official_link?.trim() ?? null),
      application_email: emailOnly ? (values.application_email?.trim() ?? null) : null,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Job basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title">
            <input className={input} value={values.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Organization">
            <input
              className={input}
              value={values.organization}
              onChange={(e) => set("organization", e.target.value)}
            />
          </Field>
          <Field label="Deadline">
            <input
              type="date"
              className={input}
              value={values.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <LookupSelect
            table="locations"
            title="Location"
            value={values.location_id}
            onChange={(id) => set("location_id", id || null)}
          />
          <LookupSelect
            table="categories"
            title="Category"
            value={values.category_id}
            onChange={(id) => set("category_id", id || null)}
          />
          <LookupSelect
            table="job_types"
            title="Job type"
            value={values.job_type_id}
            onChange={(id) => set("job_type_id", id || null)}
          />
        </div>
      </Section>

      <Section title="Job description">
        <div className="space-y-4">
          <Field label="Purpose">
            <textarea
              rows={3}
              className={input}
              value={values.purpose}
              onChange={(e) => set("purpose", e.target.value)}
            />
          </Field>
          <Field label="Requirements">
            <textarea
              rows={4}
              className={input}
              value={values.requirements}
              onChange={(e) => set("requirements", e.target.value)}
            />
          </Field>
          <Field label="Other details">
            <textarea
              rows={3}
              className={input}
              value={values.other_details ?? ""}
              onChange={(e) => set("other_details", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="How to apply">
        <Field label="Application instructions (shown in the Apply section)">
          <textarea
            rows={4}
            className={input}
            value={values.application_instructions ?? ""}
            onChange={(e) => set("application_instructions", e.target.value)}
          />
        </Field>
        <div className="mt-4">
          <span className={label}>Application method</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => set("application_method", m.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  values.application_method === m.value
                    ? "bg-brand text-brand-foreground"
                    : "border-border text-muted-foreground border"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          {emailOnly ? (
            <Field label="Application email">
              <input
                className={input}
                type="email"
                value={values.application_email ?? ""}
                onChange={(e) => set("application_email", e.target.value)}
              />
            </Field>
          ) : (
            <Field label="Official link">
              <input
                className={input}
                value={values.official_link ?? ""}
                onChange={(e) => set("official_link", e.target.value)}
              />
            </Field>
          )}
        </div>
        {!emailOnly && (
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.opens_externally}
              onChange={(e) => set("opens_externally", e.target.checked)}
            />
            This link doesn't open well when embedded
          </label>
        )}
      </Section>

      <Section title="Required documents">
        <div className="flex flex-wrap gap-2">
          {docOptions.map((doc) => {
            const on = values.required_documents.includes(doc);
            return (
              <button
                key={doc}
                type="button"
                onClick={() =>
                  set(
                    "required_documents",
                    on
                      ? values.required_documents.filter((d) => d !== doc)
                      : [...values.required_documents, doc],
                  )
                }
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  on ? "bg-accent-orange text-black" : "border-border text-muted-foreground border"
                }`}
              >
                {doc}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className={input}
            placeholder="Add a custom document"
            value={customDoc}
            onChange={(e) => setCustomDoc(e.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              const v = customDoc.trim();
              if (!v) return;
              if (!values.required_documents.includes(v))
                set("required_documents", [...values.required_documents, v]);
              setCustomDoc("");
            }}
            className="border-border shrink-0 rounded-lg border px-3 text-xs font-bold"
          >
            Add
          </button>
        </div>
      </Section>

      <button
        type="submit"
        disabled={pending}
        className="bg-brand text-brand-foreground rounded-lg px-5 py-2.5 text-sm font-bold disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border rounded-2xl border bg-white p-5">
      <h2 className="font-display mb-4 text-sm font-bold tracking-wide uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label: text, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className={label}>{text}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}
