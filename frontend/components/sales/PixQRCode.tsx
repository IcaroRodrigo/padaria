'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { generatePixPayload } from '@/lib/pix'
import { formatCurrency } from '@/lib/utils'
import { Copy, CheckCircle2, AlertCircle } from 'lucide-react'
import QRCode from 'qrcode'

interface PixQRCodeProps {
  amount: number
  onConfirm: () => void
}

export function PixQRCode({ amount, onConfirm }: PixQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [payload, setPayload] = useState('')

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
  })

  useEffect(() => {
    if (!settings?.pix_key) return

    const p = generatePixPayload({
      pixKey: settings.pix_key,
      merchantName: settings.pix_merchant_name || settings.store_name || 'Casa Granella',
      merchantCity: settings.store_city || 'SAO PAULO',
      amount,
      description: 'Casa Granella',
    })

    setPayload(p)

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, p, {
        width: 220,
        margin: 2,
        color: { dark: '#3a6124', light: '#f5f0e8' },
      })
    }
  }, [settings, amount])

  const copyPayload = () => {
    navigator.clipboard.writeText(payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  if (!settings?.pix_key) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <AlertCircle className="w-8 h-8 text-amber-500" />
        <p className="text-sm text-amber-800 font-medium">Chave PIX não configurada</p>
        <p className="text-xs text-amber-700">
          Acesse <strong>Configurações</strong> para cadastrar sua chave PIX.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Valor a receber</p>
        <p className="text-xl font-bold text-primary money">{formatCurrency(amount)}</p>
      </div>

      {/* QR Code */}
      <div className="bg-[#f5f0e8] p-3 rounded-xl border border-border">
        <canvas ref={canvasRef} />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Cliente escaneia com o app do banco
      </p>

      {/* Copia e cola */}
      <button
        onClick={copyPayload}
        className="flex items-center gap-2 w-full justify-center py-2 px-3 border border-border rounded-lg text-sm hover:bg-muted/50 transition"
      >
        {copied ? (
          <><CheckCircle2 size={14} className="text-success" /> Copiado!</>
        ) : (
          <><Copy size={14} /> Copiar código PIX</>
        )}
      </button>

      {/* Confirmação manual */}
      <button
        onClick={onConfirm}
        className="w-full py-2.5 bg-success hover:bg-green-700 text-white text-sm font-medium rounded-xl transition"
      >
        Confirmar pagamento recebido
      </button>
    </div>
  )
}
