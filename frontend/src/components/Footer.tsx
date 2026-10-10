import { Link } from 'react-router-dom';
import { Logo } from './Logo';

const PLATFORM_LINKS = [
  { label: 'Smart Inventory', href: '#features' },
  { label: 'Production Management', href: '#features' },
  { label: 'Quality Control', href: '#features' },
  { label: 'Order Tracking', href: '#features' },
  { label: 'Dispatch Management', href: '#features' },
  { label: 'Workforce and Accounts', href: '#features' },
];

const SOLUTION_LINKS = [
  { label: 'End-to-end workflow', href: '#solutions' },
  { label: 'Dashboard preview', href: '#dashboard' },
  { label: 'Tools for every team', href: '#roles' },
  { label: 'Operational benefits', href: '#benefits' },
];

const RESOURCE_ITEMS = [
  'User documentation — coming soon',
  'API reference — coming soon',
  'Training guides — coming soon',
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo variant="dark" showTagline={true} />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              A connected platform for textile manufacturing, inventory,
              production, quality, and dispatch management.
            </p>
          </div>

          <nav aria-labelledby="footer-platform">
            <h2 id="footer-platform" className="text-sm font-semibold text-ink">
              Platform
            </h2>
            <ul className="mt-4 space-y-2.5">
              {PLATFORM_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-muted transition-colors hover:text-primary"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-solutions">
            <h2 id="footer-solutions" className="text-sm font-semibold text-ink">
              Solutions
            </h2>
            <ul className="mt-4 space-y-2.5">
              {SOLUTION_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-muted transition-colors hover:text-primary"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-resources">
            <h2 id="footer-resources" className="text-sm font-semibold text-ink">
              Resources
            </h2>
            <ul className="mt-4 space-y-2.5">
              {RESOURCE_ITEMS.map((item) => (
                <li key={item} className="text-sm text-muted/80">
                  {item}
                </li>
              ))}
            </ul>
          </nav>

          <div id="contact-details" className="scroll-mt-28">
            <h2 className="text-sm font-semibold text-ink">Contact</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Sales, support and partnership contact details will be published
              here.
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  to="/login"
                  className="text-sm text-primary transition-colors hover:text-primary-hover"
                >
                  Sign in to the platform
                </Link>
              </li>
              <li>
                <a
                  href="#home"
                  className="text-sm text-primary transition-colors hover:text-primary-hover"
                >
                  Back to top
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Everest Textile Mills. All rights
            reserved.
          </p>
          <ul className="flex items-center gap-6">
            <li>
              <Link
                to="/privacy"
                className="text-xs text-muted transition-colors hover:text-primary"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="text-xs text-muted transition-colors hover:text-primary"
              >
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
