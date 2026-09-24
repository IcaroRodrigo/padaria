'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CheckCircle2, Settings2, Download, Receipt, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { PasswordCriteria, senhaValida } from '@/components/ui/PasswordCriteria'
import { useAuthStore } from '@/store/auth'

const FOCUSNFE_AMBIENTES = [
  { value: 'homologacao', label: 'Homologação (testes, sem valor fiscal)' },
  { value: 'producao', label: 'Produção (notas reais)' },
]

const REGIMES_TRIBUTARIOS = [
  { value: '1', label: '1 — Simples Nacional' },
  { value: '2', label: '2 — Simples Nacional — Excesso de Sublimite' },
  { value: '3', label: '3 — Regime Normal' },
]

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave aleatória' },
]

const SCALE_FORMATS = [
  { value: 'price', label: 'Preço (Toledo/Filizola padrão)' },
  { value: 'weight', label: 'Peso em gramas (Urano/outros)' },
]

function PasswordFieldInline({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
        <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function ConfiguracoesPage() {
  const qc = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [saved, setSaved] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // ── Alterar senha ─────────────────────────────────────────────────────────
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')
  const [senhaFeedback, setSenhaFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  const trocarSenha = useMutation({
    mutationFn: () => api.patch('/auth/change-password', { senhaAtual, novaSenha }),
    onSuccess: () => {
      setSenhaAtual(''); setNovaSenha(''); setConfirmSenha('')
      setSenhaFeedback({ ok: true, msg: 'Senha alterada com sucesso.' })
      setTimeout(() => setSenhaFeedback(null), 4000)
    },
    onError: (err: any) => {
      setSenhaFeedback({ ok: false, msg: err?.response?.data?.message ?? 'Erro ao alterar senha.' })
      setTimeout(() => setSenhaFeedback(null), 5000)
    },
  })

  const handleTrocarSenha = () => {
    if (!senhaAtual || !novaSenha) { setSenhaFeedback({ ok: false, msg: 'Preencha todos os campos.' }); return }
    if (!senhaValida(novaSenha)) { setSenhaFeedback({ ok: false, msg: 'A nova senha não atende todos os critérios de segurança.' }); return }
    if (novaSenha !== confirmSenha) { setSenhaFeedback({ ok: false, msg: 'As senhas não coincidem.' }); return }
    trocarSenha.mutate()
  }

  const handleDownloadAgent = async () => {
    setDownloading(true)
    try {
      const response = await api.get('/downloads/agent-impressora', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = 'agent_impressora.exe'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
  })

  const [form, setForm] = useState<Record<string, string>>({})

  // Merge settings into form when loaded
  const getValue = (key: string, fallback = '') =>
    form[key] !== undefined ? form[key] : (settings[key] ?? fallback)

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) => api.put('/settings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      setForm({})
    },
  })

  const handleSave = () => {
    const payload: Record<string, string> = {}
    const keys = [
      'store_name', 'store_city',
      'pix_key', 'pix_key_type', 'pix_merchant_name',
      'scale_format', 'scale_plu_digits', 'scale_value_digits',
      'focusnfe_token', 'focusnfe_ambiente',
      'fiscal_cnpj', 'fiscal_ie', 'fiscal_regime',
      'fiscal_razao_social', 'fiscal_nome_fantasia',
      'fiscal_logradouro', 'fiscal_numero', 'fiscal_bairro',
      'fiscal_municipio', 'fiscal_uf', 'fiscal_cep', 'fiscal_telefone',
      'fiscal_ncm_padrao', 'fiscal_csosn',
      'email_contador',
    ]
    keys.forEach((k) => {
      const val = getValue(k)
      if (val !== undefined && val !== '') payload[k] = val
    })
    mutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">Dados da loja, PIX e balança</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Loja */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Dados da Loja
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Nome da loja"
                value={getValue('store_name')}
                onChange={(e) => set('store_name', e.target.value)}
                placeholder="Nome da sua loja"
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Cidade (para QR Code PIX)"
                value={getValue('store_city')}
                onChange={(e) => set('store_city', e.target.value)}
                placeholder="Ex: SAO PAULO"
              />
            </div>
          </div>
        </section>

        {/* PIX */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            PIX
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                label="Tipo de chave PIX"
                value={getValue('pix_key_type', 'cpf')}
                onChange={(e) => set('pix_key_type', e.target.value)}
                options={PIX_KEY_TYPES}
              />
            </div>
            <div>
              <Input
                label="Chave PIX"
                value={getValue('pix_key')}
                onChange={(e) => set('pix_key', e.target.value)}
                placeholder="CPF, e-mail, telefone ou chave"
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Nome no QR Code (até 25 caracteres)"
                value={getValue('pix_merchant_name')}
                onChange={(e) => set('pix_merchant_name', e.target.value.slice(0, 25))}
                placeholder="Nome da loja (sem acentos)"
              />
            </div>
          </div>
        </section>

        {/* Balança */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Balança
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Configure o formato das etiquetas geradas pela balança (EAN-13 iniciados com "2").
            A maioria das balanças Toledo/Filizola usa o formato Preço.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Select
                label="Formato do valor codificado"
                value={getValue('scale_format', 'price')}
                onChange={(e) => set('scale_format', e.target.value)}
                options={SCALE_FORMATS}
              />
            </div>
            <div>
              <Input
                label="Dígitos do PLU"
                type="number"
                min="1"
                max="7"
                value={getValue('scale_plu_digits', '5')}
                onChange={(e) => set('scale_plu_digits', e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Dígitos do valor"
                type="number"
                min="1"
                max="7"
                value={getValue('scale_value_digits', '5')}
                onChange={(e) => set('scale_value_digits', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Agente de Impressão */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Agente de Impressão
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            O agente local é necessário para imprimir cupons na impressora Bematech MP-4200 HS.
            Instale e execute no computador do caixa.
          </p>
          <Button
            variant="outline"
            onClick={handleDownloadAgent}
            loading={downloading}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Baixar agent_impressora.exe
          </Button>
        </section>

        {/* Fiscal / NFC-e */}
        {<section>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Fiscal / NFC-e
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Configure os dados para emissão de NFC-e via FocusNFE. Obtenha seu token em{' '}
            <span className="font-medium">focusnfe.com.br</span>. Mantenha em
            &quot;Homologação&quot; durante os testes.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Select
                label="Ambiente"
                value={getValue('focusnfe_ambiente', 'homologacao')}
                onChange={(e) => set('focusnfe_ambiente', e.target.value)}
                options={FOCUSNFE_AMBIENTES}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Token FocusNFE"
                type="password"
                value={getValue('focusnfe_token')}
                onChange={(e) => set('focusnfe_token', e.target.value)}
                placeholder="Token de autenticação FocusNFE"
              />
            </div>

            <div className="col-span-2 border-t border-border pt-4 mt-1">
              <p className="text-xs font-medium text-muted-foreground mb-3">Dados da empresa emitente</p>
            </div>

            <div className="col-span-2">
              <Input
                label="Razão Social"
                value={getValue('fiscal_razao_social')}
                onChange={(e) => set('fiscal_razao_social', e.target.value)}
                placeholder="NOME DA EMPRESA COMERCIO LTDA"
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Nome Fantasia"
                value={getValue('fiscal_nome_fantasia')}
                onChange={(e) => set('fiscal_nome_fantasia', e.target.value)}
                placeholder="Nome fantasia da loja"
              />
            </div>
            <div>
              <Input
                label="CNPJ"
                value={getValue('fiscal_cnpj')}
                onChange={(e) => set('fiscal_cnpj', e.target.value)}
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div>
              <Input
                label="Inscrição Estadual"
                value={getValue('fiscal_ie')}
                onChange={(e) => set('fiscal_ie', e.target.value)}
                placeholder="000.00000-00"
              />
            </div>
            <div className="col-span-2">
              <Select
                label="Regime Tributário"
                value={getValue('fiscal_regime', '1')}
                onChange={(e) => set('fiscal_regime', e.target.value)}
                options={REGIMES_TRIBUTARIOS}
              />
            </div>

            <div className="col-span-2 border-t border-border pt-4 mt-1">
              <p className="text-xs font-medium text-muted-foreground mb-3">Endereço do estabelecimento</p>
            </div>

            <div className="col-span-2">
              <Input
                label="Logradouro"
                value={getValue('fiscal_logradouro')}
                onChange={(e) => set('fiscal_logradouro', e.target.value)}
                placeholder="Rua das Flores"
              />
            </div>
            <div>
              <Input
                label="Número"
                value={getValue('fiscal_numero')}
                onChange={(e) => set('fiscal_numero', e.target.value)}
                placeholder="123"
              />
            </div>
            <div>
              <Input
                label="Bairro"
                value={getValue('fiscal_bairro')}
                onChange={(e) => set('fiscal_bairro', e.target.value)}
                placeholder="Centro"
              />
            </div>
            <div>
              <Input
                label="Município"
                value={getValue('fiscal_municipio', '')}
                onChange={(e) => set('fiscal_municipio', e.target.value)}
                placeholder="Município"
              />
            </div>
            <div>
              <Input
                label="UF"
                value={getValue('fiscal_uf', 'PR')}
                onChange={(e) => set('fiscal_uf', e.target.value.toUpperCase().slice(0, 2))}
                placeholder="PR"
              />
            </div>
            <div>
              <Input
                label="CEP"
                value={getValue('fiscal_cep')}
                onChange={(e) => set('fiscal_cep', e.target.value)}
                placeholder="83400-000"
              />
            </div>
            <div>
              <Input
                label="Telefone"
                value={getValue('fiscal_telefone')}
                onChange={(e) => set('fiscal_telefone', e.target.value)}
                placeholder="(41) 99999-9999"
              />
            </div>

            <div className="col-span-2 border-t border-border pt-4 mt-1">
              <p className="text-xs font-medium text-muted-foreground mb-3">Tributação (avançado)</p>
            </div>

            <div>
              <Input
                label="NCM padrão"
                value={getValue('fiscal_ncm_padrao', '21069090')}
                onChange={(e) => set('fiscal_ncm_padrao', e.target.value)}
                placeholder="21069090"
              />
            </div>
            <div>
              <Input
                label="CSOSN (Simples Nacional)"
                value={getValue('fiscal_csosn', '400')}
                onChange={(e) => set('fiscal_csosn', e.target.value)}
                placeholder="400"
              />
            </div>
          </div>
        </section>}

        {/* E-mail */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              E-mail / Contador
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            O XML de cada NFC-e autorizada é enviado automaticamente para este endereço.
          </p>
          <div>
            <Input
              label="E-mail do contador"
              type="text"
              value={getValue('email_contador', 'icaro.rodrigo@gmail.com')}
              onChange={(e) => set('email_contador', e.target.value)}
              placeholder="contador@escritorio.com.br, outro@email.com"
            />
            <p className="text-xs text-muted-foreground mt-1">Separe múltiplos e-mails por vírgula.</p>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-4 pt-2">
          <Button onClick={handleSave} loading={mutation.isPending}>
            Salvar configurações
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 size={16} />
              Salvo com sucesso
            </span>
          )}
          {mutation.isError && (
            <span className="text-sm text-destructive">
              {(mutation.error as any)?.response?.data?.message || 'Erro ao salvar'}
            </span>
          )}
        </div>

        {/* ── Alterar Senha ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Alterar Senha
            </h2>
          </div>

          <div className="max-w-sm space-y-3">
            <PasswordFieldInline label="Senha atual" value={senhaAtual} onChange={setSenhaAtual} />

            <div>
              <PasswordFieldInline
                label="Nova senha"
                value={novaSenha}
                onChange={setNovaSenha}
                placeholder="Mínimo 8 caracteres"
              />
              <PasswordCriteria senha={novaSenha} />
            </div>

            <PasswordFieldInline label="Confirmar nova senha" value={confirmSenha} onChange={setConfirmSenha} />

            {senhaFeedback && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                senhaFeedback.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {senhaFeedback.ok
                  ? <CheckCircle className="w-4 h-4 shrink-0" />
                  : <AlertCircle className="w-4 h-4 shrink-0" />
                }
                {senhaFeedback.msg}
              </div>
            )}

            <Button
              onClick={handleTrocarSenha}
              loading={trocarSenha.isPending}
              variant="outline"
            >
              Alterar senha
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
