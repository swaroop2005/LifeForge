const COLORS = {
  'O+': 'bg-red-500/15 text-red-400', 'O-': 'bg-red-500/25 text-red-300',
  'A+': 'bg-blue-500/15 text-blue-400', 'A-': 'bg-blue-500/25 text-blue-300',
  'B+': 'bg-green-500/15 text-green-400', 'B-': 'bg-green-500/25 text-green-300',
  'AB+': 'bg-purple-500/15 text-purple-400', 'AB-': 'bg-purple-500/25 text-purple-300',
}
export default function BloodTypeTag({ type }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${COLORS[type] || 'bg-white/10 text-zinc-400'}`}>
      {type}
    </span>
  )
}
