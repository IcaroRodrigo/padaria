'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Expense } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table'
import { Modal } from '@/components/ui/modal'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { Plus, Edit, CheckCircle, Copy, RefreshCw } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDING', label: 'A pagar' },
  { value: 'PAID', label: 'Pago' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'FIXED', label: 'Fixas' },
  { value: 'VARIABLE', label: 'Variáveis' },
]

export default function DespesasPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses', status, type],
    queryFn: () =>
      api.get('/expenses', { params: { status: status || undefined, type: type || undefined } })
        .then((r) => r.data),
  })

  const payMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/expenses/${id}/pay`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })

  const generateMutation = useMutation({
    mutationFn: () => api.post('/expenses/generate-recurring'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })

  const duplicateMutation = useMutation({
    mutationFn: (expense: Expense) => {
      const sameExpenses = expenses.filter(
        (e) => e.description === expense.description && e.dueDate,
      )
      const latest = sameExpenses.reduce((max, e) =>
        new Date(e.dueDate!) > new Date(max.dueDate!) ? e : max,
        expense,
      )

      const nextMonth = latest.dueDate
        ? (() => {
            const d = new Date(latest.dueDate)
            const day = d.getUTCDate()
            const month = d.getUTCMonth() + 1
            const year = d.getUTCFullYear()
            const next = new Date(year, month, day)
            return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
          })()
        : undefined

      return api.post('/expenses', {
        description: expense.description,
        amount: Number(expense.amount),
        categoryId: expense.category.id,
        type: expense.type,
        status: 'PENDING',
        dueDate: nextMonth,
        notes: expense.notes || undefined,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })

  const handleClose = () => { setEditing(null); setShowModal(false) }

  const totalPending = expenses
    .filter((e) => e.status === 'PENDING')
    .reduce((s, e) => s + Number(e.amount), 0)

  const totalPaid = expenses
    .filter((e) => e.status === 'PAID')
    .reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Despesas"
        description="Controle de despesas fixas e variáveis"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => generateMutation.mutate()} loading={generateMutation.isPending} title="Gerar despesas recorrentes do mês atual">
              <RefreshCw size={16} /> Gerar recorrentes
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Plus size={16} /> Nova Despesa
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">A pagar</p>
          <p className="text-2xl font-bold text-destructive money">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Pago</p>
          <p className="text-2xl font-bold text-success money">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={STATUS_OPTIONS}
          className="max-w-[180px]"
        />
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={TYPE_OPTIONS}
          className="max-w-[180px]"
        />
      </div>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Descrição</Th>
              <Th>Categoria</Th>
              <Th>Tipo</Th>
              <Th>Vencimento</Th>
              <Th className="text-right">Valor</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr><Td colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</Td></Tr>
            ) : expenses.length === 0 ? (
              <Tr><Td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma despesa encontrada</Td></Tr>
            ) : (
              expenses.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-medium">
                    <span className="flex items-center gap-1.5">
                      {e.description}
                      {e.recurrenceDay && (
                        <span title={`Repete todo dia ${e.recurrenceDay}`} className="text-primary">
                          <RefreshCw size={12} />
                        </span>
                      )}
                      {e.generatedFromId && (
                        <span title="Gerada automaticamente" className="text-muted-foreground">
                          <RefreshCw size={12} />
                        </span>
                      )}
                    </span>
                  </Td>
                  <Td>{e.category.name}</Td>
                  <Td>
                    <Badge variant={e.type === 'FIXED' ? 'default' : 'golden'}>
                      {e.type === 'FIXED' ? 'Fixa' : 'Variável'}
                    </Badge>
                  </Td>
                  <Td>{e.dueDate ? formatDate(e.dueDate) : '—'}</Td>
                  <Td className="text-right money font-semibold">{formatCurrency(Number(e.amount))}</Td>
                  <Td>
                    <Badge variant={e.status === 'PAID' ? 'success' : 'warning'}>
                      {e.status === 'PAID' ? 'Pago' : 'A pagar'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditing(e); setShowModal(true) }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit size={15} />
                      </button>
                      {e.status === 'PENDING' && (
                        <button
                          onClick={() => payMutation.mutate(e.id)}
                          className="p-1.5 hover:bg-green-50 hover:text-success rounded-lg transition"
                          title="Marcar como pago"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {e.type === 'FIXED' && !e.recurrenceDay && !e.generatedFromId && (
                        <button
                          onClick={() => duplicateMutation.mutate(e)}
                          className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                          title="Duplicar para próximo mês"
                          disabled={duplicateMutation.isPending}
                        >
                          <Copy size={15} />
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      <Modal open={showModal} onClose={handleClose} title={editing ? 'Editar Despesa' : 'Nova Despesa'}>
        <ExpenseForm
          expense={editing}
          onSuccess={() => { handleClose(); qc.invalidateQueries({ queryKey: ['expenses'] }) }}
        />
      </Modal>
    </div>
  )
}
