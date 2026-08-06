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
  views_count: number;
  status: string;
  created_at: string;
  categories: { name: string } | null;
  locations: { name: string } | null;
  job_types: { name: string } | null;
};

const SELECT =
  "id,title,organization,purpose,requirements,other_details,deadline,official_link,views_count,status,created_at,categories(name),locations(name),job_types(name)";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/** Real crawlable URL segment: /jobs/[slug]-[id] */
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

export async function fetchJobs(): Promise<JobRow[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as unknown as JobRow[];
}

export async function fetchJobById(id: string): Promise<JobRow | null> {
  const { data, error } = await supabase.from("jobs").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as JobRow) ?? null;
}

export const jobsQueryOptions = () =>
  queryOptions({ queryKey: ["jobs"], queryFn: fetchJobs, staleTime: 60_000 });

export const jobQueryOptions = (id: string) =>
  queryOptions({ queryKey: ["job", id], queryFn: () => fetchJobById(id), staleTime: 60_000 });

export async function reportJob(input: { job_id: string; reason: string; details?: string }) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("reported_jobs").insert({
    job_id: input.job_id,
    reason: input.reason,
    details: input.details ?? null,
    user_id: userData.user?.id ?? null,
  });
  if (error) throw error;
}
