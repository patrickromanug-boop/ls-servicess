import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/ls-services-logo.png.asset.json";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center ${className}`} aria-label="LS Services home">
      <img
        src={logoAsset.url}
        alt="LS Services"
        width={600}
        height={153}
        className="h-8 w-auto sm:h-9"
      />
    </Link>
  );
}
