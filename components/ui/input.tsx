import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-warm-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border bg-white transition-all duration-150',
            'placeholder:text-warm-500',
            'focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral',
            'disabled:bg-warm-100 disabled:cursor-not-allowed',
            error ? 'border-coral focus:ring-coral/50 focus:border-coral' : 'border-warm-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-coral">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-warm-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border bg-white transition-all duration-150 resize-none',
            'placeholder:text-warm-500',
            'focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral',
            error ? 'border-coral' : 'border-warm-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-coral">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'