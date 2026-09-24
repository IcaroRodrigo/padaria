'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { useCartStore } from '@/store/cart'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PixQRCode } from './PixQRCode'
import { NfceModal } from '@/components/fiscal/NfceModal'
import { CheckCircle2, Printer, FileText } from 'lucide-react'

type PayMethod = 'CASH' | 'PIX' | 'DEBIT' | 'CREDIT'

const PAY_LABELS: Record<PayMethod, string> = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  DEBIT: 'Débito',
  CREDIT: 'Crédito',
}

interface PaymentPanelProps {
  cashRegisterId: number
  customerId?: number
  onSuccess: () => void
  onShowPayment: (v: boolean) => void
  showPayment: boolean
}

export function PaymentPanel({
  cashRegisterId,
  customerId,
  onSuccess,
}: PaymentPanelProps) {
  const { items, discount, setDiscount, clearCart, totalAmount, finalAmount } = useCartStore()
  const [selectedMethods, setSelectedMethods] = useState<PayMethod[]>(['CASH'])
  const [amounts, setAmounts] = useState<Record<PayMethod, number>>({ CASH: 0, PIX: 0, DEBIT: 0, CREDIT: 0 })
  const [cashReceived, setCashReceived] = useState(0)
  const [success, setSuccess] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [showPixQR, setShowPixQR] = useState(false)
  const [showNfce, setShowNfce] = useState(false)

  const total = totalAmount()
  const final = finalAmount()

  const toggleMethod = (method: PayMethod) => {
    setShowPixQR(false)
    setSelectedMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    )
  }

  const mutation = useMutation({
    mutationFn: (payload: any) => api.post('/sales', payload),
    onSuccess: (res) => {
      setLastSale(res.data)
      setSuccess(true)
    },
  })

  const buildPayments = () => {
    if (selectedMethods.length === 1) {
      const method = selectedMethods[0]
      return [{ method, amount: final }]
    }
    return selectedMethods.map((m) => ({ method: m, amount: amounts[m] || 0 }))
  }

  const handleFinalize = () => {
    const payments = buildPayments()
    mutation.mutate({
      cashRegisterId,
      customerId,
      discount,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
      })),
      payments,
      amountPaid: selectedMethods.includes('CASH')
        ? selectedMethods.length === 1
          ? cashReceived || final
          : amounts.CASH
        : undefined,
    })
  }

  const handleNewSale = () => {
    clearCart()
    setSelectedMethods(['CASH'])
    setAmounts({ CASH: 0, PIX: 0, DEBIT: 0, CREDIT: 0 })
    setCashReceived(0)
    setSuccess(false)
    setLastSale(null)
    setShowPixQR(false)
    onSuccess()
  }

  // Quando PIX único é selecionado e clica em finalizar, mostra QR antes de registrar
  const handleFinalizePix = () => setShowPixQR(true)

  // Callback do PIX: confirma pagamento e registra a venda
  const handlePixConfirmed = () => {
    setShowPixQR(false)
    handleFinalize()
  }

  const printReceipt = async () => {
    try {
      await fetch('http://localhost:9100/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastSale),
      })
    } catch {
      alert('Agente de impressão não encontrado. Verifique se o agente está rodando.')
    }
  }

  // Success screen
  if (success && lastSale) {
    const change = lastSale.change ? Number(lastSale.change) : 0
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4">
        <CheckCircle2 className="w-16 h-16 text-success" />
        <div>
          <h3 className="text-lg font-bold text-success">Venda concluída!</h3>
          <p className="text-muted-foreground text-sm">Venda #{lastSale.id}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 w-full">
          <div className="flex justify-between text-sm mb-1">
            <span>Total</span>
            <span className="font-semibold money">{formatCurrency(lastSale.finalAmount)}</span>
          </div>
          {change > 0 && (
            <div className="flex justify-between text-sm font-bold text-success">
              <span>Troco</span>
              <span className="money">{formatCurrency(change)}</span>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={printReceipt} className="w-full gap-2">
          <Printer size={16} />
          Imprimir Cupom (recibo)
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowNfce(true)}
          className="w-full gap-2 border-primary text-primary hover:bg-primary/5"
        >
          <FileText size={16} />
          Emitir NFC-e
        </Button>
        <Button onClick={handleNewSale} className="w-full">
          Nova Venda
        </Button>
        <NfceModal
          open={showNfce}
          onClose={() => setShowNfce(false)}
          saleId={lastSale.id}
          sale={lastSale}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Área rolável: resumo + forma de pagamento */}
      <div className="flex-1 overflow-y-auto">
      {/* Summary */}
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold mb-3">Resumo</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="money">{formatCurrency(total)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Desconto (R$)</span>
            <input
              type="number"
              value={discount}
              min="0"
              step="0.01"
              max={total}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-24 text-right text-sm border border-input rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-between text-base font-bold border-t border-border pt-2 mt-2">
            <span>Total</span>
            <span className="money text-primary">{formatCurrency(final)}</span>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold mb-3 text-sm">Forma de pagamento</h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PAY_LABELS) as PayMethod[]).map((method) => (
            <button
              key={method}
              onClick={() => toggleMethod(method)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                selectedMethods.includes(method)
                  ? 'bg-primary text-white border-primary'
                  : 'border-border hover:border-primary hover:text-primary'
              }`}
            >
              {PAY_LABELS[method]}
            </button>
          ))}
        </div>

        {/* Split amounts when multiple methods */}
        {selectedMethods.length > 1 && (
          <div className="mt-3 space-y-2">
            {selectedMethods.map((method) => (
              <div key={method} className="flex items-center gap-2">
                <span className="text-xs w-16 shrink-0">{PAY_LABELS[method]}</span>
                <input
                  type="number"
                  placeholder="R$ 0,00"
                  min="0"
                  step="0.01"
                  value={amounts[method] || ''}
                  onChange={(e) =>
                    setAmounts((prev) => ({ ...prev, [method]: parseFloat(e.target.value) || 0 }))
                  }
                  className="flex-1 text-sm border border-input rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        )}

        {/* PIX QR Code inline */}
        {selectedMethods.length === 1 && selectedMethods[0] === 'PIX' && showPixQR && (
          <div className="mt-3">
            <PixQRCode amount={final} onConfirm={handlePixConfirmed} />
          </div>
        )}

        {/* Cash received input */}
        {selectedMethods.length === 1 && selectedMethods[0] === 'CASH' && (
          <div className="mt-3">
            <label className="text-xs text-muted-foreground">Valor recebido (R$)</label>
            <input
              type="number"
              min={final}
              step="0.01"
              value={cashReceived || ''}
              onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
              placeholder={formatCurrency(final)}
              className="w-full mt-1 text-sm border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {cashReceived > 0 && cashReceived >= final && (
              <div className="flex justify-between text-sm font-bold text-success mt-2">
                <span>Troco:</span>
                <span className="money">{formatCurrency(cashReceived - final)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      </div>{/* fim da área rolável */}

      {/* Botão fixo na base — sempre visível */}
      {!showPixQR && (
        <div className="p-5 border-t border-border flex-shrink-0">
          {mutation.isError && (
            <p className="text-destructive text-xs mb-3">
              {(mutation.error as any)?.response?.data?.message || 'Erro ao finalizar venda'}
            </p>
          )}
          <Button
            onClick={
              selectedMethods.length === 1 && selectedMethods[0] === 'PIX'
                ? handleFinalizePix
                : handleFinalize
            }
            disabled={items.length === 0 || final <= 0}
            loading={mutation.isPending}
            className="w-full"
            size="lg"
          >
            {selectedMethods.length === 1 && selectedMethods[0] === 'PIX'
              ? `Gerar QR Code PIX · ${formatCurrency(final)}`
              : `Finalizar Venda · ${formatCurrency(final)}`}
          </Button>
        </div>
      )}
    </div>
  )
}
