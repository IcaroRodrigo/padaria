'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { CartItem } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'

const isWeight = (unit: string) => unit === 'kg' || unit === 'L'

function CartItemRow({
  item,
  onRemove,
  onQty,
  onDiscount,
}: {
  item: CartItem
  onRemove: () => void
  onQty: (q: number) => void
  onDiscount: (d: number) => void
}) {
  const step = isWeight(item.unit) ? 0.1 : 1
  const [inputVal, setInputVal] = useState<string | null>(null)

  const displayQty = inputVal !== null
    ? inputVal
    : isWeight(item.unit) ? item.quantity.toFixed(3) : String(item.quantity)

  const commitInput = () => {
    if (inputVal === null) return
    const parsed = parseFloat(inputVal.replace(',', '.'))
    if (!isNaN(parsed) && parsed > 0) onQty(parsed)
    setInputVal(null)
  }

  return (
    <div className="bg-white rounded-xl border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.name}</p>
          <p className="text-xs text-muted-foreground money">
            {formatCurrency(item.unitPrice)} / {item.unit}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-1 hover:bg-red-50 hover:text-destructive rounded transition shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2">
        {/* Quantity control */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onQty(Math.max(step, parseFloat((item.quantity - step).toFixed(3))))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted hover:bg-gray-200 transition"
          >
            <Minus size={12} />
          </button>
          <input
            type="text"
            inputMode="decimal"
            value={displayQty}
            onChange={(e) => setInputVal(e.target.value)}
            onFocus={(e) => {
              setInputVal(isWeight(item.unit) ? item.quantity.toFixed(3) : String(item.quantity))
              e.target.select()
            }}
            onBlur={commitInput}
            onKeyDown={(e) => { if (e.key === 'Enter') { commitInput(); (e.target as HTMLInputElement).blur() } }}
            className="w-16 text-center text-sm border border-input rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={() => onQty(parseFloat((item.quantity + step).toFixed(3)))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted hover:bg-gray-200 transition"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Discount */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Desc. R$</span>
          <input
            type="number"
            value={item.discount}
            min="0"
            step="0.01"
            onChange={(e) => onDiscount(parseFloat(e.target.value) || 0)}
            className="w-16 text-center text-sm border border-input rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Subtotal */}
        <span className="text-sm font-semibold money text-primary">
          {formatCurrency(item.subtotal)}
        </span>
      </div>
    </div>
  )
}

export function Cart() {
  const { items, removeItem, updateQuantity, updateItemDiscount } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8">
        <ShoppingCart size={48} className="opacity-20" />
        <p className="text-sm">Carrinho vazio</p>
        <p className="text-xs">Busque um produto acima para adicionar</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-2">
      {items.map((item) => (
        <CartItemRow
          key={item.productId}
          item={item}
          onRemove={() => removeItem(item.productId)}
          onQty={(q) => updateQuantity(item.productId, q)}
          onDiscount={(d) => updateItemDiscount(item.productId, d)}
        />
      ))}
    </div>
  )
}
