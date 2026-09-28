'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCurrency, formatDate, isExpiringSoon } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  Package,
  PackageX,
  DollarSign,
} from 'lucide-react'

function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api.get('/dashboard/overview').then((r) => r.data),
    refetchInterval: 60 * 1000,
    retry: 1,
  })
}

function localDateStr(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function useMonthlyRevenue() {
  const now = new Date()
  const end = localDateStr(now)
  const start = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29))
  return useQuery({
    queryKey: ['dashboard', 'revenue', start, end],
    queryFn: () =>
      api.get('/dashboard/revenue', { params: { startDate: start, endDate: end, groupBy: 'day' } }).then((r) => r.data),
  })
}

type TicketPeriod = 'today' | 'week' | 'month' | 'last3months'

const TICKET_PERIOD_LABELS: Record<TicketPeriod, string> = {
  today: 'Hoje',
  week: 'Esta semana',
  month: 'Este mês',
  last3months: 'Últimos 3 meses',
}

function TicketMedioCard({ overview }: { overview: any }) {
  const [period, setPeriod] = useState<TicketPeriod>('today')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const avgTicket = overview?.[period]?.avgTicket ?? 0

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-5 relative" ref={ref}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">Ticket Médio</p>
          <p className="text-2xl font-bold mt-1 money">{formatCurrency(avgTicket)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{TICKET_PERIOD_LABELS[period]}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
            title="Selecionar período"
          >
            <Calendar className="w-5 h-5 text-primary" />
          </button>
        </div>
      </div>
      {open && (
        <div className="absolute right-4 top-14 z-10 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
          {(Object.keys(TICKET_PERIOD_LABELS) as TicketPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setOpen(false) }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${period === p ? 'font-semibold text-primary' : 'text-foreground'}`}
            >
              {TICKET_PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { data: overview, isLoading, isError } = useDashboardOverview()
  const { data: revenueData } = useMonthlyRevenue()

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <p className="font-medium text-destructive">Não foi possível carregar o dashboard</p>
        <p className="text-sm text-muted-foreground">Verifique a conexão com o servidor e recarregue a página.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Visão geral do negócio — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Faturamento Hoje"
          value={formatCurrency(overview?.today?.revenue || 0)}
          subtitle={`${overview?.today?.salesCount || 0} vendas`}
          icon={TrendingUp}
          iconColor="text-primary"
        />
        <TicketMedioCard overview={overview} />
        <StatCard
          title="Faturamento Semana"
          value={formatCurrency(overview?.week?.revenue || 0)}
          subtitle={`${overview?.week?.salesCount || 0} vendas — seg a hoje`}
          icon={Calendar}
          iconColor="text-accent"
        />
        <StatCard
          title="Faturamento Mês"
          value={formatCurrency(overview?.month?.revenue || 0)}
          subtitle={`${overview?.month?.salesCount || 0} vendas`}
          icon={TrendingUp}
          iconColor="text-primary"
        />
        <StatCard
          title="Lucro Hoje"
          value={formatCurrency(overview?.today?.profit ?? 0)}
          subtitle={overview?.today?.margin != null ? `${overview.today.margin.toFixed(1)}% de margem` : '—'}
          icon={DollarSign}
          iconColor="text-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Faturamento — Últimos 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData && revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2d9c5" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6b6b6b' }}
                    tickFormatter={(v) => {
                      const d = new Date(v + 'T12:00:00')
                      return `${d.getDate()}/${d.getMonth() + 1}`
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b6b6b' }}
                    tickFormatter={(v) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v}`}
                    width={65}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), 'Faturamento']}
                    labelFormatter={(l) => {
                      const d = new Date(l + 'T12:00:00')
                      return d.toLocaleDateString('pt-BR')
                    }}
                  />
                  <Bar dataKey="revenue" fill="#4a7c2f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Produtos (mês)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview?.topProducts?.length > 0 ? (
              overview.topProducts.map((p: any, i: number) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(p.quantity).toFixed(2)} {p.unit}
                    </p>
                  </div>
                  <span className="text-sm font-semibold money shrink-0">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Sem vendas este mês</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low stock products */}
      {overview?.lowStockProducts?.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageX className="w-4 h-4 text-destructive" />
              Estoque Baixo — Produtos Unitários
              <span className="ml-auto text-sm font-normal text-destructive">
                {overview.lowStockProducts.length} produto{overview.lowStockProducts.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {overview.lowStockProducts.map((p: any) => {
                const qty = Number(p.stockQty ?? 0)
                const min = Number(p.minStockQty ?? 5)
                const semEstoque = qty === 0
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      semEstoque
                        ? 'bg-red-50 border-red-300'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <PackageX className={`w-4 h-4 shrink-0 ${semEstoque ? 'text-red-600' : 'text-orange-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className={`text-xs ${semEstoque ? 'text-red-600' : 'text-orange-600'}`}>
                        {semEstoque ? 'Sem estoque' : `${qty} ${p.unit} (mín: ${min})`}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      semEstoque ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {qty}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring products */}
      {overview?.expiringProducts?.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Produtos com Vencimento Próximo (≤ 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {overview.expiringProducts.map((p: any) => {
                const daysLeft = Math.ceil(
                  (new Date(p.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                )
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200"
                  >
                    <Package className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-amber-600">
                        Vence em {daysLeft} dia{daysLeft !== 1 ? 's' : ''} — {formatDate(p.expirationDate)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
