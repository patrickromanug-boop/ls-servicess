import { supabase } from "./supabase";

export async function createDashboardCancelInquiry() {
  // Get current user profile
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", userData.user.id)
    .maybeSingle();

  await supabase.from("job_alert_inquiries").insert({
    user_id: userData.user.id,
    full_name: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    attempted_delivery: "dashboard",
  });
}
