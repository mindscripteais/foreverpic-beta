import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-xl',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          'transform hover:scale-[1.02] active:scale-[0.98]',
          {
            'bg-gradient-to-r from-coral to-coral/90 text-white hover:shadow-glow focus:ring-coral':
              variant === 'primary',
            'bg-warm-100 text-charcoal hover:bg-warm-200 focus:ring-warm-500':
              variant === 'secondary',
            'bg-gradient-to-r from-gold to-gold/90 text-white hover:shadow-lg focus:ring-gold':
              variant === 'accent',
            'bg-transparent text-warm-700 hover:bg-warm-100 focus:ring-warm-400':
              variant === 'ghost',
            'bg-coral text-white hover:bg-coral/90 focus:ring-coral':
              variant === 'danger',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'