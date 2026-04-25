import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/foreverpic.png"
        alt="ForeverPic"
        className={cn('rounded-xl object-contain', sizeClasses[size])}
      />
      {showText && (
        <span className={cn('font-display font-semibold text-charcoal', size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl')}>
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
    <img
      src="/foreverpic.png"
      alt="ForeverPic"
      className={cn('rounded-xl object-contain', sizeClasses[size], className)}
    />
  )
}