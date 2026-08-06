import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/site/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — LS Services" },
      {
        name: "description",
        content:
          "How LS Services collects, uses and protects your personal information. We never sell or share your data.",
      },
      { property: "og:title", content: "Privacy Policy — LS Services" },
      { property: "og:description", content: "How we collect, use and protect your information." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: () => (
    <LegalPage title="Privacy Policy" updated="February 2026">
      <LegalSection heading="1. Our commitment">
        <p>
          Your information is safe with us. We never sell or share your data — it is only used to help
          you find work or prepare your documents.
        </p>
      </LegalSection>
      <LegalSection heading="2. Information we collect">
        <p>
          Account details you give us (name, email address, and where you choose to provide them,
          profile and document details), plus basic technical information such as device type and
          pages viewed, which helps us keep the site fast and reliable.
        </p>
      </LegalSection>
      <LegalSection heading="3. How we use it">
        <p>
          To create and secure your account, show you relevant job openings, let you apply, prepare
          documents you request, and respond to your enquiries.
        </p>
      </LegalSection>
      <LegalSection heading="4. Sign-in providers">
        <p>
          If you sign in with Google, we receive your name and email address from Google to identify
          your account. We never receive your Google password.
        </p>
      </LegalSection>
      <LegalSection heading="5. Storage and security">
        <p>
          Your data is stored with our managed database and authentication provider using encrypted
          connections and access controls. No system is perfectly secure, but we take reasonable
          technical and organisational measures to protect your information.
        </p>
      </LegalSection>
      <LegalSection heading="6. Your rights">
        <p>
          You may request access to, correction of, or deletion of your personal information at any
          time by contacting us. Deleting your account removes your profile data from active use.
        </p>
      </LegalSection>
      <LegalSection heading="7. Contact">
        <p>Questions about this policy can be sent to us through the contact page.</p>
      </LegalSection>
    </LegalPage>
  ),
});
