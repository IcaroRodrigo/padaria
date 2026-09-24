'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Product, Category } from '@/types'
import { calcMargin } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CurrencyInput } from '@/components/ui/currency-input'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  categoryId: z.coerce.number().min(1, 'Categoria é obrigatória'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  costPrice: z.number().min(0, 'Preço inválido'),
  salePrice: z.number().min(0.01, 'Preço inválido'),
  barcode: z.string().optional(),
  plu: z.coerce.number().transform((v) => v || undefined).optional(),
  supplierId: z.coerce.number().transform((v) => v || undefined).optional(),
  expirationDate: z.string().optional(),
  stockQty: z.coerce.number().optional(),
  minStockQty: z.coerce.number().optional(),
})

type FormData = z.infer<typeof schema>

interface ProductFormProps {
  product?: Product | null
  categories: Category[]
  onSuccess: () => void
}

const UNITS = [
  { value: 'kg', label: 'Kg (quilograma)' },
  { value: 'g', label: 'g (grama)' },
  { value: 'unidade', label: 'Unidade' },
  { value: 'litro', label: 'Litro' },
  { value: 'ml', label: 'ml (mililitro)' },
  { value: 'cx', label: 'Caixa' },
  { value: 'pct', label: 'Pacote' },
]

export function ProductForm({ product, categories, onSuccess }: ProductFormProps) {
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then((r) => r.data),
  })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description || '',
          categoryId: product.category.id,
          unit: product.unit,
          costPrice: Number(product.costPrice),
          salePrice: Number(product.salePrice),
          barcode: product.barcode || '',
          plu: product.plu ?? undefined,
          supplierId: product.supplier?.id,
          expirationDate: product.expirationDate
            ? new Date(product.expirationDate).toISOString().split('T')[0]
            : '',
          stockQty: product.stockQty ? Number(product.stockQty) : undefined,
          minStockQty: product.minStockQty ? Number(product.minStockQty) : undefined,
        }
      : {},
  })

  const costPrice = watch('costPrice')
  const salePrice = watch('salePrice')
  const margin = calcMargin(Number(costPrice) || 0, Number(salePrice) || 0)

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      product
        ? api.patch(`/products/${product.id}`, data)
        : api.post('/products', data),
    onSuccess,
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            label="Nome do produto *"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Ex: Chá de Camomila"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1.5">Descrição</label>
          <textarea
            {...register('description')}
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none"
            placeholder="Descrição opcional..."
          />
        </div>

        <div>
          <Select
            label="Categoria *"
            {...register('categoryId')}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Selecione..."
            error={errors.categoryId?.message}
          />
        </div>

        <div>
          <Select
            label="Unidade de medida *"
            {...register('unit')}
            options={UNITS}
            placeholder="Selecione..."
            error={errors.unit?.message}
          />
        </div>

        <div>
          <Controller
            control={control}
            name="costPrice"
            render={({ field }) => (
              <CurrencyInput
                label="Preço de custo (R$) *"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.costPrice?.message}
              />
            )}
          />
        </div>

        <div>
          <Controller
            control={control}
            name="salePrice"
            render={({ field }) => (
              <CurrencyInput
                label="Preço de venda (R$) *"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.salePrice?.message}
              />
            )}
          />
        </div>

        {salePrice > 0 && costPrice >= 0 && (
          <div className="col-span-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-sm text-green-800">
              Margem de lucro:{' '}
              <strong>{margin.toFixed(1)}%</strong>
            </span>
          </div>
        )}

        <div>
          <Input
            label="Código de barras"
            {...register('barcode')}
            placeholder="EAN-13 ou interno"
          />
        </div>

        <div>
          <Input
            label="PLU (balança)"
            type="number"
            min="1"
            {...register('plu')}
            placeholder="Ex: 1"
          />
        </div>

        <div>
          <Input
            label="Data de validade"
            type="date"
            {...register('expirationDate')}
          />
        </div>

        <div>
          <Select
            label="Fornecedor"
            {...register('supplierId')}
            options={suppliers.map((s: any) => ({
              value: s.id,
              label: s.tradeName || s.companyName,
            }))}
            placeholder="Nenhum"
          />
        </div>

        <div>
          <Input
            label="Estoque atual"
            type="number"
            step="0.001"
            min="0"
            {...register('stockQty')}
            placeholder="0"
          />
        </div>

        <div>
          <Input
            label="Estoque mínimo"
            type="number"
            step="0.001"
            min="0"
            {...register('minStockQty')}
            placeholder="0"
          />
        </div>
      </div>

      {mutation.isError && (
        <div className="bg-red-50 border border-red-200 text-destructive text-sm rounded-lg px-4 py-3">
          {(mutation.error as any)?.response?.data?.message || 'Erro ao salvar produto'}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={mutation.isPending}>
          {product ? 'Salvar alterações' : 'Cadastrar produto'}
        </Button>
      </div>
    </form>
  )
}
