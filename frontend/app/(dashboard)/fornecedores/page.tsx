'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Supplier } from '@/types'
import { formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table'
import { Modal } from '@/components/ui/modal'
import { SupplierForm } from '@/components/suppliers/SupplierForm'
import { Plus, Search, Edit, Package } from 'lucide-react'

export default function FornecedoresPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [viewing, setViewing] = useState<Supplier | null>(null)

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers', search],
    queryFn: () =>
      api.get('/suppliers', { params: { search: search || undefined } }).then((r) => r.data),
  })

  const handleClose = () => { setEditing(null); setShowModal(false) }

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Fornecedores"
        description={`${suppliers.length} fornecedores cadastrados`}
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Novo Fornecedor
          </Button>
        }
      />

      <div className="mb-6">
        <Input
          placeholder="Buscar por nome, razão social ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
          className="max-w-sm"
        />
      </div>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Empresa</Th>
              <Th>CNPJ</Th>
              <Th>Telefone</Th>
              <Th>E-mail</Th>
              <Th>Entrega (dias)</Th>
              <Th>Cadastro</Th>
              <Th></Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr><Td colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</Td></Tr>
            ) : suppliers.length === 0 ? (
              <Tr><Td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum fornecedor encontrado</Td></Tr>
            ) : (
              suppliers.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <div className="font-medium">{s.companyName}</div>
                    {s.tradeName && s.tradeName !== s.companyName && (
                      <div className="text-xs text-muted-foreground">{s.tradeName}</div>
                    )}
                  </Td>
                  <Td className="font-mono text-sm">{s.cnpj || '—'}</Td>
                  <Td>{s.phone || '—'}</Td>
                  <Td>{s.email || '—'}</Td>
                  <Td>{s.deliveryDays ? `${s.deliveryDays} dias` : '—'}</Td>
                  <Td>{formatDate(s.createdAt)}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditing(s); setShowModal(true) }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit size={15} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      <Modal open={showModal} onClose={handleClose} title={editing ? 'Editar Fornecedor' : 'Novo Fornecedor'} size="lg">
        <SupplierForm
          supplier={editing}
          onSuccess={() => { handleClose(); qc.invalidateQueries({ queryKey: ['suppliers'] }) }}
        />
      </Modal>
    </div>
  )
}
