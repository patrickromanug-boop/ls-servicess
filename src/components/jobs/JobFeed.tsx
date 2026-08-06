import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { JobCard } from "./JobCard";
import { jobsQueryOptions, type JobRow } from "@/lib/jobs";

const ALL = "all";

function unique(values: (string | undefined | null)[]) {
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort();
}

export function JobFeed() {
  const { data: jobs } = useSuspenseQuery(jobsQueryOptions());
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [jobType, setJobType] = useState(ALL);

  const options = useMemo(
    () => ({
      categories: unique(jobs.map((j) => j.categories?.name)),
      locations: unique(jobs.map((j) => j.locations?.name)),
      jobTypes: unique(jobs.map((j) => j.job_types?.name)),
    }),
    [jobs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job: JobRow) => {
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.organization.toLowerCase().includes(q) ||
        (job.locations?.name ?? "").toLowerCase().includes(q);
      return (
        matchesQuery &&
        (category === ALL || job.categories?.name === category) &&
        (location === ALL || job.locations?.name === location) &&
        (jobType === ALL || job.job_types?.name === jobType)
      );
    });
  }, [jobs, query, category, location, jobType]);

  const activeFilters = [category, location, jobType].filter((v) => v !== ALL).length;

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, organizations, locations"
            aria-label="Search jobs"
            className="border-border focus:border-brand h-11 w-full rounded-lg border bg-card pl-9 pr-3 text-sm outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className="border-border hover:border-brand flex h-11 shrink-0 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold"
        >
          Filters
          {activeFilters > 0 && (
            <span className="bg-accent-orange text-accent-orange-foreground rounded-full px-1.5 text-[11px] font-bold">
              {activeFilters}
            </span>
          )}
          <ChevronDown className={`size-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showFilters && (
        <div className="border-border bg-muted/40 mt-2 grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
          <FilterSelect
            label="Category"
            value={category}
            onChange={setCategory}
            options={options.categories}
          />
          <FilterSelect
            label="Location"
            value={location}
            onChange={setLocation}
            options={options.locations}
          />
          <FilterSelect
            label="Job type"
            value={jobType}
            onChange={setJobType}
            options={options.jobTypes}
          />
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setCategory(ALL);
                setLocation(ALL);
                setJobType(ALL);
              }}
              className="text-brand justify-self-start text-xs font-semibold sm:col-span-3"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      <p className="text-muted-foreground mt-6 text-sm font-semibold">
        {filtered.length} {filtered.length === 1 ? "job" : "jobs"} found
      </p>

      {filtered.length === 0 ? (
        <div className="border-border mt-4 rounded-xl border border-dashed p-10 text-center">
          <SearchX className="text-muted-foreground mx-auto size-8" />
          <p className="mt-3 font-semibold">No jobs match your search</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Try a different keyword or clear your filters to see all open jobs.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-muted-foreground text-xs font-semibold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border mt-1 h-10 w-full rounded-lg border bg-card px-2 text-sm outline-none"
      >
        <option value={ALL}>All {label.toLowerCase()}s</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
