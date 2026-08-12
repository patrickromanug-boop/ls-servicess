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
import { JobCard } from "@/components/jobs/JobCard";
import { JobDetail } from "@/components/jobs/JobDetail";
import { jobsQueryOptions, type JobRow } from "@/lib/jobs";
import { createDashboardCancelInquiry } from "@/lib/alert-inquiries";

const ADMIN_WHATSAPP = "+256772702263";

// ---- Tab definitions (reordered) ----
const TAB_IDS = {
  "job-listing": "job-listing",   // first now
  "bill-plans": "bill-plans",
  targeted: "targeted",
  documents: "documents",
  profile: "profile",
  services: "services",
} as const;
type TabId = (typeof TAB_IDS)[keyof typeof TAB_IDS];

function buildTabs(hasActivePlan: boolean) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "job-listing", label: "Job Listing" },   // first tab
    { id: "bill-plans", label: "Bill & Plans" },
  ];
  if (hasActivePlan) {
    tabs.push({ id: "targeted", label: "Targeted Jobs" });
  }
  tabs.push(
    { id: "documents", label: "Documents" },
    { id: "profile", label: "Profile" },
    { id: "services", label: "Other services" }
  );
  return tabs;
}

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

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("job-listing");   // default to job listing

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
          {tab === "job-listing" && <JobListingPanel userId={user.id} />}
          {tab === "bill-plans" && (
            <>
              <PlanSection sub={sub} />
              <div className="mt-8">
                <BillingSection />
              </div>
            </>
          )}
          {tab === "targeted" && (
            <TargetedJobsPanel
              userId={user.id}
              subscription={sub}
              profile={profileQuery.data}
              onSwitchToProfile={() => setTab("profile")}
            />
          )}
          {tab === "documents" && (
            <DocumentsSection user={user} sub={sub} fullName={fullName} />
          )}
          {tab === "profile" && <ProfileSection user={user} />}
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

