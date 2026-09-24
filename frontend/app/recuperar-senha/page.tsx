'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import api from '@/lib/api'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Informe seu e-mail'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      // Sempre mostra sucesso para não revelar se e-mail existe
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifique seu e-mail</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também a caixa de spam.
              </p>
              <Link
                href="/login"
                className="inline-block w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition text-center text-sm"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition">
                <ArrowLeft className="w-4 h-4" /> Voltar ao login
              </Link>

              <h2 className="text-xl font-semibold mb-1">Recuperar senha</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Informe seu e-mail e enviaremos um link para criar uma nova senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">E-mail</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
                      placeholder="voce@empresa.com.br"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 text-sm"
                >
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
