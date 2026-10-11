import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X, Search } from 'lucide-react';
import { Logo } from './Logo';
import { buttonClass } from './ui/Button';
import { cx } from '../utils/cx';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { NAV_IDS, NAV_ITEMS } from '../constants/nav';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeId = useScrollSpy(NAV_IDS);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white">
      <div className="mx-auto flex h-[80px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-6 lg:px-8 xl:gap-8">
        <a
          href="#home"
          className="shrink-0 rounded-md py-1"
          aria-label="Everest Textile Mills — back to top"
        >
          <Logo variant="dark" showTagline={true} />
        </a>

        <nav aria-label="Primary" className="hidden lg:block flex-1 flex justify-center">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={active ? 'true' : undefined}
                    className={cx(
                      'relative block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'text-primary'
                        : 'text-ink hover:text-primary',
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className={cx(
                        'absolute inset-x-4 bottom-0.5 h-0.5 rounded-full bg-accent transition-transform duration-200',
                        active ? 'scale-x-100' : 'scale-x-0',
                      )}
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-primary hover:text-primary"
            aria-label="Search"
          >
            <Search className="size-4.5" />
          </button>
          <span className="hidden h-6 w-px bg-line lg:block" aria-hidden="true" />
          <Link to="/signup" className={buttonClass('primary', 'md')}>
            Get Started
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:border-primary hover:text-primary lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          {menuOpen ? (
            <X aria-hidden className="size-5" />
          ) : (
            <Menu aria-hidden className="size-5" />
          )}
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!menuOpen}
        className="border-t border-line bg-white lg:hidden"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={cx(
                      'flex min-h-11 items-center rounded-lg px-3 text-base font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted hover:bg-surface hover:text-primary',
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className={buttonClass('secondary', 'md')}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              onClick={() => setMenuOpen(false)}
              className={buttonClass('primary', 'md')}
            >
              Get Started
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