// ---- Targeted Jobs Panel (alert delivery only) ----
function TargetedJobsPanel({
  userId,
  subscription,
  profile,
  onSwitchToProfile,
}: {
  userId: string;
  subscription: WebSubscription | null;
  profile: any;
  onSwitchToProfile: () => void;
}) {
  const queryClient = useQueryClient();
  const [pendingDelivery, setPendingDelivery] = useState<"dashboard" | "whatsapp" | "both" | null>(null);
  const currentDelivery = subscription?.alert_delivery ?? "dashboard";

  const phone = profile?.phone?.trim();
  const hasPreferences =
    (profile?.preferred_categories && profile.preferred_categories.length > 0) ||
    (profile?.preferred_locations && profile.preferred_locations.length > 0);
  const profileComplete = !!phone && hasPreferences;

  const handleRadioClick = (value: "dashboard" | "whatsapp" | "both") => {
    if (!profileComplete) {
      onSwitchToProfile();
      return;
    }
    setPendingDelivery(value);
  };

  const handleConfirm = async () => {
    if (!pendingDelivery) return;
    try {
      await updateAlertDelivery(pendingDelivery);
      queryClient.invalidateQueries({ queryKey: subscriptionQueryOptions().queryKey });
      setPendingDelivery(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async () => {
    if (!pendingDelivery) return;
    const userFullName = profile?.full_name ?? "User";
    if (pendingDelivery === "whatsapp" || pendingDelivery === "both") {
      const msg = encodeURIComponent(
        `${userFullName} cancelled a WhatsApp job alert request (pending choice: ${pendingDelivery}).`
      );
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`, "_blank");
    } else if (pendingDelivery === "dashboard") {
      await createDashboardCancelInquiry().catch(console.error);
    }
    setPendingDelivery(null);
  };

  return (
    <div className="border-border rounded-2xl border bg-white p-5">
      <h3 className="font-display text-sm font-bold">Job alert delivery</h3>
      <p className="text-muted-foreground mt-1 text-xs">
        Choose how you'd like to receive job matches.
      </p>

      {!profileComplete && (
        <p className="text-amber-600 text-xs mt-2">
          Please complete your profile (phone number and at least one job preference) to enable alerts.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-3">
        {(["dashboard", "whatsapp", "both"] as const).map((option) => {
          const isCurrentReal = currentDelivery === option && pendingDelivery === null;
          const isPending = pendingDelivery === option;
          return (
            <label
              key={option}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${
                isPending
                  ? "border-brand bg-brand/10 text-brand"
                  : isCurrentReal
                  ? "border-brand bg-brand/5 text-brand"
                  : "border-border text-muted-foreground hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="alert_delivery"
                value={option}
                checked={isPending || isCurrentReal}
                onChange={() => handleRadioClick(option)}
                className="hidden"
              />
              {option === "dashboard" && "Dashboard only"}
              {option === "whatsapp" && "WhatsApp reach-out"}
              {option === "both" && "Both"}
            </label>
          );
        })}
      </div>

      {pendingDelivery && profileComplete && (
        <div className="mt-4 rounded-xl border border-brand/20 bg-brand/[0.03] p-4">
          <p className="text-xs font-medium">
            Confirm your alert delivery preference: <strong className="capitalize">{pendingDelivery}</strong>
          </p>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {profile?.full_name && <p>Name: {profile.full_name}</p>}
            {phone && <p>Phone: {phone}</p>}
            {profile?.preferred_categories?.length > 0 && (
              <p>Categories: {profile.preferred_categories.join(", ")}</p>
            )}
            {profile?.preferred_locations?.length > 0 && (
              <p>Locations: {profile.preferred_locations.join(", ")}</p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleConfirm}
              className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white"
            >
              Confirm
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-bold text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={onSwitchToProfile}
              className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-500"
            >
              Edit Info
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            {pendingDelivery !== "dashboard"
              ? "If you cancel, the admin will be notified via WhatsApp."
              : "If you cancel, the admin will be notified in the portal."}
          </p>
        </div>
      )}
    </div>
  );
}

// ---- Job Listing Panel (same cards as homepage) ----
function JobListingPanel({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const allJobsQuery = useQuery(jobsQueryOptions());
  const subQuery = useQuery({ ...subscriptionQueryOptions(), enabled: !!userId });
  const profileQuery = useQuery({ ...profileQueryOptions(userId), enabled: !!userId });

  const hasActivePlan = subQuery.data && (subQuery.data.status === "trial" || subQuery.data.status === "active");
  const preferredCategories = profileQuery.data?.preferred_categories ?? [];
  const preferredLocations = profileQuery.data?.preferred_locations ?? [];

  const targetedJobsQuery = useQuery({
    queryKey: ["targeted-jobs", userId],
    queryFn: () => fetchTargetedJobs(preferredCategories, preferredLocations),
    enabled: !!userId && hasActivePlan && (preferredCategories.length > 0 || preferredLocations.length > 0),
    staleTime: 30_000,
  });

  const targetedJobs = targetedJobsQuery.data ?? [];
  const allJobs = allJobsQuery.data ?? [];
  const targetedIds = new Set(targetedJobs.map((j) => j.id));
  const otherJobs = allJobs.filter((j) => !targetedIds.has(j.id));

  // Popup state (exactly like homepage)
  const [selectedJob, setSelectedJob] = useState<JobRow | null>(null);

  const openJob = (job: JobRow) => {
    setSelectedJob(job);
    // Quietly update URL for SEO (optional inside dashboard, but consistent)
    window.history.pushState(null, "", `/jobs/${job.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${job.id}`);
  };

  const closeJob = () => {
    setSelectedJob(null);
    window.history.pushState(null, "", "/dashboard");
  };

  useEffect(() => {
    const handlePopState = () => setSelectedJob(null);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div>
      <h2 className="font-display text-lg font-bold">Job Listings</h2>
      <p className="text-muted-foreground text-xs mt-1">
        Find work that matches your preferences, or browse all open positions.
      </p>

      {/* Targeted jobs section */}
      {hasActivePlan && targetedJobs.length > 0 && (
        <section className="mt-6">
          <h3 className="font-display text-base font-semibold">Jobs for You</h3>
          <p className="text-muted-foreground text-xs mt-1">
            Based on your preferred categories and locations.
          </p>
          <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
            {targetedJobs.map((job) => (
              <JobCard key={job.id} job={job} onClick={() => openJob(job)} />
            ))}
          </div>
        </section>
      )}

      {/* All other jobs */}
      <section className="mt-8">
        <h3 className="font-display text-base font-semibold">
          {targetedJobs.length > 0 ? "All Other Jobs" : "All Jobs"}
        </h3>
        <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherJobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={() => openJob(job)} />
          ))}
        </div>
      </section>

      {/* Popup */}
      {selectedJob && (
        <JobDetail
          job={selectedJob}
          onClose={closeJob}
          onApplyNow={() => {
            navigate({ to: "/auth/login", search: { redirect: `/jobs/${selectedJob.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${selectedJob.id}` } });
          }}
        />
      )}

      {/* Loading / empty states */}
      {allJobsQuery.isPending && (
        <p className="text-muted-foreground text-sm mt-6">Loading jobs…</p>
      )}
      {!allJobsQuery.isPending && allJobs.length === 0 && (
        <p className="text-muted-foreground text-sm mt-6">No jobs available at the moment.</p>
      )}
    </div>
  );
}
