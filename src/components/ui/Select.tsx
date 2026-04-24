import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm text-text-secondary font-medium">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={[
            'bg-surface-card border border-surface-border rounded-input px-3 py-2 text-text-primary',
            'focus:outline-none focus:border-brand w-full transition-colors',
            error ? 'border-danger' : '',
            className,
          ].join(' ')}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'
