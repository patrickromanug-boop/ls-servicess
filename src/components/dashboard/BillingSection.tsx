import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { Card } from "./ProfileSection";
import { paymentsQueryOptions } from "@/lib/account";
import { formatUgx, planByTier } from "@/lib/plans";

export function BillingSection() {
  const { data: payments = [], isLoading } = useQuery(paymentsQueryOptions());

  return (
    <Card title="Billing history">
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : payments.length === 0 ? (
        <div className="border-border rounded-xl border border-dashed p-10 text-center">
          <CreditCard className="text-muted-foreground mx-auto size-6" />
          <p className="mt-3 text-sm font-semibold">No payments yet</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Once you subscribe to a plan, every payment will show up here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground text-xs uppercase">
              <tr className="border-border border-b">
                <th className="py-2.5 pr-4 font-semibold">Date</th>
                <th className="py-2.5 pr-4 font-semibold">Plan</th>
                <th className="py-2.5 pr-4 font-semibold">Amount</th>
                <th className="py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-border/60 border-b last:border-0">
                  <td className="py-3 pr-4">
                    {new Date(payment.paid_at ?? payment.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 pr-4">
                    {payment.tier ? planByTier(payment.tier).name : "—"}
                    {payment.billing_cycle ? ` · ${payment.billing_cycle}` : ""}
                  </td>
                  <td className="py-3 pr-4 font-semibold">{formatUgx(Number(payment.amount))}</td>
                  <td className="py-3 capitalize">{payment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
