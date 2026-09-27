import { flagLabel } from '../lib/format'
import { Database } from 'lucide-react'
import type { ComparisonModel } from '../lib/model'

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function Missing({ message }: { message: string }) {
  return <div className="missing"><Database size={18} /> {message}</div>
}

export function FlagList({ model }: { model: ComparisonModel }) {
  const flags = model.aggregate.dominant_flags.length
    ? model.aggregate.dominant_flags
    : Array.from(new Set(model.runs.flatMap((run) => Object.entries(run.flags).filter(([, value]) => value).map(([key]) => key))))
  if (!flags.length) return <span className="muted">None</span>
  return <span className="flags">{flags.map((flag) => <span key={flag}>{flagLabel(flag)}</span>)}</span>
}
