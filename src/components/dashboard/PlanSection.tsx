import { Link } from "@tanstack/react-router";
import { CalendarClock, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "./ProfileSection";
import {
  trialDaysLeft,
  isTrialActive,
  documentsRemaining,
  fetchPendingPlanRequest,
  type WebSubscription,
} from "@/lib/account";
import { planByTier } from "@/lib/plans";

export function PlanSection({ sub }: { sub: WebSubscription | null }) {
  const trialing = isTrialActive(sub);
  const plan = sub?.tier ? planByTier(sub.tier) : null;
  const remaining = documentsRemaining(sub);

  // Check for a pending plan request
  const { data: pendingRequest } = useQuery({
    queryKey: ["plan_requests", "pending"],
    queryFn: fetchPendingPlanRequest,
    staleTime: 30_000,
  });

  if (pendingRequest) {
    const requestedPlan = planByTier(pendingRequest.requested_tier);
    return (
      <Card title="Your plan">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">Pending approval</p>
          <p className="mt-1 text-sm text-amber-700">
            Your request for <strong>{requestedPlan.name}</strong> is awaiting confirmation.
            We’ll activate your plan as soon as payment is verified.
          </p>
          <Link
            to="/plans"
            className="text-brand mt-3 inline-block text-sm font-semibold"
          >
            View plans
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Your plan">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {trialing ? (
            <>
              <p className="bg-accent-orange/15 text-accent-orange inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold">
                <Sparkles className="size-3.5" />
                Free trial
              </p>
              <p className="font-display mt-2 text-xl font-bold">
                {trialDaysLeft(sub)} {trialDaysLeft(sub) === 1 ? "day" : "days"} left in your free
                trial
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {plan
                  ? `${plan.name} selected — ${sub?.billing_cycle ?? "monthly"} billing starts after the trial.`
                  : "Unlimited document generations while your trial runs."}
              </p>
            </>
          ) : sub?.status === "active" && plan ? (
            <>
              <p className="bg-brand-soft text-brand inline-flex rounded-full px-3 py-1 text-xs font-bold">
                Active plan
              </p>
              <p className="font-display mt-2 text-xl font-bold">
                {plan.name} · {sub.billing_cycle}
              </p>
              {sub.renewal_date && (
                <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                  <CalendarClock className="size-4" />
                  Renews {new Date(sub.renewal_date).toLocaleDateString("en-GB")}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="bg-muted text-muted-foreground inline-flex rounded-full px-3 py-1 text-xs font-bold">
                No active plan
              </p>
              <p className="font-display mt-2 text-xl font-bold">
                {plan ? `${plan.name} selected — payment pending` : "No active plan"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Choose a plan to get job links on WhatsApp and generate documents.
              </p>
            </>
          )}

          <p className="text-muted-foreground mt-3 text-xs">
            Document generations this period:{" "}
            <strong className="text-foreground">
              {remaining === null ? "Unlimited" : `${remaining} remaining`}
            </strong>
          </p>
        </div>

        <Link
          to="/plans"
          className="bg-brand text-brand-foreground shrink-0 rounded-lg px-6 py-3 text-center text-sm font-bold"
        >
          {sub?.tier ? "Change plan" : "Choose a plan"}
        </Link>
      </div>
    </Card>
  );
}            to="/plans"
            className="text-brand mt-3 inline-block text-sm font-semibold"
          >
            View plans
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Your plan">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {trialing ? (
            <>
              <p className="bg-accent-orange/15 text-accent-orange inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold">
                <Sparkles className="size-3.5" />
                Free trial
              </p>
              <p className="font-display mt-2 text-xl font-bold">
                {trialDaysLeft(sub)} {trialDaysLeft(sub) === 1 ? "day" : "days"} left in your free
                trial
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {plan
                  ? `${plan.name} selected — ${sub?.billing_cycle ?? "monthly"} billing starts after the trial.`
                  : "Unlimited document generations while your trial runs."}
              </p>
            </>
          ) : sub?.status === "active" && plan ? (
            <>
              <p className="bg-brand-soft text-brand inline-flex rounded-full px-3 py-1 text-xs font-bold">
                Active plan
              </p>
              <p className="font-display mt-2 text-xl font-bold">
                {plan.name} · {sub.billing_cycle}
              </p>
              {sub.renewal_date && (
                <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                  <CalendarClock className="size-4" />
                  Renews {new Date(sub.renewal_date).toLocaleDateString("en-GB")}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="bg-muted text-muted-foreground inline-flex rounded-full px-3 py-1 text-xs font-bold">
                No active plan
              </p>
              <p className="font-display mt-2 text-xl font-bold">
                {plan ? `${plan.name} selected — payment pending` : "No active plan"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Choose a plan to get job links on WhatsApp and generate documents.
              </p>
            </>
          )}

          <p className="text-muted-foreground mt-3 text-xs">
            Document generations this period:{" "}
            <strong className="text-foreground">
              {remaining === null ? "Unlimited" : `${remaining} remaining`}
            </strong>
          </p>
        </div>

        <Link
          to="/plans"
          className="bg-brand text-brand-foreground shrink-0 rounded-lg px-6 py-3 text-center text-sm font-bold"
        >
          {sub?.tier ? "Change plan" : "Choose a plan"}
        </Link>
      </div>
    </Card>
  );
}
