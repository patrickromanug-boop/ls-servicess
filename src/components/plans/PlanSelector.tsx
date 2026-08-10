import { useState } from "react";
import { Check, Compass, Sparkles } from "lucide-react";
import { PLANS, cycleLabel, formatUgx, type BillingCycle, type Tier } from "@/lib/plans";

type Props = {
  /** Currently saved tier, so the matching card can read as selected. */
  currentTier?: Tier | null;
  currentCycle?: BillingCycle | null;
  busyTier?: Tier | "browse" | null;
  onChoosePlan: (tier: Tier, cycle: BillingCycle) => void;
  onJustBrowse: () => void;
  browseLabel?: string;
};

export function PlanSelector({
  currentTier,
  currentCycle,
  busyTier,
  onChoosePlan,
  onJustBrowse,
  browseLabel = "Continue to dashboard",
}: Props) {
  const [cycle, setCycle] = useState<BillingCycle>(currentCycle ?? "monthly");

  return (
    <div>
      <div className="flex justify-center">
        <div className="border-border bg-muted/60 inline-flex rounded-full border p-1">
          {(["weekly", "monthly"] as const).map((option) => (
            <button
              key={option}
              onClick={() => setCycle(option)}
              className={`rounded-full px-5 py-2 text-sm font-bold capitalize transition-colors ${
                cycle === option
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => {
          const selected = currentTier === plan.tier;
          return (
            <div
              key={plan.tier}
              className={`flex flex-col rounded-2xl border bg-card p-6 ${
                plan.highlight || selected ? "border-brand border-2" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                {plan.highlight && (
                  <span className="bg-accent-orange text-accent-orange-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold">
                    <Sparkles className="size-3" />
                    Popular
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{plan.tagline}</p>

              <p className="mt-5">
                <span className="font-display text-2xl font-bold">
                  {formatUgx(plan.price[cycle])}
                </span>
                <span className="text-muted-foreground text-sm"> /{cycleLabel(cycle)}</span>
              </p>

              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                <Feature>{plan.whatsappDelivery}</Feature>
                <Feature>{plan.documents}</Feature>
                <Feature>Full access to every job listing</Feature>
              </ul>

              <button
                onClick={() => onChoosePlan(plan.tier, cycle)}
                disabled={busyTier === plan.tier}
                className={`mt-6 rounded-lg py-3 text-sm font-bold disabled:opacity-60 ${
                  plan.highlight
                    ? "bg-brand text-brand-foreground"
                    : "border-brand text-brand border-2"
                }`}
              >
                {busyTier === plan.tier
                  ? "Saving…"
                  : selected
                    ? `Keep ${plan.name}`
                    : `Choose ${plan.name}`}
              </button>
            </div>
          );
        })}

        {/* Deliberately the same card size and weight as the paid tiers. */}
        <div className="border-border flex flex-col rounded-2xl border bg-card p-6 sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Just browse for now</h3>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            No plan, no payment. Search and apply on your own.
          </p>

          <p className="mt-5">
            <span className="font-display text-2xl font-bold">Free</span>
            <span className="text-muted-foreground text-sm"> /always</span>
          </p>

          <ul className="mt-5 flex-1 space-y-2.5 text-sm">
            <Feature>Browse and search every job</Feature>
            <Feature>Apply through official channels</Feature>
            <Feature>No WhatsApp job delivery</Feature>
          </ul>

          <button
            onClick={onJustBrowse}
            disabled={busyTier === "browse"}
            className="border-brand text-brand mt-6 inline-flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-bold disabled:opacity-60"
          >
            <Compass className="size-4" />
            {browseLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="text-brand mt-0.5 size-4 shrink-0" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}
