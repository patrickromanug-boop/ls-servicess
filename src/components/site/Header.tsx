import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const NAV = [
  { to: "/jobs", label: "Find work" },
  { to: "/hire-talent", label: "Hire talent" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Module-level variable: survives Header remounts
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isAppInstalled = false;

// Capture the browser install event as early as possible. Some browsers emit it
// before the header component has mounted.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
  });
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use state only to trigger re-render after install or prompt changes
  const [installPromptAvailable, setInstallPromptAvailable] = useState(!!deferredPrompt);
  const [installed, setInstalled] = useState(isAppInstalled);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setInstallPromptAvailable(true);
    };

    const installedHandler = () => {
      isAppInstalled = true;
      deferredPrompt = null;
      setInstalling(false);
      setInstalled(true);
      setInstallPromptAvailable(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    setInstallPromptAvailable(!!deferredPrompt);

    // Check if already installed (standalone display)
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      isAppInstalled = true;
      deferredPrompt = null;
      setInstalled(true);
      setInstallPromptAvailable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      toast.error("The browser has not made the native installation prompt available.");
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalling(true);
      window.setTimeout(() => {
        if (!isAppInstalled) {
          setInstalling(false);
          toast.error("The browser could not complete the app installation. Please try again.");
        }
      }, 15000);
      deferredPrompt = null;
    } else {
      deferredPrompt = null;
      setInstallPromptAvailable(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  // Installation remains available in the codebase, but the public button is
  // intentionally disabled until the site launch is ready for the PWA.
  const SHOW_INSTALL_BUTTON = false;
  const showInstallButton = SHOW_INSTALL_BUTTON && !installed;

  return (
    <header className="border-border/80 bg-background/90 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 rounded-full border border-border/80 bg-muted/45 p-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-foreground/70 hover:text-brand hover:bg-background rounded-full px-3.5 py-2 text-sm font-semibold transition-colors"
              activeProps={{ className: "text-brand bg-background shadow-sm" }}
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/dashboard"
              className="text-foreground/70 hover:text-brand hover:bg-background rounded-full px-3.5 py-2 text-sm font-semibold transition-colors"
              activeProps={{ className: "text-brand bg-background shadow-sm" }}
            >
              Dashboard
            </Link>
          )}
          {user ? (
            <button
              onClick={signOut}
              className="border-border hover:bg-muted ml-3 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/auth/login" search={{ redirect: undefined }}
              className="bg-brand text-brand-foreground hover:bg-brand/90 ml-3 rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {showInstallButton && (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="border-border bg-card text-foreground hover:border-brand hover:text-brand inline-flex h-10 items-center gap-2 rounded-full border px-3 transition-colors"
              aria-label="Install app"
              title="Install app"
            >
              <Download className="size-4" />
              <span className="hidden text-xs font-semibold sm:inline">{installing ? "Installing…" : "Install app"}</span>
            </button>
          )}
          <button
            className="border-border bg-card grid size-10 place-items-center rounded-full border md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-border bg-background border-t px-4 py-4 shadow-lg md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="hover:bg-brand-soft block rounded-xl px-3 py-3 text-sm font-semibold"
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="hover:bg-brand-soft block rounded-xl px-3 py-3 text-sm font-semibold"
            >
              Dashboard
            </Link>
          )}
          {user ? (
            <button onClick={signOut} className="block px-3 py-3 text-sm font-semibold">
              Sign out
            </button>
          ) : (
            <Link
              to="/auth/login" search={{ redirect: undefined }}
              onClick={() => setOpen(false)}
              className="bg-brand text-brand-foreground mt-2 block rounded-xl px-3 py-3 text-sm font-bold"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
