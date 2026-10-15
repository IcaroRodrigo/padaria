'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowDownCircle, CheckCircle2 } from 'lucide-react'

interface SangriaModalProps {
  cashRegisterId: number
  onClose: () => void
}

export function SangriaModal({ cashRegisterId, onClose }: SangriaModalProps) {
  const qc = useQueryClient()
  const [amount, setAmount] = useState('')
  const [motivo, setMotivo] = useState('')
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/sales/cash-register/${cashRegisterId}/withdrawal`, {
        amount: parseFloat(amount),
        motivo: motivo.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-register'] })
      setDone(true)
    },
  })

  const amountNum = parseFloat(amount) || 0
  const canSubmit = amountNum > 0 && motivo.trim().length > 0

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <CheckCircle2 className="w-12 h-12 text-success" />
        <div className="text-center">
          <p className="font-semibold text-lg">Sangria registrada</p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatCurrency(amountNum)} retirado do caixa
          </p>
        </div>
        <Button className="w-full" onClick={onClose}>Fechar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <ArrowDownCircle size={18} className="text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800">
          A sangria reduz o saldo esperado do caixa e será exibida no fechamento.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Valor (R$)</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          autoFocus
          className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Motivo</label>
        <input
          type="text"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ex: entrega para filha, pagamento entregador..."
          maxLength={255}
          className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {mutation.isError && (
        <p className="text-xs text-destructive">
          {(mutation.error as any)?.response?.data?.message || 'Erro ao registrar sangria'}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          className="flex-1"
          disabled={!canSubmit}
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Registrar sangria
        </Button>
      </div>
    </div>
  )
}
