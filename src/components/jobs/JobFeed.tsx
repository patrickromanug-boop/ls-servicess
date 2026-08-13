import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, Search, SearchX, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { JobCard } from "./JobCard";
import { jobsQueryOptions, type JobRow } from "@/lib/jobs";
import { supabase } from "@/lib/supabase";

const ALL = "all";
const ADMIN_WHATSAPP = "+256772702263";

// Fetch all available categories
async function fetchAllCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

// Fetch all available locations
async function fetchAllLocations() {
  const { data, error } = await supabase
    .from("locations")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

// Fetch all available job types
async function fetchAllJobTypes() {
  const { data, error } = await supabase
    .from("job_types")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export function JobFeed({ prioritizedJobIds = [] }: { prioritizedJobIds?: string[] }) {
  const { data: jobs } = useSuspenseQuery(jobsQueryOptions());

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchAllCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data: locationsData = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: fetchAllLocations,
    staleTime: 5 * 60 * 1000,
  });

  const { data: jobTypesData = [] } = useQuery({
    queryKey: ["job_types"],
    queryFn: fetchAllJobTypes,
    staleTime: 5 * 60 * 1000,
  });

  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [jobType, setJobType] = useState(ALL);

  const categoryOptions = useMemo(
    () => categoriesData.map((c: any) => c.name),
    [categoriesData]
  );
  const locationOptions = useMemo(
    () => locationsData.map((l: any) => l.name),
    [locationsData]
  );
  const jobTypeOptions = useMemo(
    () => jobTypesData.map((t: any) => t.name),
    [jobTypesData]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filteredJobs = jobs.filter((job: JobRow) => {
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

    // If prioritizedJobIds provided, sort those first (preserving original order otherwise)
    if (prioritizedJobIds.length > 0) {
      const prioritySet = new Set(prioritizedJobIds);
      return filteredJobs.sort((a, b) => {
        const aPriority = prioritySet.has(a.id) ? 0 : 1;
        const bPriority = prioritySet.has(b.id) ? 0 : 1;
        return aPriority - bPriority;
      });
    }

    return filteredJobs;
  }, [jobs, query, category, location, jobType, prioritizedJobIds]);

  // Split filtered jobs into targeted and other when prioritized IDs are provided
  const targetedFiltered = useMemo(() => {
    if (prioritizedJobIds.length === 0) return [];
    const prioritySet = new Set(prioritizedJobIds);
    return filtered.filter((job) => prioritySet.has(job.id));
  }, [filtered, prioritizedJobIds]);

  const otherFiltered = useMemo(() => {
    if (prioritizedJobIds.length === 0) return filtered;
    const prioritySet = new Set(prioritizedJobIds);
    return filtered.filter((job) => !prioritySet.has(job.id));
  }, [filtered, prioritizedJobIds]);

  const activeFilters = [category, location, jobType].filter((v) => v !== ALL).length;

  // Build the WhatsApp message for the empty state
  const buildRequestMessage = () => {
    const parts: string[] = [];
    if (query.trim()) parts.push(`I'm looking for: ${query.trim()}`);
    if (category !== ALL) parts.push(`Category: ${category}`);
    if (location !== ALL) parts.push(`Location: ${location}`);
    if (jobType !== ALL) parts.push(`Job type: ${jobType}`);
    if (parts.length === 0) parts.push("I'm looking for a job");
    return (
      "Hi LS Services! I couldn't find a job that matches my search.\n\n" +
      parts.join("\n") +
      "\n\nPlease help me find or post a suitable job."
    );
  };

  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(
    buildRequestMessage()
  )}`;

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card p-2 shadow-sm sm:p-2.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, organizations, locations"
            aria-label="Search jobs"
            className="border-border/80 focus:border-brand focus:ring-brand/10 h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition-shadow focus:ring-4"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className="border-border hover:border-brand hover:bg-brand-soft flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-4 text-sm font-bold transition-colors"
        >
          Filters
          {activeFilters > 0 && (
            <span className="bg-accent-orange text-accent-orange-foreground rounded-full px-1.5 text-[11px] font-bold">
              {activeFilters}
            </span>
          )}
          <ChevronDown
            className={`size-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      </div>

      {showFilters && (
        <div className="border-border bg-muted/45 mt-3 grid gap-3 rounded-xl border p-4 sm:grid-cols-3">
          <FilterSelect
            label="Category"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
          />
          <FilterSelect
            label="Location"
            value={location}
            onChange={setLocation}
            options={locationOptions}
          />
          <FilterSelect
            label="Job type"
            value={jobType}
            onChange={setJobType}
            options={jobTypeOptions}
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
      </div>

      <p className="text-muted-foreground mt-7 text-sm font-semibold">
        {filtered.length} {filtered.length === 1 ? "job" : "jobs"} found
      </p>

      {filtered.length === 0 ? (
        <div className="border-border bg-card mt-4 rounded-2xl border border-dashed p-10 text-center">
          <SearchX className="text-muted-foreground mx-auto size-8" />
          <p className="mt-3 font-semibold">No jobs match your search</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Try a different keyword or clear your filters to see all open jobs.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand/90"
          >
            <MessageCircle className="size-4" />
            Request this job on WhatsApp
          </a>
        </div>
      ) : prioritizedJobIds.length > 0 ? (
        <div className="mt-4 space-y-8">
          {targetedFiltered.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold">Targeted Jobs</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Jobs that match your preferred categories and locations.
              </p>
              <div className="mt-4 grid gap-3">
                {targetedFiltered.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </section>
          )}

          {otherFiltered.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold">Other Jobs</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                All other open positions you might be interested in.
              </p>
              <div className="mt-4 grid gap-3">
                {otherFiltered.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </section>
          )}
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
        className="border-border focus:border-brand mt-1 h-10 w-full rounded-xl border bg-card px-3 text-sm outline-none"
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
