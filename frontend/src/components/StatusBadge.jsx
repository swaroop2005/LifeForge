const COLORS = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  fulfilled: 'bg-green-500/15 text-green-400',
  escalated: 'bg-red-500/15 text-red-400',
  low: 'bg-blue-500/15 text-blue-400',
  medium: 'bg-orange-500/15 text-orange-400',
  critical: 'bg-red-500/15 text-red-400',
}
export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${COLORS[status] || 'bg-white/10 text-zinc-400'}`}>
      {status}
    </span>
  )
}
