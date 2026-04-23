import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-6 h-6', text: 'text-lg' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl' },
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        className={sizeClasses[size].icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background gradient — warm coral gradient */}
        <defs>
          <linearGradient id="logoGradientNew" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B4A" />
            <stop offset="100%" stopColor="#FF8F75" />
          </linearGradient>
        </defs>

        {/* Main rounded shape */}
        <rect x="4" y="4" width="32" height="32" rx="10" fill="url(#logoGradientNew)" />

        {/* Stylized camera/photo frame icon */}
        <rect x="10" y="11" width="16" height="2.5" rx="1.25" fill="white" />
        <rect x="10" y="16.5" width="12" height="2.5" rx="1.25" fill="white" />
        <rect x="10" y="22" width="16" height="2.5" rx="1.25" fill="white" />

        {/* Camera lens accent */}
        <circle cx="24" cy="26" r="4" fill="white" fillOpacity="0.9" />
        <circle cx="24" cy="26" r="2" fill="url(#logoGradientNew)" />
      </svg>

      {showText && (
        <span className={cn('font-display font-semibold text-charcoal', sizeClasses[size].text)}>
          ForeverPic
        </span>
      )}
    </div>
  )
}

interface LogoIconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LogoIcon({ className, size = 'md' }: LogoIconProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradientIconNew" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B4A" />
          <stop offset="100%" stopColor="#FF8F75" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="32" height="32" rx="10" fill="url(#logoGradientIconNew)" />
      <rect x="10" y="11" width="16" height="2.5" rx="1.25" fill="white" />
      <rect x="10" y="16.5" width="12" height="2.5" rx="1.25" fill="white" />
      <rect x="10" y="22" width="16" height="2.5" rx="1.25" fill="white" />
      <circle cx="24" cy="26" r="4" fill="white" fillOpacity="0.9" />
      <circle cx="24" cy="26" r="2" fill="url(#logoGradientIconNew)" />
    </svg>
  )
}