'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import api from '@/lib/api'
import { PasswordCriteria, senhaValida } from '@/components/ui/PasswordCriteria'

function PasswordInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    if (!senhaValida(novaSenha)) {
      setErro('A senha não atende todos os critérios de segurança.')
      return
    }
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password: novaSenha })
      setSucesso(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao redefinir senha. O link pode ter expirado.')
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
          {sucesso ? (
            <div className="text-center py-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Senha redefinida!</h2>
              <p className="text-muted-foreground text-sm">
                Você será redirecionado para o login em instantes…
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-1">Nova senha</h2>
              <p className="text-sm text-muted-foreground mb-6">Crie uma senha segura para sua conta.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <PasswordInput
                    label="Nova senha"
                    value={novaSenha}
                    onChange={setNovaSenha}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <PasswordCriteria senha={novaSenha} />
                </div>

                <PasswordInput
                  label="Confirmar nova senha"
                  value={confirmar}
                  onChange={setConfirmar}
                />

                {erro && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {erro}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !senhaValida(novaSenha)}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 text-sm"
                >
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/login" className="text-primary font-medium hover:underline">Voltar ao login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
