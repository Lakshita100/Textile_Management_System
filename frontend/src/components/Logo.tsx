import { cx } from '../utils/cx';

interface LogoProps {
  variant?: 'dark' | 'light';
  className?: string;
  showTagline?: boolean;
}

/**
 * Everest Textile Mills brand mark: an abstract blue-and-green textile wave
 * paired with the wordmark.
 */
export function Logo({ variant = 'dark', className, showTagline = true }: LogoProps) {
  const wordmarkClass = variant === 'dark' ? 'text-ink' : 'text-white';
  const taglineClass = variant === 'dark' ? 'text-muted' : 'text-white/70';

  return (
    <span className={cx('inline-flex items-center gap-3', className)}>
      <svg
        viewBox="0 0 56 34"
        className="h-8 w-auto shrink-0"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M4 24C11 10 19 8 28 18"
          fill="none"
          className="stroke-accent"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <path
          d="M16 26C23 12 33 9 43 17"
          fill="none"
          className="stroke-primary"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <path
          d="M32 27c6-8 13-10 21-6"
          fill="none"
          className="stroke-primary-dark"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={cx(
            'font-display text-[13px] font-extrabold uppercase tracking-[0.1em] sm:text-[15px]',
            wordmarkClass,
          )}
        >
          Everest Textile Mills
        </span>
        {showTagline ? (
          <span
            className={cx(
              'mt-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] sm:text-[10px]',
              taglineClass,
            )}
          >
            From Yarn to the World
          </span>
        ) : null}
      </span>
    </span>
  );
}
