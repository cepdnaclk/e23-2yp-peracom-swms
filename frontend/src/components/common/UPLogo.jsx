import uopLogo from '../../assets/uop-logo.png'

export function UPLogo({ size = 'md' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' }
  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-white shadow-sm flex-shrink-0`}>
      <img src={uopLogo} alt="University of Peradeniya logo" className="w-full h-full object-cover" />
    </div>
  )
}
