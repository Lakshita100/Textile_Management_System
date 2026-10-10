export type BadgeTone = 'positive' | 'info' | 'neutral' | 'alert'

export function packStatusTone(status: string): BadgeTone {
  if (status === 'Dispatched' || status === 'Delivered') return 'positive'
  if (status === 'In warehouse' || status === 'In transit') return 'info'
  if (status === 'Delayed') return 'alert'
  return 'neutral'
}
