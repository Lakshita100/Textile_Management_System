import { cx } from '../../utils/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'onDark' | 'onDarkOutline';
export type ButtonSize = 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark',
  secondary:
    'border border-line bg-surface text-ink hover:border-primary hover:text-primary',
  onDark: 'bg-white text-primary-dark hover:bg-white/90 active:bg-white/85',
  onDarkOutline:
    'border border-white/45 text-white hover:bg-white/10 active:bg-white/15',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
};

/**
 * Shared call-to-action styling for links that behave like buttons
 * (React Router `<Link>` or plain anchors).
 */
export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cx(BASE, VARIANTS[variant], SIZES[size], className);
}
