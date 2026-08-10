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
    <header className="border-border bg-background sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-foreground/70 hover:text-brand hover:bg-brand-soft rounded-md px-3 py-2 text-sm font-medium transition-colors"
              activeProps={{ className: "text-brand bg-brand-soft" }}
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/dashboard"
              className="text-foreground/70 hover:text-brand hover:bg-brand-soft rounded-md px-3 py-2 text-sm font-medium transition-colors"
              activeProps={{ className: "text-brand bg-brand-soft" }}
            >
              Dashboard
            </Link>
          )}
          {user ? (
            <button
              onClick={signOut}
              className="border-border ml-2 rounded-md border px-3 py-2 text-sm font-semibold"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/auth/login" search={{ redirect: undefined }}
              className="bg-brand text-brand-foreground ml-2 rounded-md px-4 py-2 text-sm font-semibold"
            >
              Sign in
            </Link>
          )}
        </nav>
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <div className="border-border border-t px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-2.5 text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-2.5 text-sm font-medium"
            >
              Dashboard
            </Link>
          )}
          {user ? (
            <button onClick={signOut} className="block px-2 py-2.5 text-sm font-semibold">
              Sign out
            </button>
          ) : (
            <Link
              to="/auth/login" search={{ redirect: undefined }}
              onClick={() => setOpen(false)}
              className="text-brand block px-2 py-2.5 text-sm font-semibold"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
