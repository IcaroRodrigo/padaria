'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Copy, Check, MessageCircle, Leaf, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'
import { generatePixPayload } from '@/lib/pix'
import api from '@/lib/api'

interface AssinaturaInfo {
  pixKey: string
  whatsapp: string
  valor: number
  pixName: string
  pixCity: string
}

interface Props {
  nomeEmpresa: string
  emailEmpresa: string
  onClose: () => void
  onSent: () => void
}

export function AssinaturaModal({ nomeEmpresa, emailEmpresa, onClose, onSent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pixCode, setPixCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)

  const { data: info, isLoading } = useQuery<AssinaturaInfo>({
    queryKey: ['empresa', 'assinatura-info'],
    queryFn: () => api.get('/empresa/assinatura-info').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!info?.pixKey || !canvasRef.current) return

    const txid = `GS${Date.now().toString(36).toUpperCase().slice(-8)}`
    const payload = generatePixPayload({
      pixKey: info.pixKey,
      merchantName: info.pixName || 'GRANELSYSTEM',
      merchantCity: info.pixCity || 'CURITIBA',
      amount: info.valor,
      txid,
      description: 'GranelSystem Mensalidade',
    })
    setPixCode(payload)

    QRCode.toCanvas(canvasRef.current, payload, {
      width: 220,
      margin: 2,
      color: { dark: '#4a7c2f', light: '#ffffff' },
    })
  }, [info])

  const copiar = async () => {
    await navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const enviarWhatsApp = async () => {
    if (!info) return
    setSending(true)
    try {
      await api.post('/empresa/assinar', { valorPago: info.valor })
    } catch {
      // ignora duplicata
    }

    const msg = [
      `*GranelSystem — Comprovante de Pagamento*`,
      ``,
      `Empresa: ${nomeEmpresa}`,
      `E-mail: ${emailEmpresa}`,
      `Valor: R$ ${info.valor},00`,
      ``,
      `Segue o comprovante do pagamento PIX.`,
    ].join('\n')

    window.open(`https://wa.me/${info.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
    setSending(false)
    onSent()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#4a7c2f] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Assinar GranelSystem</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Carregando dados de pagamento…</span>
            </div>
          ) : !info?.pixKey ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Dados de pagamento não configurados.<br />Entre em contato pelo WhatsApp para assinar.
            </div>
          ) : (
            <>
              {/* Valor */}
              <div className="text-center mb-5">
                <p className="text-sm text-gray-500 mb-1">Valor da mensalidade</p>
                <p className="text-4xl font-bold text-[#4a7c2f]">
                  R$ {info.valor}<span className="text-xl font-normal text-gray-400">,00/mês</span>
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center mb-5">
                <div className="p-3 bg-white border-2 border-[#4a7c2f]/20 rounded-2xl shadow-sm">
                  <canvas ref={canvasRef} />
                </div>
                <p className="text-xs text-gray-400 mt-2">Escaneie com o app do seu banco</p>
              </div>

              {/* Copiar código */}
              <button
                onClick={copiar}
                disabled={!pixCode}
                className="w-full flex items-center justify-center gap-2 border border-[#4a7c2f]/30 hover:bg-[#4a7c2f]/5 text-[#4a7c2f] font-medium py-2.5 rounded-xl text-sm transition mb-3 disabled:opacity-40"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Código copiado!' : 'Copiar código PIX'}
              </button>

              <div className="relative flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">depois de pagar</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Botão WhatsApp */}
              <button
                onClick={enviarWhatsApp}
                disabled={sending || !info.whatsapp}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar comprovante via WhatsApp
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                Após o envio, confirmaremos em até 24 horas.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
