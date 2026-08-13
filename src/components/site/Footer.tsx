import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
            Helping Ugandans find work — job listings, guidance and document support.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Jobs</h4>
          <ul className="mt-4 space-y-3 text-sm text-white/65">
            <li>
              <Link to="/jobs" className="transition-colors hover:text-accent-orange">
                Browse jobs
              </Link>
            </li>
            <li>
              <Link to="/hire-talent" className="transition-colors hover:text-accent-orange">
                Hire talent
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Company</h4>
          <ul className="mt-4 space-y-3 text-sm text-white/65">
            <li>
              <Link to="/about" className="transition-colors hover:text-accent-orange">
                About us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition-colors hover:text-accent-orange">
                Contact us
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Legal</h4>
          <ul className="mt-4 space-y-3 text-sm text-white/65">
            <li>
              <Link to="/terms" className="transition-colors hover:text-accent-orange">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="transition-colors hover:text-accent-orange">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/refund-policy" className="transition-colors hover:text-accent-orange">
                Cancellation &amp; Refund Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/45">
        © {new Date().getFullYear()} LS Services. Kampala, Uganda.
      </div>
    </footer>
  );
}
