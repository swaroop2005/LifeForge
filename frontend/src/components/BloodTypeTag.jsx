const COLORS = {
  'O+': 'bg-red-100 text-red-700', 'O-': 'bg-red-200 text-red-800',
  'A+': 'bg-blue-100 text-blue-700', 'A-': 'bg-blue-200 text-blue-800',
  'B+': 'bg-green-100 text-green-700', 'B-': 'bg-green-200 text-green-800',
  'AB+': 'bg-purple-100 text-purple-700', 'AB-': 'bg-purple-200 text-purple-800',
}
export default function BloodTypeTag({ type }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${COLORS[type] || 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  )
}
