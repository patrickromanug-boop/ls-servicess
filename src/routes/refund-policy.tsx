import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/site/LegalPage";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Cancellation & Refund Policy — LS Services" },
      {
        name: "description",
        content:
          "How cancellations and refunds work for paid LS Services offerings, including timelines and how to request a refund.",
      },
      { property: "og:title", content: "Cancellation & Refund Policy — LS Services" },
      { property: "og:description", content: "How cancellations and refunds work at LS Services." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/refund-policy" }],
  }),
  component: () => (
    <LegalPage title="Cancellation & Refund Policy" updated="February 2026">
      <LegalSection heading="1. Scope">
        <p>
          This policy applies only to paid LS Services offerings. Browsing job listings and viewing job
          details are free and require no payment.
        </p>
      </LegalSection>
      <LegalSection heading="2. Cancelling a paid service">
        <p>
          You may cancel a paid service at any time. Cancellation stops future charges; it does not
          automatically refund a period already paid for.
        </p>
      </LegalSection>
      <LegalSection heading="3. Refund eligibility">
        <p>
          Where a paid service has not yet been delivered, or was delivered incorrectly through our
          error, you may request a refund. Work already completed to your instructions — for example a
          document prepared and delivered — is generally non-refundable.
        </p>
      </LegalSection>
      <LegalSection heading="4. How to request a refund">
        <p>
          Contact us through the contact page with your payment reference and a short description of
          the issue. We aim to review requests within five (5) working days.
        </p>
      </LegalSection>
      <LegalSection heading="5. How refunds are paid">
        <p>
          Approved refunds are returned through the same payment method used for the original
          transaction wherever possible. Mobile money and bank processing times are outside our
          control.
        </p>
      </LegalSection>
      <LegalSection heading="6. Relationship to our Terms">
        <p>
          This policy is separate from, and read alongside, our Terms &amp; Conditions. Where the two
          differ on cancellations or refunds, this policy applies.
        </p>
      </LegalSection>
    </LegalPage>
  ),
});
