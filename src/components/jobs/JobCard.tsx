import { Link } from "@tanstack/react-router";
import { Building2, Eye, MapPin, Briefcase } from "lucide-react";
import { daysRemaining, deadlineLabel, initialsOf, jobSlug, type JobRow } from "@/lib/jobs";

export function JobCard({ job }: { job: JobRow }) {
  const days = daysRemaining(job.deadline);
  const urgent = days <= 3;

  return (
    <Link
      to="/jobs/$jobSlug"
      params={{ jobSlug: jobSlug(job) }}
      state={{ jobModal: true } as never}
      className="border-border hover:border-brand block rounded-xl border bg-card p-4 transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className="bg-brand-soft text-brand font-display grid size-11 shrink-0 place-items-center rounded-lg text-sm font-bold">
          {initialsOf(job.organization)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{job.title}</h3>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate text-sm">
            <Building2 className="size-3.5 shrink-0" />
            {job.organization}
          </p>

          <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
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
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            urgent ? "bg-urgent-soft text-urgent" : "bg-muted text-muted-foreground"
          }`}
        >
          {deadlineLabel(days)}
        </span>
      </div>
    </Link>
  );
}
