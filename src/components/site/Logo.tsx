import { Link } from "@tanstack/react-router";
import { LOGO_SRC } from "@/lib/constants";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center ${className}`} aria-label="LS Services home">
      <img
        src={LOGO_SRC}
        alt="LS Services"
        width={600}
        height={153}
        className="h-8 w-auto sm:h-9"
      />
    </Link>
  );
}
