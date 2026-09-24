'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Customer } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  customer?: Customer | null
  onSuccess: () => void
}

export function CustomerForm({ customer, onSuccess }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: customer || {},
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      customer ? api.patch(`/customers/${customer.id}`, data) : api.post('/customers', data),
    onSuccess,
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <Input label="Nome *" {...register('name')} error={errors.name?.message} />

      <div className="grid grid-cols-2 gap-4">
        <Input label="CPF" {...register('cpf')} placeholder="000.000.000-00" />
        <Input label="Telefone" {...register('phone')} placeholder="(00) 00000-0000" />
      </div>

      <Input label="E-mail" type="email" {...register('email')} error={errors.email?.message} />
      <Input label="Endereço" {...register('address')} />

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
          {customer ? 'Salvar alterações' : 'Cadastrar cliente'}
        </Button>
      </div>
    </form>
  )
}
