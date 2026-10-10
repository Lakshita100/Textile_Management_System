import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';

interface LegalPageProps {
  kind: 'privacy' | 'terms';
}

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    description:
      'This placeholder page will contain the full privacy policy for the Everest Textile Mills Textile Manufacturing System, covering what data is collected, how it is used, and the rights of factory staff and buyers.',
  },
  terms: {
    title: 'Terms of Service',
    description:
      'This placeholder page will contain the full terms of service for the Everest Textile Mills Textile Manufacturing System, covering acceptable use, data responsibilities, and service conditions.',
  },
} as const;

export default function LegalPage({ kind }: LegalPageProps) {
  const content = CONTENT[kind];

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Everest Textile Mills — home">
            <Logo />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <article className="rounded-2xl border border-line bg-surface p-8 shadow-card">
          <h1 className="font-display text-3xl font-extrabold text-ink">
            {content.title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {content.description}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            The final text has not been published yet. Until it is available,
            no legally binding {kind === 'privacy' ? 'privacy policy' : 'terms of service'}{' '}
            is in effect for this preview build.
          </p>
        </article>
      </main>

      <footer className="border-t border-line bg-surface">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Everest Textile Mills. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
