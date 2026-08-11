import { queryOptions } from "@tanstack/react-query";
import { supabase } from "./supabase";

/* ---------------------------------------------------------------- lookups -- */

export type Lookup = { id: string; name: string };

async function fetchLookup(table: "categories" | "locations" | "job_types"): Promise<Lookup[]> {
  const { data, error } = await supabase.from(table).select("id,name").order("name");
  if (error) throw error;
  return (data ?? []) as Lookup[];
}

export const lookupQueryOptions = (table: "categories" | "locations" | "job_types") =>
  queryOptions({ queryKey: ["lookup", table], queryFn: () => fetchLookup(table) });

export async function addLookup(
  table: "categories" | "locations" | "job_types",
  name: string,
): Promise<Lookup> {
  const { data, error } = await supabase.from(table).insert({ name }).select("id,name").single();
  if (error) throw error;
  return data as Lookup;
}

/* ------------------------------------------------------------------ admin -- */

export async function fetchMyRole(): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
  if (error) throw error;
  return ((data as { role?: string | null } | null)?.role ?? null) as string | null;
}

export const myRoleQueryOptions = () =>
  queryOptions({ queryKey: ["my_role"], queryFn: fetchMyRole, staleTime: 30_000 });

/* --------------------------------------------------------------- job admin -- */

export type AdminJobRow = {
  id: string;
  title: string;
  organization: string;
  deadline: string;
  status: string;
  views_count: number;
  created_at: string;
  purpose: string | null;
  requirements: string | null;
  other_details: string | null;
  official_link: string | null;
  application_method: string | null;
  application_instructions: string | null;
  application_email: string | null;
  opens_externally: boolean | null;
  required_documents: string[] | null;
  category_id: string | null;
  location_id: string | null;
  job_type_id: string | null;
  categories: { name: string } | null;
  locations: { name: string } | null;
  job_types: { name: string } | null;
};

const ADMIN_JOB_COLUMNS =
  "id,title,organization,deadline,status,views_count,created_at,purpose,requirements,other_details,official_link,application_method,application_instructions,application_email,opens_externally,required_documents,category_id,location_id,job_type_id,categories(name),locations(name),job_types(name)";

