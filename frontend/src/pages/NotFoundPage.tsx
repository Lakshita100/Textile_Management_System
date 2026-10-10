import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';
import { buttonClass } from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Everest Textile Mills — home">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="font-display text-6xl font-extrabold text-primary">404</p>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link to="/" className={buttonClass('primary', 'md', 'mt-8')}>
          <ArrowLeft aria-hidden className="size-4" />
          Back to home
        </Link>
      </main>
    </div>
  );
}
