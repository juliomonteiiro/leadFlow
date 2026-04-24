import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm text-text-secondary font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'bg-surface-card border border-surface-border rounded-input px-3 py-2 text-text-primary',
            'placeholder:text-text-muted focus:outline-none focus:border-brand w-full transition-colors',
            error ? 'border-danger' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
