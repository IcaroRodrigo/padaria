'use client'

import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, CheckCircle, ChevronLeft } from 'lucide-react'
import api from '@/lib/api'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Category } from '@/types'

const DEFAULT_CATEGORIES = [
  'Amanhecidos',
  'Biscoitos e Padaria Seca',
  'Bolos e Tortas',
  'Doces e Confeitaria',
  'Embutidos',
  'Frios e Laticínios',
  'Hortifruti',
  'Lanches',
  'Outros',
  'Pães',
  'Pães Doces',
  'Rotisseria',
  'Salgados',
]

interface ParsedProduct {
  plu: number
  name: string
  salePrice: number
  unit: 'kg' | 'un'
  categoryName: string
  selected: boolean
}

function guessCategory(name: string, unit: string): string {
  const n = name.toUpperCase().trim()

  if (n.includes('AMANHECIDO') || n.includes('AMANHECIDOS') || n.includes('SLGADOS AMANHECIDOS'))
    return 'Amanhecidos'

  if (
    /^X[ -](EGG|FRANGO|SALADA|BURGUER|TUDO|BACON|CALABRESA)/.test(n) ||
    ['BAURU', 'MISTO QUENTE', 'MISTO FRIO', 'DOGAO', 'HAMBURGAO', 'BEIRUTE',
      'PAO C/', 'PAO C MANT', 'PAO C OVO'].some(t => n.includes(t))
  ) return 'Lanches'

  if (
    ['COSTELA', 'LOMBO RECHEADO', 'ESPETINHO', 'SALPICAO', 'TENDER ASSADO',
      'AVE NATALINA', 'COXA SCOXA', 'COXA SOBRE COXA', 'RISOTO'].some(t => n.includes(t))
  ) return 'Rotisseria'

  if (
    unit === 'kg' &&
    ['BATATA', 'CEBOLA', 'CENOURA', 'LARANJA', 'BANANA', 'TOMATE', 'LIMAO']
      .some(t => n.startsWith(t))
  ) return 'Hortifruti'

  if (['MORTADELA', 'SALAME', 'LINGUICA', 'VINA'].some(t => n.includes(t)))
    return 'Embutidos'

  if (['PRESUNTO', 'PEITO DE PERU'].some(t => n.includes(t)) || n.startsWith('QUEIJO'))
    return 'Frios e Laticínios'

  if (['TORRADINHA', 'TORRADA', 'BOLACHA', 'BISCOITO'].some(t => n.includes(t)))
    return 'Biscoitos e Padaria Seca'

  if (
    ['PUDIM', 'MOUSSE', 'BRIGADEIRO', 'BEIJINHO', 'COCADA', 'CHURROS',
      'RABANADA', 'GELATINA', 'DOCE DE', 'BOMBOM', 'MORANGO DO AMOR',
      'PATINHA DE GATO', 'BATINHA DE GATO', 'LINGUA DE SOGRA', 'BOLO NO POTE',
      'BOLO GELADO', 'TOALHA FELPUDA', 'NESCAL', 'CAROLINA', 'DONUTS'].some(t => n.includes(t))
  ) return 'Doces e Confeitaria'

  if (
    ['COXINHA', 'EMPADA', 'EMPADINHA', 'EMPADAO', 'SFIHA', 'ESFIHA', 'RISOLES',
      'MINI PIZZA', 'PIZZA PEDACO', 'PIZZA BROTO', 'FOLHADO', 'FOLHADINHO',
      'VULCAO SALGADO', 'DOGUINHO', 'ENROLADINHO', 'MINI PASTEL', 'BOMBA',
      'BOLINHO', 'CANOLLI', 'MINI SALGAD', 'SALGADO', 'SALGADOS ASSADOS',
      'SALGADOS UNIDADE'].some(t => n.includes(t))
  ) return 'Salgados'

  if (
    ['CHOCOTONE', 'PANETONE', 'SONHO', 'CHINEQUE', 'PAO DE LEITE', 'PAO DE NINHO',
      'BROA', 'CROISSANT', 'ROCAMBOLE'].some(t => n.includes(t))
  ) return 'Pães Doces'

  if (
    n.startsWith('BOLO') || n.startsWith('TORTA') ||
    ['TORTELETE', 'BROWNIE', 'MARTA ROCHA', 'NEGA MALUKA', 'BANOFFEE', 'BANOFE',
      'PAVE', 'TORTINHA'].some(t => n.includes(t))
  ) return 'Bolos e Tortas'

  if (
    n.startsWith('PAO') || n.includes('PAO ') || n.startsWith('BAGUETE') ||
    n.includes('FARINHA DE ROSCA') || n.includes('FERMENTO')
  ) return 'Pães'

  return 'Outros'
}

function parseMGVLine(line: string): ParsedProduct | null {
  if (line.length < 20) return null
  const tipo = line[2]
  const plu = parseInt(line.substring(3, 9), 10)
  const priceRaw = parseInt(line.substring(9, 15), 10)
  const name = line.substring(18, 68).trim().replace(/\s{2,}/g, ' ')
  if (!name || isNaN(plu) || plu === 0 || isNaN(priceRaw)) return null
  if (/^\d+$/.test(name)) return null
  const unit = tipo === '0' ? 'kg' : 'un'
  return {
    plu,
    name,
    salePrice: priceRaw / 100,
    unit,
    categoryName: guessCategory(name, unit),
    selected: true,
  }
}

function parseMGVFile(content: string): ParsedProduct[] {
  const seen = new Set<number>()
  return content
    .split(/\r?\n/)
    .filter(l => l.trim())
    .map(parseMGVLine)
    .filter((p): p is ParsedProduct => p !== null && !seen.has(p.plu) && !!seen.add(p.plu))
    .sort((a, b) => a.plu - b.plu)
}

interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

interface Props {
  onClose: () => void
}

export function ImportMGVModal({ onClose }: Props) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [products, setProducts] = useState<ParsedProduct[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [filterCategory, setFilterCategory] = useState('')

  const { data: existingCategories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then(r => r.data),
  })

  const allCategories = Array.from(
    new Set([...existingCategories.map(c => c.name), ...DEFAULT_CATEGORIES])
  ).sort()

  const importMutation = useMutation({
    mutationFn: (data: typeof products) =>
      api.post('/products/bulk-import', {
        products: data.map(p => ({
          name: p.name,
          plu: p.plu,
          salePrice: p.salePrice,
          unit: p.unit,
          categoryName: p.categoryName,
        })),
      }).then(r => r.data),
    onSuccess: (data: ImportResult) => {
      setResult(data)
      setStep('done')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const parsed = parseMGVFile(e.target?.result as string)
      setProducts(parsed)
      setStep('preview')
    }
    reader.readAsText(file, 'latin1')
  }

  const toggleProduct = (idx: number) =>
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p))

  const toggleAll = (val: boolean) =>
    setProducts(prev => prev.map(p =>
      filterCategory && p.categoryName !== filterCategory ? p : { ...p, selected: val }
    ))

  const updateCategory = (idx: number, categoryName: string) =>
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, categoryName } : p))

  const selected = products.filter(p => p.selected)
  const visible = filterCategory ? products.filter(p => p.categoryName === filterCategory) : products
  const categoryCount = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.categoryName] = (acc[p.categoryName] ?? 0) + 1
    return acc
  }, {})

  return (
    <Modal open onClose={onClose} title="Importar Produtos da Balança (MGV7)" size="xl">
      {step === 'upload' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Selecione o arquivo <strong>ITENSMGV.TXT</strong> exportado do software MGV7 da Toledo.
            Os produtos serão categorizados automaticamente e você poderá revisar antes de confirmar.
          </p>
          <div
            className="border-2 border-dashed border-amber-300 rounded-xl p-14 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition"
            onClick={() => fileRef.current?.click()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onDragOver={e => e.preventDefault()}
          >
            <Upload className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="font-medium text-gray-700">Clique ou arraste o arquivo aqui</p>
            <p className="text-xs text-gray-400 mt-1">Formato aceito: ITENSMGV.TXT</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.TXT"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{products.length}</span> produtos encontrados &bull;{' '}
              <span className="font-semibold text-amber-700">{selected.length}</span> selecionados
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                <option value="">Todas as categorias</option>
                {Object.entries(categoryCount).sort().map(([cat, count]) => (
                  <option key={cat} value={cat}>{cat} ({count})</option>
                ))}
              </select>
              <button onClick={() => toggleAll(true)} className="text-xs text-primary hover:underline">Marcar tudo</button>
              <button onClick={() => toggleAll(false)} className="text-xs text-gray-400 hover:underline">Desmarcar tudo</button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 w-8"></th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">PLU</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Nome</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Preço</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Un</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium w-44">Categoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visible.map(p => {
                    const realIdx = products.indexOf(p)
                    return (
                      <tr key={p.plu} className={p.selected ? '' : 'opacity-40 bg-gray-50'}>
                        <td className="px-3 py-1.5 text-center">
                          <input type="checkbox" checked={p.selected} onChange={() => toggleProduct(realIdx)} />
                        </td>
                        <td className="px-3 py-1.5 font-mono text-gray-400">{p.plu}</td>
                        <td className="px-3 py-1.5 font-medium text-gray-800 max-w-[200px] truncate" title={p.name}>{p.name}</td>
                        <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap">
                          {p.salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/{p.unit}
                        </td>
                        <td className="px-3 py-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${p.unit === 'kg' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {p.unit}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <select
                            value={p.categoryName}
                            onChange={e => updateCategory(realIdx, e.target.value)}
                            className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                          >
                            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <button onClick={() => setStep('upload')} className="flex items-center gap-1 text-sm text-gray-500 hover:underline">
              <ChevronLeft size={14} /> Trocar arquivo
            </button>
            <Button
              onClick={() => importMutation.mutate(selected)}
              disabled={selected.length === 0 || importMutation.isPending}
            >
              {importMutation.isPending
                ? 'Importando...'
                : `Importar ${selected.length} produto${selected.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="py-6 text-center space-y-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Importação concluída!</h3>
            <p className="text-sm text-gray-500 mt-1">O catálogo de produtos foi atualizado.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            <div className="bg-green-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-green-700">{result.created}</div>
              <div className="text-xs text-green-600 mt-0.5">criados</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-yellow-700">{result.skipped}</div>
              <div className="text-xs text-yellow-600 mt-0.5">já existiam</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-red-700">{result.errors.length}</div>
              <div className="text-xs text-red-600 mt-0.5">erros</div>
            </div>
          </div>
          {result.skipped > 0 && (
            <p className="text-xs text-gray-400">Produtos ignorados já possuíam o mesmo PLU no sistema.</p>
          )}
          {result.errors.length > 0 && (
            <div className="text-left bg-red-50 border border-red-100 rounded-lg p-3 max-h-28 overflow-y-auto">
              {result.errors.map((e, i) => <p key={i} className="text-xs text-red-700">{e}</p>)}
            </div>
          )}
          <Button onClick={onClose}>Fechar</Button>
        </div>
      )}
    </Modal>
  )
}
