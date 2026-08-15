import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";
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
import { JobFeed } from "@/components/jobs/JobFeed";
import { createDashboardCancelInquiry } from "@/lib/alert-inquiries";
import { Sparkles, Check } from "lucide-react";

const ADMIN_WHATSAPP = "+256772702263";

// ---- Tab definitions ----
const TAB_IDS = {
  "job-listing": "job-listing",
  "bill-plans": "bill-plans",
  targeted: "targeted",
  documents: "documents",
  profile: "profile",
  services: "services",
} as const;
type TabId = (typeof TAB_IDS)[keyof typeof TAB_IDS];

function buildTabs(hasActivePlan: boolean) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "job-listing", label: "Job Listing" },
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

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("job-listing");

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

  // Redirect to plans if user exists but has no subscription row yet
  useEffect(() => {
    if (user && subQuery.data === null && !subQuery.isLoading) {
      navigate({ to: "/plans", replace: true });
    }
  }, [user, subQuery.data, subQuery.isLoading, navigate]);

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

        <div className="border-border mt-6 flex flex-wrap gap-1 border-b pb-2">
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
          {tab === "job-listing" && (
            <JobListingTab userId={user.id} hasActivePlan={!!hasActivePlan} />
          )}
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

// ---- Job Listing tab: attractive upsell (free users) + JobFeed ----
function JobListingTab({
  userId,
  hasActivePlan,
}: {
  userId: string;
  hasActivePlan: boolean;
}) {
  const subQuery = useQuery({
    ...subscriptionQueryOptions(),
    enabled: !!userId,
  });
  const profileQuery = useQuery({
    ...profileQueryOptions(userId),
    enabled: !!userId,
  });

  const preferredCategories = profileQuery.data?.preferred_categories ?? [];
  const preferredLocations = profileQuery.data?.preferred_locations ?? [];

  const subscription = subQuery.data;
  // Targeted list is opt-in: only "dashboard" or "both" show it. Anything else
  // (including a missing/unknown preference) keeps the feed unprioritized.
  const alertDelivery = subscription?.alert_delivery ?? "whatsapp";

  // Show targeted jobs only when alert delivery is dashboard or both
  const showTargeted =
    !!hasActivePlan && (alertDelivery === "dashboard" || alertDelivery === "both");

  const targetedJobsQuery = useQuery({
    queryKey: ["targeted-jobs", userId],
    queryFn: () => fetchTargetedJobs(preferredCategories, preferredLocations),
    enabled:
      !!userId &&
      showTargeted &&
      (preferredCategories.length > 0 || preferredLocations.length > 0),
    staleTime: 30_000,
  });

  const targetedIds = showTargeted
    ? (targetedJobsQuery.data?.map((job) => job.id) ?? [])
    : [];


  return (
    <div>
      {!hasActivePlan && (
        <div className="border-brand/20 bg-brand/5 mb-6 rounded-2xl border p-5">
          <div className="flex items-start gap-3">
            <div className="bg-brand/10 rounded-xl p-2.5">
              <Sparkles className="text-brand size-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-sm font-bold">
                Get jobs matched for you
              </h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Tell us what you’re looking for and where. We’ll put the best
                matches at the top of this list, and can even send them to you
                on WhatsApp.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {[
              "Choose a plan",
              "Set your job preferences",
              "See matched jobs first — or get WhatsApp alerts",
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="bg-brand/10 text-brand flex size-4 items-center justify-center rounded-full">
                  <Check className="size-2.5" />
                </span>
                <span className="text-foreground/80">{step}</span>
              </div>
            ))}
          </div>

          <Link
            to="/plans"
            search={{ feature: "targeted-jobs" }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white"
          >
            Try it out
          </Link>
        </div>
      )}

      <Suspense fallback={<p className="text-muted-foreground text-sm">Loading jobs…</p>}>
        <JobFeed prioritizedJobIds={targetedIds} />
      </Suspense>
    </div>
  );
}

