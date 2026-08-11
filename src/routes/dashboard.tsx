import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth";
import {
  profileQueryOptions,
  subscriptionQueryOptions,
  updateAlertDelivery,
  fetchTargetedJobs,
  type WebSubscription,
} from "@/lib/account";
import { ProfileSection, Card } from "@/components/dashboard/ProfileSection";
import { PlanSection } from "@/components/dashboard/PlanSection";
import { BillingSection } from "@/components/dashboard/BillingSection";
import { DocumentsSection } from "@/components/dashboard/DocumentsSection";
import { OtherServicesCards } from "@/components/site/OtherServicesCards";
import {
  daysRemaining,
  deadlineLabel,
  initialsOf,
  type JobRow,
} from "@/lib/jobs";

// ---- Tab definitions ----
const TAB_IDS = {
  plan: "plan",
  targeted: "targeted",
  documents: "documents",
  profile: "profile",
  billing: "billing",
  services: "services",
} as const;
type TabId = (typeof TAB_IDS)[keyof typeof TAB_IDS];

function buildTabs(hasActivePlan: boolean) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "plan", label: "Your plan" },
  ];
  if (hasActivePlan) {
    tabs.push({ id: "targeted", label: "Targeted Jobs" });
  }
  tabs.push(
    { id: "documents", label: "Documents" },
    { id: "profile", label: "Profile" },
    { id: "billing", label: "Billing" },
    { id: "services", label: "Other services" }
  );
  return tabs;
}

// ---- Route ----
export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your dashboard — LS Services" },
      {
        name: "description",
        content:
          "Manage your LS Services profile, job alert preferences, plan, billing history and document requests.",
      },
      { property: "og:title", content: "Your dashboard — LS Services" },
      { property: "og:description", content: "Manage your LS Services account and documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

// ---- Main component ----
function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("plan");

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth/login", search: { redirect: "/dashboard" }, replace: true });
    }
  }, [loading, user, navigate]);

  const subQuery = useQuery({
    ...subscriptionQueryOptions(),
    enabled: !!user,
  });
  const profileQuery = useQuery({
    ...profileQueryOptions(user?.id ?? ""),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-20">
          <p className="text-muted-foreground text-sm">Loading your dashboard…</p>
        </main>
        <Footer />
      </div>
    );
  }

  const sub = subQuery.data ?? null;
  const hasActivePlan = sub && (sub.status === "trial" || sub.status === "active");
  const tabs = buildTabs(!!hasActivePlan);

  const fullName =
    profileQuery.data?.full_name ?? (user.user_metadata?.["full_name"] as string) ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="font-display text-2xl font-bold">
          {fullName ? `Welcome back, ${fullName.split(" ")[0]}` : "Your dashboard"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your plan, preferences and documents in one place.
        </p>

        <div className="border-border mt-6 flex gap-1 overflow-x-auto border-b">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                tab === item.id
                  ? "border-brand text-brand"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "plan" && <PlanSection sub={sub} />}
          {tab === "targeted" && <TargetedJobsPanel userId={user.id} subscription={sub} />}
          {tab === "documents" && (
            <DocumentsSection user={user} sub={sub} fullName={fullName} />
          )}
          {tab === "profile" && <ProfileSection user={user} />}
          {tab === "billing" && <BillingSection />}
          {tab === "services" && (
            <Card title="Other services from LS Services">
              <OtherServicesCards />
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ---- Targeted Jobs panel ----
function TargetedJobsPanel({
  userId,
  subscription,
}: {
  userId: string;
  subscription: WebSubscription | null;
}) {
  const profileQuery = useQuery(profileQueryOptions(userId));
  const queryClient = useQueryClient();

  const preferredCategories = profileQuery.data?.preferred_categories ?? [];
  const preferredLocations = profileQuery.data?.preferred_locations ?? [];

  const targetedJobsQuery = useQuery({
    queryKey: ["targeted-jobs", userId],
    queryFn: () => fetchTargetedJobs(preferredCategories, preferredLocations),
    enabled: preferredCategories.length > 0 || preferredLocations.length > 0,
    staleTime: 30_000,
  });

  const currentDelivery = subscription?.alert_delivery ?? "dashboard";

  const handleDeliveryChange = async (value: string) => {
    try {
      await updateAlertDelivery(value as "dashboard" | "whatsapp" | "both");
      queryClient.invalidateQueries({ queryKey: subscriptionQueryOptions().queryKey });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Preference toggle */}
      <div className="border-border rounded-2xl border bg-white p-5">
        <h3 className="font-display text-sm font-bold">Job alert delivery</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          Choose how you'd like to receive job matches.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {(["dashboard", "whatsapp", "both"] as const).map((option) => (
            <label
              key={option}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${
                currentDelivery === option
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-muted-foreground hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="alert_delivery"
                value={option}
                checked={currentDelivery === option}
                onChange={() => handleDeliveryChange(option)}
                className="hidden"
              />
              {option === "dashboard" && "Dashboard only"}
              {option === "whatsapp" && "WhatsApp reach-out"}
              {option === "both" && "Both"}
            </label>
          ))}
        </div>
      </div>

      {/* Jobs list */}
      <div className="mt-6">
        <h3 className="font-display text-sm font-bold">Jobs matching your preferences</h3>
        {preferredCategories.length === 0 && preferredLocations.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            Set your preferred job categories and locations in your Profile tab to see targeted
            jobs here.
          </p>
        ) : targetedJobsQuery.isPending ? (
          <p className="text-muted-foreground mt-2 text-sm">Loading jobs…</p>
        ) : targetedJobsQuery.data?.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            No active jobs match your preferences right now. Check back later.
          </p>
        ) : (
          <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
            {targetedJobsQuery.data!.map((job) => (
              <JobMiniCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Mini job card for dashboard ----
function JobMiniCard({ job }: { job: JobRow }) {
  const days = daysRemaining(job.deadline);
  return (
    <div className="border-border rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14204F] text-xs font-bold text-white">
          {initialsOf(job.organization)}
        </span>
        <div>
          <p className="text-xs font-semibold line-clamp-1">{job.title}</p>
          <p className="text-[10px] text-muted-foreground">{job.organization}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-2 text-[10px] text-muted-foreground">
          {job.locations && <span>{job.locations.name}</span>}
          {job.job_types && <span>· {job.job_types.name}</span>}
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            days <= 3 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {deadlineLabel(days)}
        </span>
      </div>
    </div>
  );
}
