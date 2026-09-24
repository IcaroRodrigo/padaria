'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  product: Product | null
  onClose: () => void
}

export function StockEntryModal({ product, onClose }: Props) {
  const qc = useQueryClient()
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState(0)
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then((r) => r.data),
    enabled: !!product,
  })

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/stock-entries', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stock-entries'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Erro ao registrar entrada')
    },
  })

  if (!product) return null

  const qty = parseFloat(quantity.replace(',', '.'))
  const totalCost = !isNaN(qty) && qty > 0 ? qty * unitCost : 0
  const isKgOrL = product.unit === 'kg' || product.unit === 'L'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!quantity || isNaN(qty) || qty <= 0) {
      setError('Informe uma quantidade válida')
      return
    }

    mutation.mutate({
      productId: product.id,
      quantity: qty,
      unitCost,
      supplierId: supplierId ? Number(supplierId) : undefined,
      notes: notes || undefined,
    })
  }

  return (
    <Modal open={!!product} onClose={onClose} title="Registrar Entrada de Estoque" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-muted/40 rounded-lg px-4 py-3">
          <p className="text-xs text-muted-foreground">Produto</p>
          <p className="font-semibold text-sm">{product.name}</p>
          <p className="text-xs text-muted-foreground">
            Estoque atual:{' '}
            <span className="font-medium text-foreground">
              {product.stockQty != null
                ? `${Number(product.stockQty).toFixed(isKgOrL ? 3 : 0)} ${product.unit}`
                : '—'}
            </span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Quantidade ({product.unit})
          </label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder={isKgOrL ? 'Ex: 5,500' : 'Ex: 10'}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <CurrencyInput
          label={`Custo unitário (por ${product.unit})`}
          value={unitCost}
          onChange={setUnitCost}
        />

        {totalCost > 0 && (
          <div className="text-sm text-muted-foreground">
            Total da entrada:{' '}
            <span className="font-semibold text-foreground money">{formatCurrency(totalCost)}</span>
          </div>
        )}

        <Select
          label="Fornecedor (opcional)"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          placeholder="Selecionar fornecedor..."
          options={suppliers.map((s: any) => ({
            value: s.id,
            label: s.tradeName || s.companyName,
          }))}
        />

        <div>
          <label className="block text-sm font-medium mb-1.5">Observação (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: NF 12345, lote, validade..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-muted-foreground"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Confirmar Entrada'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
