const TAG_STYLES: Record<string, string> = {
  vegan: 'bg-green-100 text-green-700 border-green-200',
  vegetarian: 'bg-lime-100 text-lime-700 border-lime-200',
  'gluten-free': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'dairy-free': 'bg-orange-100 text-orange-700 border-orange-200',
  'nut-free': 'bg-pink-100 text-pink-700 border-pink-200',
  halal: 'bg-teal-100 text-teal-700 border-teal-200',
  kosher: 'bg-purple-100 text-purple-700 border-purple-200',
}

const DEFAULT_STYLE = 'bg-blue-100 text-blue-700 border-blue-200'

export default function DietaryTag({ tag }: { tag: string }) {
  const style = TAG_STYLES[tag.toLowerCase()] ?? DEFAULT_STYLE
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${style}`}
    >
      {tag}
    </span>
  )
}
