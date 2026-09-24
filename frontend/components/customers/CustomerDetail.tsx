'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function CustomerDetail({ customerId }: { customerId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => api.get(`/customers/${customerId}`).then((r) => r.data),
  })

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>
  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-primary/5 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary money">{formatCurrency(data.totalSpent)}</p>
          <p className="text-xs text-muted-foreground">Total gasto</p>
        </div>
        <div className="bg-primary/5 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary money">{formatCurrency(data.avgTicket)}</p>
          <p className="text-xs text-muted-foreground">Ticket médio</p>
        </div>
        <div className="bg-primary/5 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{data.totalSales}</p>
          <p className="text-xs text-muted-foreground">Compras</p>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {data.cpf && <div><span className="text-muted-foreground">CPF:</span> <span className="font-mono">{data.cpf}</span></div>}
        {data.phone && <div><span className="text-muted-foreground">Tel:</span> {data.phone}</div>}
        {data.email && <div className="col-span-2"><span className="text-muted-foreground">E-mail:</span> {data.email}</div>}
        {data.address && <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span> {data.address}</div>}
      </div>

      {/* Purchase history */}
      <div>
        <h4 className="font-semibold text-sm mb-2">Histórico de Compras</h4>
        {data.sales.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem compras registradas</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.sales.map((sale: any) => (
              <div key={sale.id} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDateTime(sale.createdAt)}</span>
                  <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'destructive'}>
                    {sale.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                  </Badge>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm">{sale.items.length} iten{sale.items.length !== 1 ? 's' : ''}</span>
                  <span className="font-semibold money">{formatCurrency(sale.finalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
