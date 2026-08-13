import { queryOptions } from "@tanstack/react-query";
import { supabase } from "./supabase";

export type JobRow = {
  id: string;
  title: string;
  organization: string;
  purpose: string;
  requirements: string;
  other_details: string | null;
  deadline: string;
  official_link: string | null;
  application_method: string | null;
  application_instructions: string | null;
  application_email: string | null;
  views_count: number;
  status: string;
  created_at: string;
  categories: { name: string } | null;
  locations: { name: string } | null;
  job_types: { name: string } | null;
};

export const BASE_COLUMNS =
  "id,title,organization,purpose,requirements,other_details,deadline,official_link,application_method,views_count,status,created_at,categories(name),locations(name),job_types(name)";

export const APPLY_COLUMNS = "application_instructions,application_email";

export const SELECT_COLUMNS = `${BASE_COLUMNS},${APPLY_COLUMNS}`;

/** Returns today's date in YYYY-MM-DD format (UTC). */
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function jobSlug(job: { id: string; title: string }) {
  return `${slugify(job.title)}-${job.id}`;
}

const UUID_AT_END = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function idFromJobSlug(slug: string): string | null {
  return slug.match(UUID_AT_END)?.[0] ?? null;
}

export function daysRemaining(deadline: string) {
  const end = new Date(`${deadline}T23:59:59`).getTime();
  return Math.ceil((end - Date.now()) / 86_400_000);
}

export function deadlineLabel(days: number) {
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function initialsOf(organization: string) {
  return organization
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function isMissingColumn(error: { code?: string } | null) {
  return error?.code === "42703";
}

export async function fetchJobs(): Promise<JobRow[]> {
  const today = todayISO();
  const query = (columns: string) =>
    supabase
      .from("jobs")
      .select(columns)
      .eq("status", "active")
      .gte("deadline", today)          // only show jobs whose deadline hasn't passed
      .order("created_at", { ascending: false })
      .limit(300);

  let { data, error } = await query(SELECT_COLUMNS);
  if (isMissingColumn(error)) ({ data, error } = await query(BASE_COLUMNS));
  if (error) throw error;
  return (data ?? []) as unknown as JobRow[];
}

export async function fetchJobById(id: string): Promise<JobRow | null> {
  const today = todayISO();
  const query = (columns: string) =>
    supabase
      .from("jobs")
      .select(columns)
      .eq("id", id)
      .eq("status", "active")          // hidden if not active
      .gte("deadline", today)          // hidden if deadline has passed
      .maybeSingle();

  let { data, error } = await query(SELECT_COLUMNS);
  if (isMissingColumn(error)) ({ data, error } = await query(BASE_COLUMNS));
  if (error) throw error;
  return (data as unknown as JobRow) ?? null;
}

export const jobsQueryOptions = () =>
  queryOptions({ queryKey: ["jobs"], queryFn: fetchJobs, staleTime: 60_000 });

export const jobQueryOptions = (id: string) =>
  queryOptions({ queryKey: ["job", id], queryFn: () => fetchJobById(id), staleTime: 60_000 });

export async function reportJob(input: { job_id: string; reason: string; details: string | null }) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("reported_jobs").insert({
    job_id: input.job_id,
    reason: input.reason,
    details: input.details,
    user_id: userData.user?.id ?? null,
  });
  if (error) throw error;
}
