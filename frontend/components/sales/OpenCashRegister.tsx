'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { useCartStore } from '@/store/cart'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'

export function OpenCashRegister({ onSuccess }: { onSuccess: () => void }) {
  const [balance, setBalance] = useState('')
  const setCashRegister = useCartStore((s) => s.setCashRegister)

  const mutation = useMutation({
    mutationFn: (openingBalance: number) =>
      api.post('/sales/cash-register/open', { openingBalance }),
    onSuccess: (res) => {
      setCashRegister(res.data.id)
      onSuccess()
    },
  })

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-8 max-w-sm w-full text-center">
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Wallet className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-lg font-bold mb-1">Abrir Caixa</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Informe o saldo inicial em dinheiro para abrir o caixa do dia.
      </p>

      <div className="mb-4 text-left">
        <label className="block text-sm font-medium mb-1.5">Saldo inicial (R$)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="0,00"
          className="w-full px-4 py-3 text-lg text-center rounded-xl border border-input focus:outline-none focus:ring-2 focus:ring-primary font-mono"
          autoFocus
        />
      </div>

      {mutation.isError && (
        <p className="text-destructive text-sm mb-3">
          {(mutation.error as any)?.response?.data?.message || 'Erro ao abrir caixa'}
        </p>
      )}

      <Button
        onClick={() => mutation.mutate(parseFloat(balance) || 0)}
        loading={mutation.isPending}
        className="w-full"
        size="lg"
      >
        Abrir Caixa
      </Button>
    </div>
  )
}
