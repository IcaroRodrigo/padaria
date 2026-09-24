'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { Product, Customer } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { parseScaleBarcode, settingsToScaleConfig } from '@/lib/scale'
import { Modal } from '@/components/ui/modal'
import { Cart } from '@/components/sales/Cart'
import { PaymentPanel } from '@/components/sales/PaymentPanel'
import { OpenCashRegister } from '@/components/sales/OpenCashRegister'
import { CloseCashRegister } from '@/components/sales/CloseCashRegister'
import { Search, User, Scale, LogOut, ShoppingBag, X } from 'lucide-react'

export default function PDVPage() {
  const qc = useQueryClient()
  const { items, addItem, cashRegisterId, setCashRegister } = useCartStore()

  const [search, setSearch] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [scaleNotice, setScaleNotice] = useState<string | null>(null)
  const [showCloseCashRegister, setShowCloseCashRegister] = useState(false)
  const [showMobilePayment, setShowMobilePayment] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const { finalAmount } = useCartStore()

  // Redireciona foco ao campo de busca quando nenhum input está ativo
  // Garante que a pistola de código de barras sempre funcione
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null
      if (!active) return
      const tag = active.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Tab' || e.key === 'Escape') return
      searchRef.current?.focus()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Configurações da loja (para balança e PIX)
  const { data: settings = {} } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
  })

  // Check open cash register
  const { data: cashRegister, isLoading: loadingCashRegister } = useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn: () => api.get('/sales/cash-register/current').then((r) => r.data),
  })

  if (cashRegister && !cashRegisterId) {
    setCashRegister(cashRegister.id)
  }

  // Detecta e processa etiqueta de balança
  const handleScaleBarcode = useCallback(async (barcode: string): Promise<boolean> => {
    const scaleConfig = settingsToScaleConfig(settings)
    const result = parseScaleBarcode(barcode, scaleConfig)

    if (!result.isScaleBarcode) return false

    try {
      const product = await api.get(`/products/plu/${result.plu}`).then((r) => r.data)

      if (result.price !== undefined) {
        // Formato preço: calcula a quantidade a partir do preço total
        const quantity = parseFloat((result.price / Number(product.salePrice)).toFixed(3))
        addItem({
          productId: product.id,
          name: product.name,
          unit: product.unit,
          quantity,
          unitPrice: Number(product.salePrice),
          discount: 0,
        })
        setScaleNotice(`⚖ ${product.name} — ${quantity.toFixed(3)} ${product.unit} · ${formatCurrency(result.price)}`)
      } else if (result.weight !== undefined) {
        // Formato peso: usa o peso direto como quantidade
        addItem({
          productId: product.id,
          name: product.name,
          unit: product.unit,
          quantity: result.weight,
          unitPrice: Number(product.salePrice),
          discount: 0,
        })
        setScaleNotice(`⚖ ${product.name} — ${result.weight.toFixed(3)} kg · ${formatCurrency(result.weight * Number(product.salePrice))}`)
      }

      setTimeout(() => setScaleNotice(null), 3000)
      return true
    } catch {
      setScaleNotice('⚠ Produto da balança não encontrado. Cadastre o PLU.')
      setTimeout(() => setScaleNotice(null), 4000)
      return true // ainda era etiqueta de balança, só não achou o produto
    }
  }, [settings, addItem])

  // Product search
  const { data: searchResults = [] } = useQuery<Product[]>({
    queryKey: ['products', 'search', search],
    queryFn: () =>
      api.get('/products', { params: { search, active: true } }).then((r) => r.data),
    enabled: search.length >= 2 && !/^\d{13}$/.test(search),
  })

  // Customer search
  const { data: customerResults = [] } = useQuery<Customer[]>({
    queryKey: ['customers', 'search', customerSearch],
    queryFn: () =>
      api.get('/customers', { params: { search: customerSearch } }).then((r) => r.data),
    enabled: customerSearch.length >= 2,
  })

  const handleAddProduct = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      unit: product.unit,
      quantity: 1,
      unitPrice: Number(product.salePrice),
      discount: 0,
    })
    setSearch('')
    searchRef.current?.focus()
  }

  // Ao pressionar Enter no campo de busca: tenta barcode/PLU antes de buscar
  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const value = search.trim()
    if (!value) return

    // 1. Tenta etiqueta de balança (EAN-13 começando com "2")
    if (/^\d{13}$/.test(value) && value[0] === '2') {
      const handled = await handleScaleBarcode(value)
      if (handled) { setSearch(''); return }
    }

    // 2. Tenta barcode normal (EAN-13 qualquer)
    if (/^\d{8,14}$/.test(value)) {
      try {
        const product = await api.get(`/products/barcode/${value}`).then((r) => r.data)
        handleAddProduct(product)
        return
      } catch { /* não encontrou por barcode, deixa a busca textual */ }
    }

    // 3. Se só tem um resultado na busca, adiciona automaticamente
    if (searchResults.length === 1) {
      handleAddProduct(searchResults[0])
    }
  }

  if (loadingCashRegister) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  // No open cash register
  if (!cashRegister) {
    return (
      <div className="p-8 flex items-center justify-center min-h-full">
        <OpenCashRegister
          onSuccess={() => qc.invalidateQueries({ queryKey: ['cash-register'] })}
        />
      </div>
    )
  }

  const mobileTotal = finalAmount()

  return (
    <div className="flex h-[calc(100dvh-56px)] md:h-screen overflow-hidden">
      {/* Left: Product Search + Cart */}
      <div className="flex-1 flex flex-col overflow-hidden pb-24 md:pb-0">
        {/* Header */}
        <div className="bg-white border-b border-border px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar produto por nome ou código de barras..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />

              {/* Dropdown */}
              {search.length >= 2 && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-20 max-h-72 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleAddProduct(p)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition text-left"
                    >
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.category.name} · {p.unit}</div>
                      </div>
                      <div className="text-sm font-semibold money text-primary">
                        {formatCurrency(Number(p.salePrice))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Customer */}
            <button
              onClick={() => setShowCustomerSearch(true)}
              className="flex items-center gap-2 px-3 py-2.5 border border-input rounded-lg text-sm hover:bg-muted/30 transition"
            >
              <User size={16} />
              {selectedCustomer ? (
                <span className="text-primary font-medium">{selectedCustomer.name}</span>
              ) : (
                <span className="text-muted-foreground">Cliente</span>
              )}
            </button>
          </div>

          {/* Cash register info */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Caixa #{cashRegister.id} aberto</span>
            <span>{cashRegister.salesCount} venda{cashRegister.salesCount !== 1 ? 's' : ''}</span>
            <span className="font-semibold text-success money">{formatCurrency(cashRegister.totalSales || 0)} em vendas</span>
            <button
              onClick={() => setShowCloseCashRegister(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/5 transition text-xs font-medium"
            >
              <LogOut size={13} />
              Fechar caixa
            </button>
          </div>
        </div>

        {/* Scale notice */}
        {scaleNotice && (
          <div className="bg-primary text-white text-sm px-6 py-2.5 flex items-center gap-2 animate-fade-in">
            <Scale size={15} />
            <span>{scaleNotice}</span>
          </div>
        )}

        {/* Cart */}
        <div className="flex-1 overflow-y-auto">
          <Cart />
        </div>
      </div>

      {/* Right: Total + Payment — desktop only */}
      <div className="hidden md:flex w-80 bg-white border-l border-border flex-col">
        <PaymentPanel
          cashRegisterId={cashRegister.id}
          customerId={selectedCustomer?.id}
          onSuccess={() => {
            setSelectedCustomer(null)
            qc.invalidateQueries({ queryKey: ['cash-register'] })
          }}
          onShowPayment={setShowPayment}
          showPayment={showPayment}
        />
      </div>

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-border px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingBag size={15} />
            <span>{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
          </div>
          <span className="font-bold text-primary text-lg money">{formatCurrency(mobileTotal)}</span>
        </div>
        <button
          onClick={() => setShowMobilePayment(true)}
          disabled={items.length === 0}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition"
        >
          Finalizar Venda
        </button>
      </div>

      {/* Mobile payment bottom sheet */}
      {showMobilePayment && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobilePayment(false)} />
          <div className="relative bg-white rounded-t-2xl max-h-[92dvh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-border">
              <span className="font-semibold text-sm">Pagamento</span>
              <button onClick={() => setShowMobilePayment(false)} className="p-1 rounded-lg hover:bg-muted/50">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PaymentPanel
                cashRegisterId={cashRegister.id}
                customerId={selectedCustomer?.id}
                onSuccess={() => {
                  setSelectedCustomer(null)
                  setShowMobilePayment(false)
                  qc.invalidateQueries({ queryKey: ['cash-register'] })
                }}
                onShowPayment={setShowPayment}
                showPayment={showPayment}
              />
            </div>
          </div>
        </div>
      )}

      {/* Close cash register modal */}
      <Modal
        open={showCloseCashRegister}
        onClose={() => setShowCloseCashRegister(false)}
        title="Fechamento de Caixa"
        size="sm"
      >
        <CloseCashRegister
          cashRegister={cashRegister}
          onSuccess={() => {
            setShowCloseCashRegister(false)
            useCartStore.getState().setCashRegister(undefined)
            qc.invalidateQueries({ queryKey: ['cash-register'] })
          }}
        />
      </Modal>

      {/* Customer search modal */}
      <Modal
        open={showCustomerSearch}
        onClose={() => setShowCustomerSearch(false)}
        title="Selecionar Cliente"
        size="sm"
      >
        <div className="space-y-3">
          <input
            placeholder="Buscar por nome, CPF ou telefone..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {customerResults.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCustomer(c)
                useCartStore.getState().setCustomer(c.id)
                setShowCustomerSearch(false)
                setCustomerSearch('')
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition text-left"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={14} className="text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">{c.name}</div>
                {c.cpf && <div className="text-xs text-muted-foreground">{c.cpf}</div>}
              </div>
            </button>
          ))}
          {customerSearch.length >= 2 && customerResults.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Nenhum cliente encontrado
            </p>
          )}
          {selectedCustomer && (
            <button
              onClick={() => {
                setSelectedCustomer(null)
                useCartStore.getState().setCustomer(undefined)
                setShowCustomerSearch(false)
              }}
              className="w-full text-center text-sm text-destructive hover:underline"
            >
              Remover cliente da venda
            </button>
          )}
        </div>
      </Modal>
    </div>
  )
}
