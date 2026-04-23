import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        {
          'bg-warm-200 text-warm-700': variant === 'default',
          'bg-coral/10 text-coral': variant === 'primary',
          'bg-gold/10 text-gold-700': variant === 'secondary',
          'bg-gold/15 text-gold-700': variant === 'accent',
          'bg-success/10 text-success': variant === 'success',
          'bg-warning/10 text-warning': variant === 'warning',
          'bg-red-100 text-red-700': variant === 'error',
        },
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-3 py-1 text-sm': size === 'md',
        },
        className
      )}
    >
      {children}
    </span>
  )
}

interface TierBadgeProps {
  tier: 'FREE' | 'PRO' | 'ENTERPRISE'
}

export function TierBadge({ tier }: TierBadgeProps) {
  const config = {
    FREE: { label: 'Free', variant: 'default' as const },
    PRO: { label: 'Pro', variant: 'primary' as const },
    ENTERPRISE: { label: 'Enterprise', variant: 'accent' as const },
  }

  const { label, variant } = config[tier]

  return <Badge variant={variant}>{label}</Badge>
}