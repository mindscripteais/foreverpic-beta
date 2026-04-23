import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
  showLabel?: boolean
  label?: string
  className?: string
}

export function Progress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  className,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  // Auto variant based on percentage
  const autoVariant =
    percentage >= 90
      ? 'error'
      : percentage >= 75
      ? 'warning'
      : percentage >= 50
      ? 'success'
      : 'default'

  const finalVariant = variant === 'default' ? autoVariant : variant

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm text-warm-700">{label}</span>
          {showLabel && (
            <span className="text-sm font-mono text-warm-600">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          {
            'h-1.5': size === 'sm',
            'h-2.5': size === 'md',
          }
        )}
      >
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            {
              'bg-coral': finalVariant === 'default',
              'bg-success': finalVariant === 'success',
              'bg-warning': finalVariant === 'warning',
              'bg-red-500': finalVariant === 'error',
            }
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}