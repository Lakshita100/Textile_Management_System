import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cx(
        align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl',
        className,
      )}
    >
      {eyebrow ? (
        <p className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <span aria-hidden className="h-0.5 w-7 bg-accent" />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink lg:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted lg:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
