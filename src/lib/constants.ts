/** Never render these numbers as visible text anywhere in the UI. */
export const LS_ADMIN_WHATSAPP = "256772702263";
const LS_WEBDEV_WHATSAPP = "256706631094";

const wa = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

export const WHATSAPP_HIRE_TALENT = wa(
  LS_ADMIN_WHATSAPP,
  "Hi, I'm interested in hiring for a job opening",
);

export const WHATSAPP_COMPLIANCE = wa(
  LS_ADMIN_WHATSAPP,
  "Hi, I'm interested in Bulk SMS or Compliance Services",
);

export const WHATSAPP_WEB_DEV = wa(
  LS_WEBDEV_WHATSAPP,
  "Hi, I'm interested in Web Development services",
);

export const WHATSAPP_CONTACT = (message: string) => wa(LS_ADMIN_WHATSAPP, message);

/** Nudges the LS Services admin that a new document request is waiting. */
export const WHATSAPP_DOCUMENT_REQUEST = (documentType: string) =>
  wa(
    LS_ADMIN_WHATSAPP,
    `Hi, I've just submitted a ${documentType} request — please check the admin dashboard`,
  );

/** Logo lives in public/ so it is served by any host (Vercel, Lovable, self-hosted). */
export const LOGO_SRC = "/ls-services-logo.png";
