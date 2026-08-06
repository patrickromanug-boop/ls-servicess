import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/site/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — LS Services" },
      {
        name: "description",
        content:
          "The terms that govern your use of the LS Services job portal, including account rules, job listing accuracy and acceptable use.",
      },
      { property: "og:title", content: "Terms & Conditions — LS Services" },
      { property: "og:description", content: "The terms governing use of the LS Services job portal." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: () => (
    <LegalPage title="Terms & Conditions" updated="February 2026">
      <LegalSection heading="1. Acceptance of these terms">
        <p>
          By browsing job listings, creating an account or otherwise using the LS Services website,
          you agree to these Terms &amp; Conditions. If you do not agree, please do not use the
          service.
        </p>
      </LegalSection>
      <LegalSection heading="2. What LS Services does">
        <p>
          LS Services publishes job openings gathered from employers, organisations and public
          notices, and provides related document and business support services. We are not the
          employer for listed roles and we do not take part in hiring decisions.
        </p>
      </LegalSection>
      <LegalSection heading="3. Accounts">
        <p>
          You are responsible for the accuracy of the information you provide and for keeping your
          login credentials secure. You must be at least 18 years old, or have the consent of a
          parent or guardian, to hold an account.
        </p>
      </LegalSection>
      <LegalSection heading="4. Job listings and applications">
        <p>
          We take reasonable care to publish accurate listings, but we cannot guarantee that every
          listing is current, complete or genuine. Applications are made through the employer&apos;s
          own official channel. Never pay money to secure a job — report any listing that requests
          payment using the report option on the listing.
        </p>
      </LegalSection>
      <LegalSection heading="5. Acceptable use">
        <p>
          You agree not to scrape, resell or republish listings, attempt to disrupt the service, upload
          unlawful content, or misrepresent your identity.
        </p>
      </LegalSection>
      <LegalSection heading="6. Limitation of liability">
        <p>
          To the extent permitted by Ugandan law, LS Services is not liable for losses arising from
          reliance on a listing, from any recruitment process, or from any interaction with a third
          party discovered through the service.
        </p>
      </LegalSection>
      <LegalSection heading="7. Changes and contact">
        <p>
          We may update these terms from time to time and will update the date above when we do. For
          questions, use the contact page.
        </p>
      </LegalSection>
    </LegalPage>
  ),
});
