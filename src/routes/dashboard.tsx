import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import {
  Sparkles,
  Check,
  Briefcase,
  Bell,
  User,
  MoreHorizontal,
  Moon,
  Sun,
} from "lucide-react";

// Safe default when a subscription row doesn't exist yet or hasn't loaded.
// Must always be one of the three values the database actually accepts:
// 'dashboard' | 'whatsapp' | 'both' — never "none", the database rejects it.
const DEFAULT_DELIVERY = "dashboard" as const;

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

function MobileAppBar({ tab }: { tab: TabId }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("ls-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);

  const title =
    tab === "targeted"
      ? "Job alerts"
      : tab === "profile"
        ? "Profile"
        : tab === "services"
          ? "More"
          : tab === "bill-plans"
            ? "Plans & billing"
            : tab === "documents"
              ? "Documents"
              : "Jobs";

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("ls-theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <header className="bg-background/95 sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md md:hidden">
      <div>
        <p className="text-brand text-[10px] font-extrabold uppercase tracking-[0.18em]">LS Services</p>
        <h1 className="font-display text-base font-bold leading-tight">{title}</h1>
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        className="border-border bg-card text-foreground grid size-9 place-items-center rounded-full border"
        aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      >
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
    </header>
  );
}

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("job-listing");
  const [enableAlertsAfterProfileSave, setEnableAlertsAfterProfileSave] = useState(false);

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

  const handleProfileSaved = async () => {
    if (enableAlertsAfterProfileSave) {
      try {
        const updatedSubscription = await updateAlertDelivery("both");
        queryClient.setQueryData(subscriptionQueryOptions().queryKey, updatedSubscription);
        await queryClient.invalidateQueries({ queryKey: subscriptionQueryOptions().queryKey });
        queryClient.invalidateQueries({ queryKey: ["targeted-jobs", user.id] });
      } catch (error) {
        console.error(error);
        toast.error("Your profile was saved, but alerts could not be enabled. Please try again.");
      } finally {
        setEnableAlertsAfterProfileSave(false);
      }
    }

    setTab("job-listing");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="hidden md:block"><Header /></div>
      <MobileAppBar tab={tab} />
      <main className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-5xl flex-1 px-4 py-0 pb-[calc(6rem+env(safe-area-inset-bottom))] md:min-h-0 md:px-4 md:py-10 md:pb-10">
        <div className="hidden md:block">
          <h1 className="font-display text-2xl font-bold">
            {fullName ? `Welcome back, ${fullName.split(" ")[0]}` : "Your dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your plan, preferences and documents in one place.
          </p>
        </div>

        <div className="hidden border-border mt-6 flex-wrap gap-1 border-b pb-2 md:flex">
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

        <div className="mt-4 min-h-[calc(100vh-9rem)] md:mt-6 md:min-h-0">
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
              onCompleteProfile={() => {
                setEnableAlertsAfterProfileSave(true);
                setTab("profile");
              }}
              onEditProfile={() => setTab("profile")}
              onViewJobs={() => setTab("job-listing")}
            />
          )}
          {tab === "documents" && (
            <DocumentsSection user={user} sub={sub} fullName={fullName} />
          )}
          {tab === "profile" && <ProfileSection user={user} onSaved={handleProfileSaved} />}
          {tab === "services" && (
            <Card title="Other services from LS Services">
              <OtherServicesCards />
            </Card>
          )}
        </div>
      </main>

      <div className="hidden md:block"><Footer /></div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          <BottomNavButton
            icon={Briefcase}
            label="Jobs"
            active={tab === "job-listing"}
            onClick={() => setTab("job-listing")}
          />
          <BottomNavButton
            icon={Bell}
            label="Alerts"
            active={tab === "targeted"}
            onClick={() => {
              if (hasActivePlan) {
                setTab("targeted");
              } else {
                navigate({ to: "/plans", search: { feature: "targeted-jobs" } });
              }
            }}
          />
          <BottomNavButton
            icon={User}
            label="Profile"
            active={tab === "profile"}
            onClick={() => setTab("profile")}
          />
          <BottomNavButton
            icon={MoreHorizontal}
            label="More"
            active={tab === "services" || tab === "bill-plans" || tab === "documents"}
            onClick={() => setTab("services")}
          />
        </div>
      </nav>
    </div>
  );
}

