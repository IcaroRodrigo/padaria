'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Supplier } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  companyName: z.string().min(1, 'Razão social é obrigatória'),
  tradeName: z.string().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  deliveryDays: z.coerce.number().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  supplier?: Supplier | null
  onSuccess: () => void
}

export function SupplierForm({ supplier, onSuccess }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: supplier || {},
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      supplier ? api.patch(`/suppliers/${supplier.id}`, data) : api.post('/suppliers', data),
    onSuccess,
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Razão Social *" {...register('companyName')} error={errors.companyName?.message} />
        </div>
        <Input label="Nome Fantasia" {...register('tradeName')} />
        <Input label="CNPJ" {...register('cnpj')} placeholder="00.000.000/0000-00" />
        <Input label="Telefone" {...register('phone')} placeholder="(00) 00000-0000" />
        <Input label="E-mail" type="email" {...register('email')} error={errors.email?.message} />
        <div className="col-span-2">
          <Input label="Endereço" {...register('address')} />
        </div>
        <Input label="Prazo de entrega (dias)" type="number" min="0" {...register('deliveryDays')} />
      </div>

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
          {supplier ? 'Salvar alterações' : 'Cadastrar fornecedor'}
        </Button>
      </div>
    </form>
  )
}
