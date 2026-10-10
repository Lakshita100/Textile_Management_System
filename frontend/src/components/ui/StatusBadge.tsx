import type { BadgeTone } from './badgeTone'

const toneClass: Record<BadgeTone, string> = {
  positive: 'border-highlight text-highlight',
  info: 'border-action text-action',
  neutral: 'border-line text-copy',
  alert: 'border-title text-title bg-panel',
}

export default function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string
  tone?: BadgeTone
}) {
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${toneClass[tone]}`}
    >
      {label}
    </span>
  )
}