// ---- Targeted Jobs Panel (revised flow) ----
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
  const [pendingChange, setPendingChange] = useState<{
    from: "dashboard" | "whatsapp" | "both";
    to: "dashboard" | "whatsapp" | "both";
  } | null>(null);

  const [displayDelivery, setDisplayDelivery] = useState<"dashboard" | "whatsapp" | "both">(
    subscription?.alert_delivery ?? "whatsapp"
  );
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  useEffect(() => {
    setDisplayDelivery(subscription?.alert_delivery ?? "whatsapp");
  }, [subscription?.alert_delivery]);


  const phone = profile?.phone?.trim();
  const hasPreferences =
    (profile?.preferred_categories && profile.preferred_categories.length > 0) ||
    (profile?.preferred_locations && profile.preferred_locations.length > 0);
  const profileComplete = !!phone && hasPreferences;

  const handleRadioClick = (value: "dashboard" | "whatsapp" | "both") => {
    if (!profileComplete) {
      setShowProfilePrompt(true);
      return;
    }

    if (value === displayDelivery && !pendingChange) return;

    const from = displayDelivery;
    setPendingChange({ from, to: value });
    setDisplayDelivery(value);

    updateAlertDelivery(value)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: subscriptionQueryOptions().queryKey });
      })
      .catch((err) => {
        console.error(err);
        setDisplayDelivery(from);
        setPendingChange(null);
      });
  };

  const handleCancel = async () => {
    if (!pendingChange) return;
    const userFullName = profile?.full_name ?? "User";
    const { from, to } = pendingChange;

    // Cancelling must never leave the cancelled option in place. If the previous
    // value was the same one being cancelled (e.g. stored default "dashboard"),
    // fall back to WhatsApp reach-out so the targeted list stays hidden.
    const revertTo = from === to ? (to === "dashboard" ? "whatsapp" : "dashboard") : from;

    setDisplayDelivery(revertTo);
    setPendingChange(null);
    setShowProfilePrompt(true);

    if (to === "whatsapp" || to === "both") {
      const msg = encodeURIComponent(
        `${userFullName} attempted to change job alert delivery from ${from} to ${to}, but cancelled. Current preference remains ${revertTo}.`
      );
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`, "_blank");
    } else if (to === "dashboard") {
      await createDashboardCancelInquiry().catch(console.error);
    }

    try {
      await updateAlertDelivery(revertTo);
      // Await the refetch so the Job Listing tab never reads a stale preference.
      await queryClient.invalidateQueries({
        queryKey: subscriptionQueryOptions().queryKey,
      });
      queryClient.removeQueries({ queryKey: ["targeted-jobs", userId] });
    } catch (err) {
      console.error(err);
    }
  };


  const profilePrompt = (
    <div className="mt-4 rounded-xl border border-brand/20 bg-brand/[0.03] p-4">
      <p className="text-sm font-semibold">How job alerts work</p>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
        Tell us what kind of jobs you want and where. We’ll match you with the
        right opportunities and deliver them the way you choose.
      </p>
      <button
        onClick={onSwitchToProfile}
        className="mt-3 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white"
      >
        Try it out
      </button>
    </div>
  );

  return (
    <div className="border-border rounded-2xl border bg-white p-5">
      <h3 className="font-display text-sm font-bold">Job alert delivery</h3>
      <p className="text-muted-foreground mt-1 text-xs">
        Choose how you'd like to receive job matches.
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        {(["dashboard", "whatsapp", "both"] as const).map((option) => {
          const isCurrent = displayDelivery === option && !pendingChange && !showProfilePrompt;
          const isPending = pendingChange?.to === option;
          const selected = isCurrent || isPending;
          return (
            <label
              key={option}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${
                selected
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-muted-foreground hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="alert_delivery"
                value={option}
                checked={selected}
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

      {showProfilePrompt && profilePrompt}

      {pendingChange && !showProfilePrompt && (
        <div className="mt-4 rounded-xl border border-brand/20 bg-brand/[0.03] p-4">
          <p className="text-xs font-medium">
            You’ve selected: <strong className="capitalize">{pendingChange.to}</strong> (previously {pendingChange.from})
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
            If you cancel, your preference will return to {pendingChange.from}.
          </p>
        </div>
      )}
    </div>
  );
}
