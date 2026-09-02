import { Link } from "@tanstack/react-router";
import { Building2, Eye, MapPin, Briefcase } from "lucide-react";
import { useState } from "react";
import { daysRemaining, deadlineLabel, initialsOf, jobSlug, type JobRow } from "@/lib/jobs";

/**
 * Returns a Google favicon service URL for a given official link.
 * If the link is missing/invalid, returns null so the caller can fall back.
 */
function getFaviconUrl(officialLink: string | null | undefined): string | null {
  if (!officialLink) return null;
  try {
    const domain = new URL(officialLink).hostname;
    if (!domain) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  } catch {
    return null;
  }
}

/** Renders the favicon or initials badge for a job. */
function BrandLogo({ job }: { job: JobRow }) {
  const [failed, setFailed] = useState(false);
  const favicon = getFaviconUrl(job.official_link);

  if (!favicon || failed) {
    return (
      <span className="bg-brand-soft text-brand font-display grid size-11 shrink-0 place-items-center rounded-lg text-sm font-bold">
        {initialsOf(job.organization)}
      </span>
    );
  }

  return (
    <img
      src={favicon}
      alt=""
      width={44}
      height={44}
      loading="lazy"
      className="size-11 shrink-0 rounded-lg border border-border bg-white object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export function JobCard({ job }: { job: JobRow }) {
  const days = daysRemaining(job.deadline);
  const urgent = days <= 3;

  return (
    <Link
      to="/jobs/$jobSlug"
      params={{ jobSlug: jobSlug(job) }}
      state={{ jobModal: true } as never}
      className="border-border hover:border-brand group block rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3.5">
        <BrandLogo job={job} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold transition-colors group-hover:text-brand">{job.title}</h3>
          <div className="flex items-center justify-between gap-2 w-full">
            <p className="text-muted-foreground mt-0.5 flex flex-1 min-w-0 items-center gap-1.5 truncate text-sm">
              <Building2 className="size-3.5 shrink-0" />
              {job.organization}
            </p>
            <span
              className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                urgent ? "bg-urgent-soft text-urgent" : "bg-muted text-muted-foreground"
              }`}
            >
              {deadlineLabel(days)}
            </span>
          </div>

          <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/70 pt-3 text-xs">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {job.locations?.name ?? "Uganda"}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-3.5" />
              {job.job_types?.name ?? "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="size-3.5" />
              {job.views_count} views
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
