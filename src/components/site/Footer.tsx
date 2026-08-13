import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-border mt-12 border-t bg-muted/55 text-foreground sm:mt-14">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="text-muted-foreground mt-4 max-w-xs text-sm leading-relaxed">
            Helping Ugandans find work — job listings, guidance and document support.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold">Jobs</h4>
          <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
            <li>
              <Link to="/jobs" className="transition-colors hover:text-brand">
                Browse jobs
              </Link>
            </li>
            <li>
              <Link to="/hire-talent" className="transition-colors hover:text-brand">
                Hire talent
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold">Company</h4>
          <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
            <li>
              <Link to="/about" className="transition-colors hover:text-brand">
                About us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition-colors hover:text-brand">
                Contact us
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold">Legal</h4>
          <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
            <li>
              <Link to="/terms" className="transition-colors hover:text-brand">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="transition-colors hover:text-brand">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/refund-policy" className="transition-colors hover:text-brand">
                Cancellation &amp; Refund Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-border text-muted-foreground border-t px-4 py-5 text-center text-xs">
        © {new Date().getFullYear()} LS Services. Kampala, Uganda.
      </div>
    </footer>
  );
}
