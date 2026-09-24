'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CurrencyInputProps {
  label?: string
  error?: string
  value?: number
  onChange?: (value: number) => void
  onBlur?: () => void
  name?: string
  placeholder?: string
  className?: string
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, value, onChange, onBlur, name, placeholder = '0,00', className }, ref) => {
    const cents = Math.round((value ?? 0) * 100)
    const displayValue = cents > 0 ? formatCents(cents) : ''

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '')
      const newCents = digits === '' ? 0 : parseInt(digits, 10)
      onChange?.(newCents / 100)
    }

    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">
            R$
          </span>
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            name={name}
            value={displayValue}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder={placeholder}
            className={cn(
              'w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition placeholder:text-muted-foreground',
              error && 'border-destructive focus:ring-destructive',
              className,
            )}
          />
        </div>
        {error && <p className="text-destructive text-xs mt-1">{error}</p>}
      </div>
    )
  },
)
CurrencyInput.displayName = 'CurrencyInput'
