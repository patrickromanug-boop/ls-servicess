import { Link } from "@tanstack/react-router";
import { CalendarClock, Sparkles } from "lucide-react";
import { Card } from "./ProfileSection";
import {
  trialDaysLeft,
  isTrialActive,
  documentsRemaining,
  type WebSubscription,
} from "@/lib/account";
import { planByTier } from "@/lib/plans";

export function PlanSection({ sub }: { sub: WebSubscription | null }) {
  const trialing = isTrialActive(sub);
  const plan = sub?.tier ? planByTier(sub.tier) : null;
  const remaining = documentsRemaining(sub);

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
