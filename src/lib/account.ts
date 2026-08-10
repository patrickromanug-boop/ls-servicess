import { queryOptions } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { BillingCycle, DocumentType, Tier } from "./plans";
import { planByTier, formatUgx } from "./plans";

export type WebSubscription = {
  id: string;
  user_id: string;
  tier: Tier | null;
  billing_cycle: BillingCycle | null;
  status: "trial" | "active" | "expired";
  trial_ends_at: string | null;
  renewal_date: string | null;
  document_generations_used_this_period: number;
  period_started_at: string;
  payment_provider_ref: string | null;
};

export type PaymentRow = {
  id: string;
  amount: number;
  tier: Tier | null;
  billing_cycle: BillingCycle | null;
  status: string;
  paid_at: string | null;
  created_at: string;
};

export type DocumentRequestRow = {
  id: string;
  document_type: string;
  status: "pending" | "sent_to_admin" | "completed";
  pdf_url: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  preferred_categories: string[] | null;
  preferred_locations: string[] | null;
};

/** Creates the trial (or an immediately-expired row for repeat phone numbers). */
export async function ensureWebSubscription(): Promise<WebSubscription> {
  const { data, error } = await supabase.rpc("web_ensure_subscription");
  if (error) throw error;
  return data as WebSubscription;
}

export async function fetchWebSubscription(): Promise<WebSubscription | null> {
  const { data, error } = await supabase.from("web_subscriptions").select("*").maybeSingle();
  if (error) throw error;
  return (data as WebSubscription) ?? null;
}

export async function selectPlan(tier: Tier, cycle: BillingCycle): Promise<WebSubscription> {
  const { data, error } = await supabase.rpc("web_select_plan", { _tier: tier, _cycle: cycle });
  if (error) throw error;
  return data as WebSubscription;
}

export async function fetchPayments(): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("id,amount,tier,billing_cycle,status,paid_at,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PaymentRow[];
}

export async function fetchDocumentRequests(): Promise<DocumentRequestRow[]> {
  const { data, error } = await supabase
    .from("document_requests")
    .select("id,document_type,status,pdf_url,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentRequestRow[];
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,phone,preferred_categories,preferred_locations")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow) ?? null;
}

export async function updateProfile(userId: string, patch: Partial<ProfileRow>) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...patch }, { onConflict: "id" });
  if (error) throw error;
}

export async function createDocumentRequest(documentType: DocumentType, formData: unknown) {
  const { data, error } = await supabase.rpc("web_create_document_request", {
    _type: documentType,
    _form: formData,
  });
  if (error) throw error;
  return data as DocumentRequestRow;
}

export async function attachDocumentPdf(id: string, pdfUrl: string) {
  const { error } = await supabase.rpc("web_attach_document_pdf", { _id: id, _pdf_url: pdfUrl });
  if (error) throw error;
}

/** Hard delete: removes every app row for this user, then signs them out. */
export async function deleteAccount() {
  const { error } = await supabase.rpc("web_delete_account");
  if (error) throw error;
  await supabase.auth.signOut();
}

export const subscriptionQueryOptions = () =>
  queryOptions({ queryKey: ["web_subscription"], queryFn: fetchWebSubscription });

export const paymentsQueryOptions = () =>
  queryOptions({ queryKey: ["payments"], queryFn: fetchPayments });

export const documentRequestsQueryOptions = () =>
  queryOptions({ queryKey: ["document_requests"], queryFn: fetchDocumentRequests });

export const profileQueryOptions = (userId: string) =>
  queryOptions({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId) });

export function trialDaysLeft(sub: WebSubscription | null) {
  if (!sub?.trial_ends_at) return 0;
  const ms = new Date(sub.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function isTrialActive(sub: WebSubscription | null) {
  return !!sub && sub.status === "trial" && trialDaysLeft(sub) > 0;
}

/** null = unlimited */
export function documentAllowance(sub: WebSubscription | null): number | null {
  if (isTrialActive(sub)) return null;
  if (!sub?.tier) return 0;
  const plan = planByTier(sub.tier);
  return plan.documentsPerMonth;
}

export function documentsRemaining(sub: WebSubscription | null): number | null {
  const allowance = documentAllowance(sub);
  if (allowance === null) return null;
  return Math.max(0, allowance - (sub?.document_generations_used_this_period ?? 0));
}

/**
 * PAYMENT PLACEHOLDER.
 * TODO(payments): replace with the real Pesapal flow once the merchant account
 * is live. That work belongs server-side: create a `payments` row, request a
 * Pesapal order, redirect to the checkout URL, and flip
 * web_subscriptions.status to 'active' from the verified IPN/callback only.
 * Nothing about payment state may ever be written from the browser.
 */
export async function initiateWebPayment(tier: Tier, billingCycle: BillingCycle) {
  const plan = planByTier(tier);
  return {
    ok: false as const,
    message: `Payment integration coming soon — ${plan.name} at ${formatUgx(
      plan.price[billingCycle],
    )} per ${billingCycle === "weekly" ? "week" : "month"}. We'll enable card and mobile money checkout shortly.`,
  };
}
