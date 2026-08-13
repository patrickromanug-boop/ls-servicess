import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  CalendarClock,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Flag,
  Mail,
  MapPin,
  Briefcase,
  Share2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  daysRemaining,
  deadlineLabel,
  initialsOf,
  jobSlug,
  reportJob,
  incrementJobView,
  type JobRow,
} from "@/lib/jobs";
import { useAuth } from "@/lib/auth";

const REASONS = ["Scam or fraudulent", "Expired or filled", "Wrong information", "Duplicate posting", "Other"];
const ANON_VIEW_KEY = "ls_anon_viewer_id";

export function JobDetail({ job }: { job: JobRow }) {
  const days = daysRemaining(job.deadline);
  const urgent = days <= 3;
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [applyOpen, setApplyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const countedView = useRef<string | null>(null);
  const [views, setViews] = useState(job.views_count);

  // Get or create a persistent anonymous ID (localStorage)
  function getAnonId() {
    let id = localStorage.getItem(ANON_VIEW_KEY);
    if (!id) {
      id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(ANON_VIEW_KEY, id);
    }
    return id;
  }

  useEffect(() => {
    if (!job?.id || countedView.current === job.id) return;
    countedView.current = job.id;

    const viewerKey = user ? `user:${user.id}` : `anon:${getAnonId()}`;
    incrementJobView(job.id, viewerKey)
      .then(() => {
        // Only increment the displayed count for the first view by this visitor.
        setViews(job.views_count + 1);
      })
      .catch(() => {});
  }, [job.id, user?.id]);

  const path = `/jobs/${jobSlug(job)}`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  function handleApply() {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth/login", search: { redirect: path } });
      return;
    }
    setApplyOpen((v) => !v);
  }

  async function handleShare() {
    const payload = { title: job.title, text: `${job.title} — ${job.organization}`, url: shareUrl };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article>
      <div className="flex items-start gap-3">
        <span className="bg-brand-soft text-brand font-display grid size-14 shrink-0 place-items-center rounded-xl text-lg font-bold">
          {initialsOf(job.organization)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold sm:text-2xl">{job.title}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
            <Building2 className="size-4" />
            {job.organization}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip icon={<MapPin className="size-3.5" />} text={job.locations?.name ?? "Uganda"} />
        <Chip icon={<Briefcase className="size-3.5" />} text={job.job_types?.name ?? "—"} />
        <Chip icon={<Eye className="size-3.5" />} text={`${views} views`} />
        {job.categories?.name && <Chip text={job.categories.name} />}
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            urgent ? "bg-urgent-soft text-urgent" : "bg-muted text-muted-foreground"
          }`}
        >
          <CalendarClock className="size-3.5" />
          {deadlineLabel(days)} · {job.deadline}
        </span>
      </div>

      <Section title="Purpose" body={job.purpose} />
      <Section title="Requirements" body={job.requirements} />
      {job.other_details && <Section title="Other details" body={job.other_details} />}

      <div className="border-border mt-8 flex flex-wrap items-center gap-2 border-t pt-6">
        <button
          onClick={handleApply}
          aria-expanded={applyOpen}
          className="bg-brand text-brand-foreground rounded-lg px-5 py-3 text-sm font-semibold"
        >
          Apply Now
        </button>
        <button
          onClick={handleShare}
          className="border-border flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold"
        >
          {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
          Share
        </button>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link copied to clipboard");
          }}
          className="border-border flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold"
          aria-label="Copy job link"
        >
          <Copy className="size-4" />
          Copy link
        </button>
        <button
          onClick={() => setReportOpen(true)}
          className="text-muted-foreground hover:text-urgent ml-auto flex items-center gap-1.5 text-xs font-semibold"
        >
          <Flag className="size-3.5" />
          Report this job
        </button>
      </div>

      {applyOpen && <ApplyProcedure job={job} />}
      {reportOpen && <ReportForm jobId={job.id} onClose={() => setReportOpen(false)} />}
    </article>
  );
}

function ApplyProcedure({ job }: { job: JobRow }) {
  const emailOnly = job.application_method === "email_only";
  const instructions = job.application_instructions?.trim();

  const mailto = job.application_email?.trim()
    ? `mailto:${job.application_email.trim()}?subject=${encodeURIComponent(
        `Application: ${job.title} — ${job.organization}`,
      )}`
    : null;

  return (
    <div className="border-brand bg-brand-soft mt-4 rounded-xl border p-4">
      <p className="text-sm font-semibold">How to apply</p>

      {instructions ? (
        <p className="text-foreground/80 mt-2 whitespace-pre-line text-sm leading-relaxed">{instructions}</p>
      ) : (
        <p className="text-muted-foreground mt-2 text-sm">
          {emailOnly
            ? "Follow the email option below to send your application."
            : "Click below to apply on the official site"}
        </p>
      )}

      {emailOnly ? (
        mailto ? (
          <a
            href={mailto}
            className="bg-brand text-brand-foreground mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
          >
            <Mail className="size-4" />
            Email your application
          </a>
        ) : (
          <p className="text-muted-foreground mt-3 text-sm font-medium">
            Contact LS Services for application details
          </p>
        )
      ) : job.official_link ? (
        <a
          href={job.official_link}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-brand text-brand-foreground mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
        >
          Visit official site
          <ExternalLink className="size-4" />
        </a>
      ) : (
        <p className="text-muted-foreground mt-3 text-sm font-medium">
          Contact LS Services for application details
        </p>
      )}
    </div>
  );
}

function Chip({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <span className="bg-muted text-muted-foreground flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
      {icon}
      {text}
    </span>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-bold uppercase tracking-wide">{title}</h2>
      <p className="text-foreground/80 mt-2 whitespace-pre-line text-sm leading-relaxed">{body}</p>
    </section>
  );
}

function ReportForm({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const [reason, setReason] = useState(REASONS[0]!);
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (details.length > 500) return;
    setSaving(true);
    try {
      await reportJob({ job_id: jobId, reason, details: details.trim() || null });
      toast.success("Thank you — this job has been reported for review.");
      onClose();
    } catch {
      toast.error("Could not submit the report. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="border-border mt-4 rounded-xl border p-4">
      <p className="text-sm font-semibold">Report this job</p>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="border-border mt-3 h-10 w-full rounded-lg border bg-card px-2 text-sm"
      >
        {REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value.slice(0, 500))}
        placeholder="Add any detail that helps us review this (optional)"
        rows={3}
        className="border-border mt-2 w-full rounded-lg border bg-card p-2 text-sm"
      />
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "Sending…" : "Submit report"}
        </button>
        <button type="button" onClick={onClose} className="px-3 text-sm font-semibold">
          Cancel
        </button>
      </div>
    </form>
  );
}
