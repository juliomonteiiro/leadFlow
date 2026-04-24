import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm text-text-secondary font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            'bg-surface-card border border-surface-border rounded-input px-3 py-2 text-text-primary',
            'placeholder:text-text-muted focus:outline-none focus:border-brand w-full transition-colors resize-y min-h-[80px]',
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

Textarea.displayName = 'Textarea'
