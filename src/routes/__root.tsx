import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "../lib/auth";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LS Services — Find Jobs in Uganda" },
      {
        name: "description",
        content:
          "LS Services helps Ugandans find work. Browse verified job openings, filter by category and location, and apply through official links.",
      },
      { name: "author", content: "LS Services" },
      { name: "theme-color", content: "#14204F" },
      { property: "og:title", content: "LS Services — Find Jobs in Uganda" },
      {
        property: "og:description",
        content: "Browse job openings across Uganda and apply through official links.",
      },
      { property: "og:site_name", content: "LS Services" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
    scripts: [
      {
        children: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('Service worker registered'))
                .catch((err) => console.error('Service worker registration failed:', err));
            });
          }
        `,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SitePromoPopup() {
  const { user, loading } = useAuth();
  const navigate = useRouter();
  const [visible, setVisible] = useState(false);
  const [promo, setPromo] = useState<"targeted-jobs" | "other-services">("targeted-jobs");

  useEffect(() => {
    if (loading || typeof window === "undefined" || window.location.pathname.startsWith("/admin")) return;

    const seenKey = user ? `ls-promo-other-services-seen:${user.id}` : "ls-promo-targeted-jobs-seen";
    if (window.localStorage.getItem(seenKey) === "1") return;

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(seenKey, "1");
      setPromo(user ? "other-services" : "targeted-jobs");
      setVisible(true);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [loading, user]);

  if (!visible) return null;

  const isVisitor = promo === "targeted-jobs";
  const close = () => setVisible(false);
  const tryItNow = () => {
    close();
    if (isVisitor) {
      navigate.navigate({ to: "/auth/signup", search: { redirect: "/plans?feature=targeted-jobs" } });
    } else {
      window.location.assign("/dashboard?tab=services");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/45 px-4 py-6" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-promo-title"
        className="bg-background w-full max-w-md rounded-3xl border p-6 shadow-2xl sm:p-7"
      >
        <p className="text-brand text-[10px] font-extrabold uppercase tracking-[0.18em]">LS Services</p>
        <h2 id="site-promo-title" className="font-display mt-2 text-2xl font-bold">
          {isVisitor ? "Find jobs matched to you" : "More ways LS Services can help"}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {isVisitor
            ? "Set your preferred job categories and locations, then get relevant openings brought to the top of your dashboard. With an eligible plan or trial, you can also receive matching job links through WhatsApp."
            : "Explore our other services for business and career support: reliable bulk SMS, business registration and compliance help, websites, mobile apps and custom systems for Ugandan businesses."}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={close} className="border-border text-foreground rounded-xl border px-4 py-3 text-sm font-bold">
            Cancel
          </button>
          <button type="button" onClick={tryItNow} className="bg-brand text-brand-foreground rounded-xl px-4 py-3 text-sm font-bold">
            Try it now
          </button>
        </div>
      </section>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SitePromoPopup />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
