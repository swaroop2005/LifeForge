const COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  fulfilled: 'bg-green-100 text-green-700',
  escalated: 'bg-red-100 text-red-700',
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}
export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
