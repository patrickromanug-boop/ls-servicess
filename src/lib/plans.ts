export type Tier = "basic" | "pro" | "premium";
export type BillingCycle = "weekly" | "monthly";

export type PlanDefinition = {
  tier: Tier;
  name: string;
  tagline: string;
  price: Record<BillingCycle, number>;
  whatsappDelivery: string;
  documents: string;
  /** null = unlimited */
  documentsPerMonth: number | null;
  highlight?: boolean;
};

export const PLANS: PlanDefinition[] = [
  {
    tier: "basic",
    name: "Basic",
    tagline: "A steady daily stream of openings.",
    price: { weekly: 500, monthly: 1800 },
    whatsappDelivery: "Once daily WhatsApp job digest",
    documents: "1 document generation per month",
    documentsPerMonth: 1,
  },
  {
    tier: "pro",
    name: "Pro",
    tagline: "Stay ahead of other applicants.",
    price: { weekly: 1000, monthly: 3600 },
    whatsappDelivery: "WhatsApp job links every few hours",
    documents: "3 document generations per month",
    documentsPerMonth: 3,
    highlight: true,
  },
  {
    tier: "premium",
    name: "Premium",
    tagline: "Be first, every single time.",
    price: { weekly: 1500, monthly: 5400 },
    whatsappDelivery: "Instant WhatsApp job links",
    documents: "Unlimited document generations",
    documentsPerMonth: null,
  },
];

export const planByTier = (tier: Tier) => PLANS.find((p) => p.tier === tier)!;

export const formatUgx = (amount: number) => `${amount.toLocaleString("en-UG")} UGX`;

export const cycleLabel = (cycle: BillingCycle) => (cycle === "weekly" ? "week" : "month");

export const DOCUMENT_TYPES = [
  { value: "cv", label: "CV" },
  { value: "cover_letter", label: "Cover Letter" },
  { value: "application_letter", label: "Application Letter" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

export const documentTypeLabel = (value: string) =>
  DOCUMENT_TYPES.find((d) => d.value === value)?.label ?? value;

export const requestStatusLabel = (status: string) =>
  status === "sent_to_admin" ? "Sent to Admin" : status === "completed" ? "Completed" : "Pending";
