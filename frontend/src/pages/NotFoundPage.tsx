import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="card p-6 sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">404</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Page not found</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
        The page you are looking for does not exist in this module.
      </p>
      <div className="mt-6">
        <Link to="/" className="btn-secondary">
          <ArrowLeft size={16} aria-hidden />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
