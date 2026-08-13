import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const NAV = [
  { to: "/jobs", label: "Find work" },
  { to: "/hire-talent", label: "Hire talent" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

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
        <button
          className="border-border bg-card grid size-10 place-items-center rounded-full border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
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
