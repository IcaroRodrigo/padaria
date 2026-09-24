'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Expense } from '@/types'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const schema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.coerce.number().min(0.01, 'Valor inválido'),
  categoryId: z.coerce.number().min(1, 'Categoria é obrigatória'),
  type: z.enum(['FIXED', 'VARIABLE']),
  status: z.enum(['PENDING', 'PAID']).optional(),
  dueDate: z.string().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
  recurrenceDay: z.coerce.number().min(1).max(31).optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface Props {
  expense?: Expense | null
  onSuccess: () => void
}

export function ExpenseForm({ expense, onSuccess }: Props) {
  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => api.get('/expenses/categories').then((r) => r.data),
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: expense
      ? {
          description: expense.description,
          amount: Number(expense.amount),
          categoryId: expense.category.id,
          type: expense.type,
          status: expense.status,
          dueDate: expense.dueDate ? new Date(expense.dueDate).toISOString().split('T')[0] : '',
          paidAt: expense.paidAt ? new Date(expense.paidAt).toISOString().split('T')[0] : '',
          notes: expense.notes || '',
          recurrenceDay: expense.recurrenceDay ?? undefined,
        }
      : { type: 'VARIABLE', status: 'PENDING' },
  })

  const selectedType = watch('type')
  const recurrenceDay = watch('recurrenceDay')

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        dueDate: data.dueDate || undefined,
        paidAt: data.paidAt || undefined,
        notes: data.notes || undefined,
        recurrenceDay: data.recurrenceDay || null,
      }
      return expense ? api.patch(`/expenses/${expense.id}`, payload) : api.post('/expenses', payload)
    },
    onSuccess,
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <Input
        label="Descrição *"
        {...register('description')}
        error={errors.description?.message}
        placeholder="Ex: Aluguel"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor (R$) *"
          type="number"
          step="0.01"
          min="0"
          {...register('amount')}
          error={errors.amount?.message}
        />
        <Select
          label="Categoria *"
          {...register('categoryId')}
          options={categories.map((c: any) => ({ value: c.id, label: c.name }))}
          placeholder="Selecione..."
          error={errors.categoryId?.message}
        />
        <Select
          label="Tipo *"
          {...register('type')}
          options={[
            { value: 'FIXED', label: 'Fixa' },
            { value: 'VARIABLE', label: 'Variável' },
          ]}
        />
        <Select
          label="Status"
          {...register('status')}
          options={[
            { value: 'PENDING', label: 'A pagar' },
            { value: 'PAID', label: 'Pago' },
          ]}
        />
        <Input label="Data de vencimento" type="date" {...register('dueDate')} />
        <Input label="Data de pagamento" type="date" {...register('paidAt')} />
      </div>

      {selectedType === 'FIXED' && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-primary"
              checked={!!recurrenceDay}
              onChange={(e) => {
                setValue('recurrenceDay', e.target.checked ? 5 : null, { shouldValidate: true })
              }}
            />
            <span className="text-sm font-medium text-primary">Repetir automaticamente todo mês</span>
          </label>
          {!!recurrenceDay && (
            <div className="flex items-center gap-2 pl-6">
              <span className="text-sm text-muted-foreground">Todo dia</span>
              <input
                type="number"
                min={1}
                max={31}
                {...register('recurrenceDay')}
                className="w-16 px-2 py-1 text-sm rounded border border-input bg-white text-center focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">de cada mês</span>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">Observações</label>
        <textarea
          {...register('notes')}
          rows={2}
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {mutation.isError && (
        <p className="text-destructive text-sm">
          {(mutation.error as any)?.response?.data?.message || 'Erro ao salvar'}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={mutation.isPending}>
          {expense ? 'Salvar alterações' : 'Registrar despesa'}
        </Button>
      </div>
    </form>
  )
}
