'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
  ComposedChart, Line, Legend,
} from 'recharts'
import { AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { NfceCaixaButton } from '@/components/fiscal/NfceCaixaButton'

const PAY_COLORS: Record<string, string> = {
  CASH: '#4a7c2f',
  PIX: '#6da044',
  DEBIT: '#c49a3c',
  CREDIT: '#3a6124',
  MIXED: '#9ca3af',
}

const PAY_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  DEBIT: 'Débito',
  CREDIT: 'Crédito',
  MIXED: 'Misto',
}

function getDefaultDates() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  }
}

export default function RelatoriosPage() {
  const [dates, setDates] = useState(getDefaultDates)
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day')
  const [tab, setTab] = useState<'vendas' | 'caixa' | 'produtos-por-caixa' | 'compras'>('vendas')

  const params = { startDate: dates.startDate, endDate: dates.endDate }

  const { data: revenue = [] } = useQuery({
    queryKey: ['report', 'revenue', dates, groupBy],
    queryFn: () => api.get('/dashboard/revenue', { params: { ...params, groupBy } }).then((r) => r.data),
  })

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['report', 'payment-methods', dates],
    queryFn: () => api.get('/dashboard/payment-methods', { params }).then((r) => r.data),
  })

  const { data: topProducts = [] } = useQuery({
    queryKey: ['report', 'top-products', dates],
    queryFn: () => api.get('/dashboard/top-products', { params: { ...params, limit: 10 } }).then((r) => r.data),
  })

  const { data: cashFlow } = useQuery({
    queryKey: ['report', 'cash-flow', dates],
    queryFn: () => api.get('/dashboard/cash-flow', { params }).then((r) => r.data),
  })

  const { data: cashRegisters = [] } = useQuery({
    queryKey: ['report', 'cash-registers', dates],
    queryFn: () => api.get('/sales/cash-register/history', { params }).then((r) => r.data),
    enabled: tab === 'caixa' || tab === 'produtos-por-caixa',
  })

  const { data: stockEntriesData } = useQuery({
    queryKey: ['report', 'stock-entries', dates],
    queryFn: () => api.get('/stock-entries', { params }).then((r) => r.data),
    enabled: tab === 'compras',
  })

  const { data: profitData = [] } = useQuery({
    queryKey: ['report', 'profit', dates],
    queryFn: () => api.get('/dashboard/profit', { params: { ...params, groupBy: 'month' } }).then((r) => r.data),
    enabled: tab === 'vendas',
  })

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Relatórios" description="Análises do período selecionado" />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl border border-border p-1 w-full sm:w-fit">
        <button
          onClick={() => setTab('vendas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'vendas' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
        >
          Vendas
        </button>
        <button
          onClick={() => setTab('caixa')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'caixa' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
        >
          Auditoria de Caixa
        </button>
        <button
          onClick={() => setTab('produtos-por-caixa')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'produtos-por-caixa' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
        >
          Produtos por Caixa
        </button>
        <button
          onClick={() => setTab('compras')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'compras' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
        >
          Compras
        </button>
      </div>

      {/* Date filter */}
      <div className="flex flex-col gap-3 mb-6 bg-white rounded-xl border border-border p-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium w-8">De:</label>
            <input
              type="date"
              value={dates.startDate}
              onChange={(e) => setDates((d) => ({ ...d, startDate: e.target.value }))}
              className="flex-1 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium w-8">Até:</label>
            <input
              type="date"
              value={dates.endDate}
              onChange={(e) => setDates((d) => ({ ...d, endDate: e.target.value }))}
              className="flex-1 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex gap-1 sm:ml-auto">
          <button
            onClick={() => setGroupBy('day')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${groupBy === 'day' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
          >
            Por dia
          </button>
          <button
            onClick={() => setGroupBy('month')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${groupBy === 'month' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
          >
            Por mês
          </button>
        </div>
      </div>

      {tab === 'compras' && (
        <StockEntriesReport data={stockEntriesData} queryKey={['report', 'stock-entries', dates]} />
      )}

      {tab === 'caixa' && (
        <CashRegisterAudit registers={cashRegisters} />
      )}

      {tab === 'produtos-por-caixa' && (
        <ProductsByCashRegister registers={cashRegisters} />
      )}

      {tab === 'vendas' && (
      <>
      {cashFlow && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">Faturamento</p>
            <p className="text-xl font-bold text-success money">{formatCurrency(cashFlow.revenue)}</p>
            <p className="text-xs text-muted-foreground">{cashFlow.salesCount} vendas</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">Custo mercadorias (CMV)</p>
            <p className="text-xl font-bold text-orange-500 money">{formatCurrency(cashFlow.cmv)}</p>
            <p className="text-xs text-muted-foreground">
              {cashFlow.revenue > 0 ? `${((cashFlow.cmv / cashFlow.revenue) * 100).toFixed(1)}% do faturamento` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">Despesas operacionais</p>
            <p className="text-xl font-bold text-destructive money">{formatCurrency(cashFlow.expenses.total)}</p>
            <p className="text-xs text-muted-foreground">
              Fixas {formatCurrency(cashFlow.expenses.fixed)} · Variáveis {formatCurrency(cashFlow.expenses.variable)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">Lucro líquido</p>
            <p className={`text-xl font-bold money ${cashFlow.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(cashFlow.profit)}
            </p>
            <p className="text-xs text-muted-foreground">
              {cashFlow.revenue > 0 ? `Margem ${((cashFlow.profit / cashFlow.revenue) * 100).toFixed(1)}%` : '—'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Faturamento por período</CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2d9c5" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6b6b6b' }}
                    tickFormatter={(v) => {
                      if (groupBy === 'day') {
                        const d = new Date(v + 'T12:00:00')
                        return `${d.getDate()}/${d.getMonth() + 1}`
                      }
                      return v
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#6b6b6b' }} width={70}
                    tickFormatter={(v) =>
                      v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v.toFixed(0)}`
                    }
                  />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), 'Faturamento']}
                  />
                  <Bar dataKey="revenue" fill="#4a7c2f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment methods pie */}
        <Card>
          <CardHeader>
            <CardTitle>Por forma de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      dataKey="amount"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                    >
                      {paymentMethods.map((entry: any, i: number) => (
                        <Cell key={i} fill={PAY_COLORS[entry.method] || '#9ca3af'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {paymentMethods.map((pm: any) => (
                    <div key={pm.method} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ background: PAY_COLORS[pm.method] }}
                        />
                        <span>{PAY_LABELS[pm.method] || pm.method}</span>
                      </div>
                      <span className="font-semibold money">{formatCurrency(pm.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profit chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resultado mensal — Faturamento · CMV · Despesas · Lucro</CardTitle>
        </CardHeader>
        <CardContent>
          {profitData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={profitData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2d9c5" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b6b6b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b6b6b' }}
                  width={70}
                  tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v.toFixed(0)}`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      revenue: 'Faturamento',
                      cmv: 'CMV',
                      expenses: 'Despesas',
                      profit: 'Lucro líquido',
                    }
                    return [formatCurrency(value), labels[name] || name]
                  }}
                />
                <Legend
                  formatter={(value: string) => ({
                    revenue: 'Faturamento',
                    cmv: 'CMV',
                    expenses: 'Despesas',
                    profit: 'Lucro líquido',
                  } as Record<string, string>)[value] ?? value}
                />
                <Bar dataKey="revenue" fill="#4a7c2f" radius={[4, 4, 0, 0]} name="revenue" />
                <Bar dataKey="cmv" fill="#f97316" radius={[4, 4, 0, 0]} name="cmv" stackId="costs" />
                <Bar dataKey="expenses" fill="#dc2626" radius={[4, 4, 0, 0]} name="expenses" stackId="costs" />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#1e3a0f"
                  strokeWidth={2}
                  dot={{ fill: '#1e3a0f', r: 4 }}
                  name="profit"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              Sem dados no período
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top products */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos mais vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {topProducts.map((p: any, i: number) => (
                <div key={p.productId} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(p.quantity).toFixed(2)} {p.unit} · {p.category}
                    </p>
                  </div>
                  <span className="text-sm font-semibold money shrink-0">{formatCurrency(p.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Sem vendas no período</p>
          )}
        </CardContent>
      </Card>
      </>
      )}
    </div>
  )
}

function StockEntriesReport({ data, queryKey }: { data?: { entries: any[]; totalCost: number; count: number }; queryKey: any[] }) {
  const qc = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/stock-entries/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const handleDelete = (e: any) => {
    const qty = e.product.unit === 'kg' || e.product.unit === 'L'
      ? `${Number(e.quantity).toFixed(3)} ${e.product.unit}`
      : `${Number(e.quantity).toFixed(0)} un`
    if (!confirm(`Remover entrada de ${qty} de "${e.product.name}"?\n\nO estoque será revertido automaticamente.`)) return
    deleteMutation.mutate(e.id)
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Carregando...
        </CardContent>
      </Card>
    )
  }

  const { entries, totalCost, count } = data

  if (count === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Nenhuma entrada de estoque registrada no período
        </CardContent>
      </Card>
    )
  }

  const bySupplier = entries.reduce((acc: Record<string, number>, e) => {
    const name = e.supplier?.companyName || 'Sem fornecedor'
    acc[name] = (acc[name] || 0) + Number(e.totalCost)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total investido</p>
          <p className="text-xl font-bold text-primary money">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Entradas registradas</p>
          <p className="text-xl font-bold">{count}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Fornecedores</p>
          <p className="text-xl font-bold">{Object.keys(bySupplier).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Histórico de entradas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <Thead>
                <tr>
                  <Th>Data</Th>
                  <Th>Produto</Th>
                  <Th>Categoria</Th>
                  <Th className="text-right">Qtd</Th>
                  <Th className="text-right">Custo unit.</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Fornecedor</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <Tbody>
                {entries.map((e) => (
                  <Tr key={e.id}>
                    <Td className="text-xs whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Td>
                    <Td className="font-medium">{e.product.name}</Td>
                    <Td className="text-xs text-muted-foreground">{e.product.category?.name || '—'}</Td>
                    <Td className="text-right tabular-nums">
                      {e.product.unit === 'kg' || e.product.unit === 'L'
                        ? `${Number(e.quantity).toFixed(3)} ${e.product.unit}`
                        : `${Number(e.quantity).toFixed(0)} un`}
                    </Td>
                    <Td className="text-right money">{formatCurrency(Number(e.unitCost))}</Td>
                    <Td className="text-right money font-semibold">{formatCurrency(Number(e.totalCost))}</Td>
                    <Td className="text-xs text-muted-foreground">
                      {e.supplier?.companyName || '—'}
                    </Td>
                    <Td>
                      <button
                        onClick={() => handleDelete(e)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 hover:bg-red-50 hover:text-destructive rounded-lg transition"
                        title="Remover entrada"
                      >
                        <Trash2 size={14} />
                      </button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(bySupplier)
                .sort(([, a], [, b]) => b - a)
                .map(([name, amount]) => (
                  <div key={name} className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground truncate">{name}</span>
                    <span className="font-semibold money shrink-0">{formatCurrency(amount)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro', PIX: 'PIX', DEBIT: 'Débito', CREDIT: 'Crédito', MIXED: 'Misto',
}

function CashRegisterProductsRow({ register }: { register: any }) {
  const [open, setOpen] = useState(false)

  const { data: products = [], isFetching } = useQuery({
    queryKey: ['cash-register-products', register.id],
    queryFn: () => api.get(`/sales/cash-register/${register.id}/products`).then((r) => r.data),
    enabled: open,
  })

  const totalRevenue = products.reduce((s: number, p: any) => s + p.revenue, 0)

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-muted/40 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
          <div>
            <span className="text-xs text-muted-foreground">Caixa</span>
            <p className="font-semibold text-sm">#{register.id}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Operador</span>
            <p className="text-sm">{register.operator}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Abertura</span>
            <p className="text-sm">{new Date(register.openedAt).toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Fechamento</span>
            <p className="text-sm">{register.closedAt ? new Date(register.closedAt).toLocaleString('pt-BR') : <span className="text-amber-500">Em aberto</span>}</p>
          </div>
        </div>
        <div className="text-right shrink-0 ml-4">
          <span className="text-xs text-muted-foreground">Total vendas</span>
          <p className="font-bold text-sm money">{formatCurrency(register.totalSales)}</p>
          <p className="text-xs text-muted-foreground">{register.salesCount} vendas</p>
        </div>
        {register.closedAt && (
          <div onClick={(e) => e.stopPropagation()} className="ml-2 shrink-0">
            <NfceCaixaButton cashRegisterId={register.id} />
          </div>
        )}
      </button>

      {open && (
        <div className="border-t border-border bg-muted/20 px-5 py-4">
          {isFetching ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando produtos...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto vendido neste caixa.</p>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                <span>Produto</span>
                <span className="text-right">Categoria</span>
                <span className="text-right">Qtd</span>
                <span className="text-right">Total</span>
              </div>
              <div className="space-y-1">
                {products.map((p: any) => (
                  <div key={p.productId} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center bg-white rounded-lg px-3 py-2.5 text-sm border border-border/50">
                    <span className="font-medium truncate">{p.name}</span>
                    <span className="text-muted-foreground text-xs text-right">{p.category || '—'}</span>
                    <span className="text-right tabular-nums">
                      {p.unit === 'kg' || p.unit === 'L'
                        ? `${Number(p.quantity).toFixed(3)} ${p.unit}`
                        : `${Number(p.quantity).toFixed(0)} un`}
                    </span>
                    <span className="text-right font-semibold money">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-border">
                <span className="text-sm font-bold money">{formatCurrency(totalRevenue)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ProductsByCashRegister({ registers }: { registers: any[] }) {
  if (registers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Nenhum caixa encontrado no período
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {registers.map((r) => (
        <CashRegisterProductsRow key={r.id} register={r} />
      ))}
    </div>
  )
}

function CashRegisterAudit({ registers }: { registers: any[] }) {
  if (registers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Nenhum caixa encontrado no período
        </CardContent>
      </Card>
    )
  }

  const totalDiff = registers
    .filter((r) => r.difference !== null)
    .reduce((s, r) => s + r.difference, 0)

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Caixas no período</p>
          <p className="text-2xl font-bold">{registers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Caixas em aberto</p>
          <p className="text-2xl font-bold text-amber-500">
            {registers.filter((r) => !r.closedAt).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Diferença acumulada</p>
          <p className={`text-2xl font-bold money ${totalDiff === 0 ? 'text-success' : 'text-destructive'}`}>
            {totalDiff >= 0 ? '+' : ''}{formatCurrency(totalDiff)}
          </p>
        </div>
      </div>

      {/* Tabela */}
      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Caixa</Th>
              <Th>Operador</Th>
              <Th>Abertura</Th>
              <Th>Fechamento</Th>
              <Th className="text-right">Saldo abertura</Th>
              <Th className="text-right">Vendas (dinheiro)</Th>
              <Th className="text-right">Esperado</Th>
              <Th className="text-right">Contado</Th>
              <Th className="text-right">Diferença</Th>
              <Th>Status</Th>
              <Th>NF-e</Th>
            </tr>
          </Thead>
          <Tbody>
            {registers.map((r) => (
              <Tr key={r.id}>
                <Td className="font-medium">#{r.id}</Td>
                <Td>{r.operator}</Td>
                <Td className="text-xs">{new Date(r.openedAt).toLocaleString('pt-BR')}</Td>
                <Td className="text-xs">
                  {r.closedAt ? new Date(r.closedAt).toLocaleString('pt-BR') : '—'}
                </Td>
                <Td className="text-right money">{formatCurrency(r.openingBalance)}</Td>
                <Td className="text-right money">{formatCurrency(r.cashIn)}</Td>
                <Td className="text-right money font-medium">{formatCurrency(r.expectedClosing)}</Td>
                <Td className="text-right money">
                  {r.closingBalance !== null ? formatCurrency(r.closingBalance) : '—'}
                </Td>
                <Td className="text-right">
                  {r.difference !== null ? (
                    <span className={`money font-semibold ${r.difference === 0 ? 'text-success' : 'text-destructive'}`}>
                      {r.difference >= 0 ? '+' : ''}{formatCurrency(r.difference)}
                    </span>
                  ) : '—'}
                </Td>
                <Td>
                  {!r.closedAt ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <Clock size={12} /> Aberto
                    </span>
                  ) : r.difference === 0 ? (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 size={12} /> OK
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle size={12} /> Divergência
                    </span>
                  )}
                </Td>
                <Td>
                  {r.closedAt && <NfceCaixaButton cashRegisterId={r.id} />}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {/* Detalhe por método */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas por forma de pagamento no período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(
              registers.reduce((acc, r) => {
                Object.entries(r.byMethod || {}).forEach(([m, v]: any) => {
                  acc[m] = (acc[m] || 0) + v
                })
                return acc
              }, {} as Record<string, number>)
            ).map(([method, amount]: any) => (
              <div key={method} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{METHOD_LABELS[method] || method}</span>
                <span className="font-semibold money">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