// ---- Bottom navigation button ----
function BottomNavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors ${
        active ? "text-brand" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-5" />
      {label}
    </button>
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
  const alertDelivery = subscription?.alert_delivery ?? DEFAULT_DELIVERY;

  const showTargeted = !!hasActivePlan && alertDelivery === "both";

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
                Tell us what you're looking for and where. We'll put the best
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

// ---- Targeted Jobs Panel (single button for both alerts) ----
function TargetedJobsPanel({
  userId,
  subscription,
  profile,
  onCompleteProfile,
  onEditProfile,
  onViewJobs,
}: {
  userId: string;
  subscription: WebSubscription | null;
  profile: any;
  onCompleteProfile: () => void;
  onEditProfile: () => void;
  onViewJobs: () => void;
}) {
  const queryClient = useQueryClient();
  const [isEnabling, setIsEnabling] = useState(false);
  const [isTurningOff, setIsTurningOff] = useState(false);

  const currentDelivery = subscription?.alert_delivery ?? DEFAULT_DELIVERY;

  const phone = profile?.phone?.trim();
  const hasPreferences =
    (profile?.preferred_categories && profile.preferred_categories.length > 0) ||
    (profile?.preferred_locations && profile.preferred_locations.length > 0);
  const profileComplete = !!phone && hasPreferences;
  const alertsActive = currentDelivery === "both";

  const handleEnableAlerts = async () => {
    if (!profileComplete) {
      onCompleteProfile();
      return;
    }

    if (alertsActive) {
      onViewJobs();
      return;
    }

    setIsEnabling(true);
    try {
      const updatedSubscription = await updateAlertDelivery("both");
      queryClient.setQueryData(subscriptionQueryOptions().queryKey, updatedSubscription);
      await queryClient.invalidateQueries({ queryKey: subscriptionQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: ["targeted-jobs", userId] });
      onViewJobs();
    } catch (err) {
      console.error(err);
      toast.error("Alerts could not be enabled. Please try again.");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleTurnOff = async () => {
    setIsTurningOff(true);
    try {
      const updatedSubscription = await updateAlertDelivery(DEFAULT_DELIVERY);
      queryClient.setQueryData(subscriptionQueryOptions().queryKey, updatedSubscription);
      await queryClient.invalidateQueries({ queryKey: subscriptionQueryOptions().queryKey });
      queryClient.removeQueries({ queryKey: ["targeted-jobs", userId] });
      toast.success("Alerts turned off");
    } catch (err) {
      console.error(err);
      toast.error("Could not turn off alerts. Please try again.");
    } finally {
      setIsTurningOff(false);
    }
  };

  return (
    <div className="border-border rounded-2xl border bg-white p-5">
      <h3 className="font-display text-sm font-bold">Job alert delivery</h3>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
        See matched roles on your dashboard and get them through{" "}
        <strong className="font-bold text-foreground">WhatsApp</strong> as well.
      </p>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleEnableAlerts}
          disabled={isEnabling}
          className="border-brand bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-default disabled:opacity-80"
        >
          <Check className="size-4" />
          {isEnabling
            ? "Enabling…"
            : !profileComplete
              ? "Set up job alerts"
              : alertsActive
                ? "View your matched jobs"
                : "Enable Dashboard + WhatsApp alerts"}
        </button>
      </div>

      {alertsActive && (
        <div className="mt-4 rounded-xl border border-brand/20 bg-brand/[0.03] p-4">
          <p className="text-xs font-medium">Dashboard + WhatsApp alerts are active.</p>
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
            {profileComplete && (
              <button
                onClick={handleTurnOff}
                disabled={isTurningOff}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-bold text-gray-600 disabled:opacity-60"
              >
                {isTurningOff ? "Turning off…" : "Cancel"}
              </button>
            )}
            <button
              onClick={onEditProfile}
              className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-500"
            >
              Edit Info
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
