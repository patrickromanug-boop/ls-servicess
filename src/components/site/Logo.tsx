import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="LS Services home">
      <span className="font-display text-2xl font-bold tracking-tight">
        <span className="text-brand">L</span>
        <span className="text-accent-orange">S</span>
      </span>
      <span className="bg-brand text-brand-foreground rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide">
        Services
      </span>
    </Link>
  );
}
