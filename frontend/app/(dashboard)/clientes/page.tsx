'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Customer } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table'
import { Modal } from '@/components/ui/modal'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { CustomerDetail } from '@/components/customers/CustomerDetail'
import { Plus, Search, Edit, Eye } from 'lucide-react'

export default function ClientesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [viewing, setViewing] = useState<Customer | null>(null)

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers', search],
    queryFn: () =>
      api.get('/customers', { params: { search: search || undefined } }).then((r) => r.data),
  })

  const handleClose = () => {
    setEditing(null)
    setShowModal(false)
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Clientes"
        description={`${customers.length} clientes cadastrados`}
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Novo Cliente
          </Button>
        }
      />

      <div className="mb-6">
        <Input
          placeholder="Buscar por nome, CPF ou telefone..."
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
              <Th>Nome</Th>
              <Th>CPF</Th>
              <Th>Telefone</Th>
              <Th>E-mail</Th>
              <Th>Cadastro</Th>
              <Th></Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr><Td colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</Td></Tr>
            ) : customers.length === 0 ? (
              <Tr><Td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</Td></Tr>
            ) : (
              customers.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium">{c.name}</Td>
                  <Td className="font-mono text-sm">{c.cpf || '—'}</Td>
                  <Td>{c.phone || '—'}</Td>
                  <Td>{c.email || '—'}</Td>
                  <Td>{formatDate(c.createdAt)}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewing(c)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        title="Ver histórico"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => { setEditing(c); setShowModal(true) }}
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

      <Modal open={showModal} onClose={handleClose} title={editing ? 'Editar Cliente' : 'Novo Cliente'}>
        <CustomerForm
          customer={editing}
          onSuccess={() => { handleClose(); qc.invalidateQueries({ queryKey: ['customers'] }) }}
        />
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Perfil do Cliente" size="lg">
        {viewing && <CustomerDetail customerId={viewing.id} />}
      </Modal>
    </div>
  )
}
