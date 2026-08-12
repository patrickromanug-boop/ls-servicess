import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth";
import { PlanSelector } from "@/components/plans/PlanSelector";
import {
  ensureWebSubscription,
  initiateWebPayment,
  isTrialActive,
  selectPlan,
  subscriptionQueryOptions,
  trialDaysLeft,
} from "@/lib/account";
import type { BillingCycle, Tier } from "@/lib/plans";

export const Route = createFileRoute("/plans")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose your plan — LS Services" },
      {
        name: "description",
        content:
          "Pick a weekly or monthly LS Services plan for WhatsApp job alerts and CV, cover letter and application letter generation — or just browse jobs for free.",
      },
      { property: "og:title", content: "Choose your plan — LS Services" },
      {
        property: "og:description",
        content: "WhatsApp job alerts and document generation plans for Ugandan job seekers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<Tier | "browse" | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login", search: { redirect: "/plans" }, replace: true });
  }, [loading, user, navigate]);

  const subQuery = useQuery({ ...subscriptionQueryOptions(), enabled: !!user });

  // Creates the trial row (or an already-expired one for a reused phone number).
  useEffect(() => {
    if (!user || subQuery.isLoading || subQuery.data) return;
    ensureWebSubscription()
      .then(() => qc.invalidateQueries({ queryKey: ["web_subscription"] }))
      .catch((error: Error) => toast.error(error.message));
  }, [user, subQuery.isLoading, subQuery.data, qc]);

  const sub = subQuery.data ?? null;
  const trialing = isTrialActive(sub);
  const usedTrialBefore = !!sub && sub.status === "expired" && !sub.tier;

  async function choose(tier: Tier, cycle: BillingCycle) {
    setBusy(tier);
    try {
      await selectPlan(tier, cycle);
      await qc.invalidateQueries({ queryKey: ["web_subscription"] });
      if (trialing) {
        toast.success("Plan saved — it starts when your trial ends");
        navigate({ to: "/dashboard" });
      } else {
        const result = await initiateWebPayment(tier, cycle);
        toast.info(result.message);
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold">Choose how you want to job hunt</h1>
          {usedTrialBefore ? (
            <p className="bg-accent-orange/10 text-accent-orange mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
              <Info className="size-4" />
              It looks like you&apos;ve used a free trial before — choose a plan to continue
            </p>
          ) : trialing ? (
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm">
              You have {trialDaysLeft(sub)} days of free trial. Pick the plan you&apos;d like to
              continue on afterwards — nothing is charged today.
            </p>
          ) : (
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm">
              Get jobs pushed to your WhatsApp and generate professional documents, or keep browsing
              for free.
            </p>
          )}
        </div>

        <div className="mt-10">
          <PlanSelector
            currentTier={sub?.tier ?? null}
            currentCycle={sub?.billing_cycle ?? null}
            busyTier={busy}
            onChoosePlan={choose}
            onJustBrowse={() => {
              setBusy("browse");
              navigate({ to: "/dashboard" });
            }}
          />
        </div>

        <p className="text-muted-foreground mt-8 text-center text-xs">
          Payments are handled securely. See our{" "}
          <Link to="/refund-policy" className="text-brand font-semibold">
            Cancellation &amp; Refund Policy
          </Link>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
}