export async function fetchAdminJobs(): Promise<AdminJobRow[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(ADMIN_JOB_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as AdminJobRow[];
}

export const adminJobsQueryOptions = () =>
  queryOptions({ queryKey: ["admin_jobs"], queryFn: fetchAdminJobs });

export type JobInput = {
  title: string;
  organization: string;
  deadline: string;
  category_id: string | null;
  location_id: string | null;
  job_type_id: string | null;
  purpose: string;
  requirements: string;
  other_details: string | null;
  application_instructions: string | null;
  application_method: string;
  official_link: string | null;
  application_email: string | null;
  opens_externally: boolean;
  required_documents: string[];
};

export async function createJob(input: JobInput, postedBy: string) {
  const { error } = await supabase.from("jobs").insert({ ...input, status: "active", posted_by: postedBy });
  if (error) throw error;
}

export async function updateJob(id: string, patch: Partial<JobInput> & { status?: string }) {
  const { error } = await supabase.from("jobs").update(patch).eq("id", id);
  if (error) throw error;
}

/* ---------------------------------------------------------- reported jobs -- */

export type ReportRow = {
  id: string;
  job_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  jobs: { id: string; title: string; organization: string; status: string } | null;
};

export async function fetchReports(): Promise<ReportRow[]> {
  const { data, error } = await supabase
    .from("reported_jobs")
    .select("id,job_id,reason,details,status,created_at,jobs(id,title,organization,status)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReportRow[];
}

export const reportsQueryOptions = () =>
  queryOptions({ queryKey: ["admin_reports"], queryFn: fetchReports });

export async function dismissReport(id: string) {
  const { error } = await supabase.from("reported_jobs").update({ status: "reviewed" }).eq("id", id);
  if (error) throw error;
}

export async function removeReportedJob(reportId: string, jobId: string) {
  await dismissReport(reportId);
  const { error } = await supabase.from("jobs").update({ status: "archived" }).eq("id", jobId);
  if (error) throw error;
}

/* ------------------------------------------------------------ subscribers -- */

export type SubscriberRow = {
  id: string;
  user_id: string;
  tier: string | null;
  billing_cycle: string | null;
  status: string;
  trial_ends_at: string | null;
  renewal_date: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

export async function fetchSubscribers(): Promise<SubscriberRow[]> {
  const { data, error } = await supabase
    .from("web_subscriptions")
    .select(
      "id,user_id,tier,billing_cycle,status,trial_ends_at,renewal_date,created_at,profiles(full_name,phone)",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as SubscriberRow[];
}

export const subscribersQueryOptions = () =>
  queryOptions({ queryKey: ["admin_subscribers"], queryFn: fetchSubscribers });

/* ------------------------------------------------------ document requests -- */

export type AdminDocRequest = {
  id: string;
  user_id: string;
  document_type: string;
  form_data: Record<string, unknown> | null;
  status: string;
  pdf_url: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

export async function fetchAdminDocRequests(): Promise<AdminDocRequest[]> {
  const { data, error } = await supabase
    .from("document_requests")
    .select("id,user_id,document_type,form_data,status,pdf_url,created_at,profiles(full_name,phone)")
    .in("status", ["pending", "sent_to_admin"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminDocRequest[];
}

export const adminDocRequestsQueryOptions = () =>
  queryOptions({ queryKey: ["admin_doc_requests"], queryFn: fetchAdminDocRequests });

export async function completeDocRequest(id: string) {
  const { error } = await supabase
    .from("document_requests")
    .update({ status: "completed" })
    .eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------ employer inquiries -- */

export async function fetchEmployerInquiries(): Promise<{ created_at: string }[]> {
  const { data, error } = await supabase
    .from("employer_inquiries")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as { created_at: string }[];
}

export const employerInquiriesQueryOptions = () =>
  queryOptions({ queryKey: ["admin_inquiries"], queryFn: fetchEmployerInquiries });

/* ------------------------------------------------------------------ users -- */

export type AdminUserRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  created_at: string | null;
};

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,phone,role,created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as AdminUserRow[];
}

export const adminUsersQueryOptions = () =>
  queryOptions({ queryKey: ["admin_users"], queryFn: fetchAdminUsers });

/* ----------------------------------------------------------------- stats --- */

export type AdminStats = {
  activeJobs: number;
  users: number;
  activeSubscribers: number;
  pendingDocuments: number;
};

async function countOf(
  table: string,
  apply?: (q: ReturnType<typeof supabase.from>) => unknown,
): Promise<number> {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (apply) query = apply(query as never) as typeof query;
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const [activeJobs, users, activeSubscribers, pendingDocuments] = await Promise.all([
    countOf("jobs", (q) => (q as never as { eq: (a: string, b: string) => unknown }).eq("status", "active")),
    countOf("profiles"),
    countOf("web_subscriptions", (q) =>
      (q as never as { eq: (a: string, b: string) => unknown }).eq("status", "active"),
    ),
    countOf("document_requests", (q) =>
      (q as never as { eq: (a: string, b: string) => unknown }).eq("status", "pending"),
    ),
  ]);
  return { activeJobs, users, activeSubscribers, pendingDocuments };
}

export const adminStatsQueryOptions = () =>
  queryOptions({ queryKey: ["admin_stats"], queryFn: fetchAdminStats });

/** Buckets timestamps into the last 4 ISO weeks (oldest first). */
export function weeklyBuckets(dates: string[]): { label: string; count: number }[] {
  const now = Date.now();
  const week = 7 * 86_400_000;
  const buckets = [3, 2, 1, 0].map((i) => ({
    label: i === 0 ? "This week" : `${i}w ago`,
    from: now - (i + 1) * week,
    to: now - i * week,
    count: 0,
  }));
  for (const d of dates) {
    const t = new Date(d).getTime();
    const b = buckets.find((x) => t >= x.from && t < x.to);
    if (b) b.count += 1;
  }
  return buckets.map(({ label, count }) => ({ label, count }));
}
