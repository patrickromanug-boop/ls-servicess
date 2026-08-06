import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-border bg-muted/40 mt-20 border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="text-muted-foreground mt-3 max-w-xs text-sm">
            Helping Ugandans find work — job listings, guidance and document support.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Jobs</h4>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
            <li>
              <Link to="/jobs" className="hover:text-brand">
                Browse jobs
              </Link>
            </li>
            <li>
              <Link to="/hire-talent" className="hover:text-brand">
                Hire talent
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
            <li>
              <Link to="/about" className="hover:text-brand">
                About us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-brand">
                Contact us
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
            <li>
              <Link to="/terms" className="hover:text-brand">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-brand">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/refund-policy" className="hover:text-brand">
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
