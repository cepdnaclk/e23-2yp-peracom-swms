export function UPLogo({ size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0`}>
      UP
    </div>
  )
}
