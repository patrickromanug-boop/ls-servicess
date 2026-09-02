import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  FilePlus2,
  Briefcase,
  Flag,
  CreditCard,
  FileText,
  Building2,
  Users,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { myRoleQueryOptions } from "@/lib/admin";
import { LOGO_SRC } from "@/lib/constants";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/post-job", label: "Post a Job", icon: FilePlus2 },
  { to: "/admin/jobs", label: "Manage Jobs", icon: Briefcase },
  { to: "/admin/reported-jobs", label: "Reported Jobs", icon: Flag },
  { to: "/admin/subscribers", label: "Subscribers", icon: CreditCard },
  { to: "/admin/job-alert-subscribers", label: "Job Alert Subscribers", icon: Users },
  { to: "/admin/job-alert-inquiries", label: "Job Alert Inquiries", icon: FileText },
  { to: "/admin/plan-requests", label: "Plan Requests", icon: FileText },
  { to: "/admin/document-requests", label: "Document Requests", icon: FileText },
  { to: "/admin/employer-inquiries", label: "Employer Inquiries", icon: Building2 },
  { to: "/admin/users", label: "Users", icon: Users },
] as const;

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[#14204F] px-4 py-6 text-white/80 lg:flex">
      <div className="flex flex-col gap-2 px-2">
        <span className="inline-flex w-fit rounded-lg bg-white px-2.5 py-2">
          <img src={LOGO_SRC} alt="LS Services" className="h-7 w-auto" />
        </span>
        <span className="text-accent-orange text-[11px] font-bold tracking-[0.18em] uppercase">
          Admin portal
        </span>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-accent-orange text-black"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </aside>
  );
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const roleQuery = useQuery({ ...myRoleQueryOptions(), enabled: !!user });

  if (loading || (user && roleQuery.isPending)) {
    return <Centered>Checking your access…</Centered>;
  }

  if (!user) {
    navigate({ to: "/admin/login", replace: true });
    return <Centered>Redirecting to the admin login…</Centered>;
  }

  if (roleQuery.data !== "admin") {
    return (
      <Centered>
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-bold text-white">You don't have access to this portal</h1>
          <p className="mt-2 text-sm text-white/60">
            This account isn't an LS Services administrator. You've been signed out of the admin
            portal.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/admin/login", replace: true });
            }}
            className="bg-accent-orange mt-5 rounded-lg px-4 py-2 text-sm font-bold text-black"
          >
            Back to admin login
          </button>
        </div>
      </Centered>
    );
  }

  return <>{children}</>;
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E1738] px-4 text-sm text-white/70">
      {children}
    </div>
  );
}

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#F4F6FB]">
        <AdminSidebar />
        <div className="lg:pl-60">
          <header className="border-border sticky top-0 z-20 border-b bg-white/90 px-6 py-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-xl font-bold">{title}</h1>
                {description && (
                  <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
                )}
              </div>
              {actions}
            </div>
            <MobileNav />
          </header>
          <main className="px-6 py-6">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}

function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="mt-3 flex gap-1 overflow-x-auto lg:hidden">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
            pathname === item.to
              ? "bg-[#14204F] text-white"
              : "text-muted-foreground bg-muted hover:text-foreground"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
