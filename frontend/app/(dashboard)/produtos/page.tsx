'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Product, Category } from '@/types'
import { formatCurrency, formatDate, isExpiringSoon, calcMargin } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table'
import { ProductForm } from '@/components/products/ProductForm'
import { StockEntryModal } from '@/components/products/StockEntryModal'
import { Modal } from '@/components/ui/modal'
import { Plus, Search, Edit, EyeOff, Eye, Scale, Download, Tag, Trash2, PackagePlus } from 'lucide-react'

export default function ProdutosPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [stockEntryProduct, setStockEntryProduct] = useState<Product | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = (products: Product[]) => {
    setSelectedIds(prev =>
      prev.size === products.length ? new Set() : new Set(products.map(p => p.id))
    )
  }

  const handleGerarEtiquetas = (products: Product[]) => {
    const selected = products.filter(p => selectedIds.has(p.id))
    if (selected.length === 0) return

    const labelsHtml = selected.map(p => {
      const price = Number(p.salePrice)
      const priceStr = `R$ ${price.toFixed(2).replace('.', ',')}/${p.unit}`
      const pluStr = p.plu ? String(p.plu).padStart(5, '0') : null
      return `
        <div class="label">
          <div class="name">${p.name}</div>
          <div class="price">${priceStr}</div>
          ${pluStr ? `<div class="code">Código: ${pluStr}</div>` : ''}
        </div>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Etiquetas — Casa Granella</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: white; }
    .toolbar {
      padding: 12px 16px; background: #f5f0e8;
      border-bottom: 1px solid #ddd;
      display: flex; align-items: center; gap: 12px;
    }
    .page {
      width: 210mm; padding: 10mm;
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm;
    }
    .label {
      border: 1px dashed #999; border-radius: 3mm;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 5mm 4mm; text-align: center;
      min-height: 54mm; page-break-inside: avoid;
    }
    .name { font-size: 16pt; font-weight: bold; line-height: 1.3; margin-bottom: 4mm; }
    .price { font-size: 13pt; font-weight: bold; color: #4a7c2f; margin-bottom: 3mm; }
    .code { font-size: 9pt; color: #555; font-family: monospace; letter-spacing: 0.5px; }
    @media print { .toolbar { display: none; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <span style="font-size:14px"><strong>Casa Granella</strong> — ${selected.length} etiqueta(s)</span>
    <button onclick="window.print()" style="background:#4a7c2f;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:bold">Imprimir</button>
    <button onclick="window.close()" style="background:#eee;border:1px solid #ccc;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px">Fechar</button>
  </div>
  <div class="page">${labelsHtml}</div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=960,height=720')
    if (win) { win.document.write(html); win.document.close() }
  }

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products', search, categoryId],
    queryFn: () =>
      api.get('/products', { params: { search: search || undefined, categoryId: categoryId || undefined } })
        .then((r) => r.data),
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then((r) => r.data),
  })

  const { data: pluInfo } = useQuery<{ lastPlu: number | null; nextPlu: number }>({
    queryKey: ['plu-next'],
    queryFn: () => api.get('/products/plu/next').then((r) => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (product: Product) =>
      api.patch(`/products/${product.id}`, { active: !product.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Erro ao excluir produto.')
    },
  })

  const handleDelete = (p: Product) => {
    if (!confirm(`Excluir "${p.name}" permanentemente? Esta ação não pode ser desfeita.`)) return
    deleteMutation.mutate(p.id)
  }

  const handleExportBalanca = async () => {
    const res = await api.get('/products/export/balanca', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'ITENSMGV.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleEdit = (p: Product) => {
    setEditing(p)
    setShowModal(true)
  }

  const handleClose = () => {
    setEditing(null)
    setShowModal(false)
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Produtos"
        description="Gerencie o catálogo de produtos da loja"
        action={
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button variant="outline" onClick={() => handleGerarEtiquetas(products)}>
                <Tag size={16} /> Gerar Etiquetas ({selectedIds.size})
              </Button>
            )}
            <Button variant="outline" onClick={handleExportBalanca}>
              <Scale size={16} /> Exportar Balança
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Plus size={16} /> Novo Produto
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Buscar por nome ou código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
            className="flex-1 min-w-[180px]"
          />
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Todas as categorias"
            className="min-w-[160px]"
          />
        </div>
        {pluInfo && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Último PLU usado: <strong className="text-foreground">{pluInfo.lastPlu ?? '—'}</strong></span>
            <span className="text-border hidden sm:inline">|</span>
            <span>Próximo PLU disponível: <strong className="text-primary">{pluInfo.nextPlu}</strong></span>
          </div>
        )}
      </div>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th className="w-8">
                <input
                  type="checkbox"
                  checked={products.length > 0 && selectedIds.size === products.length}
                  onChange={() => toggleSelectAll(products)}
                  className="cursor-pointer"
                />
              </Th>
              <Th>Produto</Th>
              <Th>Categoria</Th>
              <Th>Unid.</Th>
              <Th>PLU</Th>
              <Th className="text-right">Custo</Th>
              <Th className="text-right">Venda</Th>
              <Th className="text-right">Margem</Th>
              <Th>Validade</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={11} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </Td>
              </Tr>
            ) : products.length === 0 ? (
              <Tr>
                <Td colSpan={11} className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </Td>
              </Tr>
            ) : (
              products.map((p) => {
                const expiring = p.expirationDate ? isExpiringSoon(p.expirationDate) : false
                const margin = calcMargin(Number(p.costPrice), Number(p.salePrice))

                return (
                  <Tr key={p.id}>
                    <Td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="cursor-pointer"
                      />
                    </Td>
                    <Td>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        {p.barcode && (
                          <div className="text-xs text-muted-foreground font-mono">{p.barcode}</div>
                        )}
                      </div>
                    </Td>
                    <Td>{p.category.name}</Td>
                    <Td>{p.unit}</Td>
                    <Td>
                      {p.plu ? (
                        <span className="font-mono text-sm">{p.plu}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Td>
                    <Td className="text-right money">{formatCurrency(Number(p.costPrice))}</Td>
                    <Td className="text-right money font-semibold">{formatCurrency(Number(p.salePrice))}</Td>
                    <Td className="text-right">
                      <span className={margin >= 30 ? 'text-success font-medium' : margin >= 15 ? 'text-warning font-medium' : 'text-destructive font-medium'}>
                        {margin.toFixed(1)}%
                      </span>
                    </Td>
                    <Td>
                      {p.expirationDate ? (
                        <span className={expiring ? 'text-warning font-medium' : ''}>
                          {expiring && '⚠ '}{formatDate(p.expirationDate)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Td>
                    <Td>
                      <Badge variant={p.active ? 'success' : 'default'}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setStockEntryProduct(p)}
                          className="p-1.5 hover:bg-green-50 hover:text-primary rounded-lg transition"
                          title="Registrar entrada de estoque"
                        >
                          <PackagePlus size={15} />
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate(p)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                          title={p.active ? 'Desativar' : 'Ativar'}
                        >
                          {p.active ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 hover:bg-red-50 hover:text-destructive rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                )
              })
            )}
          </Tbody>
        </Table>
      </Card>

      <Modal
        open={showModal}
        onClose={handleClose}
        title={editing ? 'Editar Produto' : 'Novo Produto'}
        size="lg"
      >
        <ProductForm
          product={editing}
          categories={categories}
          onSuccess={() => {
            handleClose()
            qc.invalidateQueries({ queryKey: ['products'] })
            qc.invalidateQueries({ queryKey: ['plu-next'] })
          }}
        />
      </Modal>

      <StockEntryModal
        product={stockEntryProduct}
        onClose={() => setStockEntryProduct(null)}
      />
    </div>
  )
}
