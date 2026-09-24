'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'

export function HardwareForm() {
  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    modelo: '',
    equipamentos: [] as string[],
  })

  function toggleEquipamento(value: string) {
    setForm(f => ({
      ...f,
      equipamentos: f.equipamentos.includes(value)
        ? f.equipamentos.filter(e => e !== value)
        : [...f.equipamentos, value],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const texto = [
      `Olá! Gostaria de verificar a compatibilidade do meu equipamento com o Começa Bem Empório.`,
      ``,
      `Nome: ${form.nome}`,
      `WhatsApp: ${form.whatsapp}`,
      `Equipamentos: ${form.equipamentos.join(', ')}`,
      `Marca / Modelo: ${form.modelo}`,
    ].join('\n')

    window.open(`https://wa.me/5541988838697?text=${encodeURIComponent(texto)}`, '_blank')
  }

  const equipamentos = ['Balança', 'Impressora de etiquetas', 'Impressora de recibos']

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Seu nome</label>
        <input
          required
          type="text"
          placeholder="João Silva"
          value={form.nome}
          onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c2f]/30 focus:border-[#4a7c2f]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp</label>
        <input
          required
          type="text"
          placeholder="(41) 99999-9999"
          value={form.whatsapp}
          onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c2f]/30 focus:border-[#4a7c2f]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Equipamentos que possui</label>
        <div className="flex flex-col gap-2">
          {equipamentos.map(eq => (
            <label key={eq} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.equipamentos.includes(eq)}
                onChange={() => toggleEquipamento(eq)}
                className="w-4 h-4 accent-[#4a7c2f] cursor-pointer"
              />
              <span className="text-sm text-gray-700">{eq}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Marca e modelo</label>
        <input
          required
          type="text"
          placeholder="Ex: Bematech MP-4200 TH"
          value={form.modelo}
          onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c2f]/30 focus:border-[#4a7c2f]"
        />
      </div>

      <button
        type="submit"
        className="mt-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-3 rounded-xl text-sm transition shadow-sm"
      >
        <MessageCircle className="w-4 h-4" />
        Consultar via WhatsApp
      </button>
    </form>
  )
}
