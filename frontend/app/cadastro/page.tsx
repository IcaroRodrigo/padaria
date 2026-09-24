'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import api from '@/lib/api'
import { PasswordCriteria, senhaValida } from '@/components/ui/PasswordCriteria'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const emailSchema = z.object({
  nomeEmpresa: z.string().min(2, 'Nome da empresa é obrigatório'),
  nome: z.string().min(2, 'Seu nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
})

const registroSchema = z
  .object({
    codigo: z.string().length(6, 'O código deve ter 6 dígitos'),
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
      .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
      .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
      .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type EmailData = z.infer<typeof emailSchema>
type RegistroData = z.infer<typeof registroSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inputCls(error?: boolean) {
  return `w-full px-4 py-2.5 rounded-lg border ${error ? 'border-red-400' : 'border-input'} bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm`
}

function PasswordInput({ register, name, placeholder }: {
  register: any; name: string; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        {...register(name)}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className={inputCls()}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CadastroPage() {
  const [step, setStep] = useState<'email' | 'codigo' | 'sucesso'>('email')
  const [dadosEmail, setDadosEmail] = useState<EmailData | null>(null)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingRegistro, setLoadingRegistro] = useState(false)
  const [apiError, setApiError] = useState('')
  const [senha, setSenha] = useState('')

  const emailForm = useForm<EmailData>({ resolver: zodResolver(emailSchema) })
  const registroForm = useForm<RegistroData>({ resolver: zodResolver(registroSchema) })

  const onEnviarCodigo = async (data: EmailData) => {
    setLoadingEmail(true)
    setApiError('')
    try {
      await api.post('/auth/enviar-codigo', { email: data.email, nomeEmpresa: data.nomeEmpresa })
      setDadosEmail(data)
      setStep('codigo')
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Erro ao enviar código. Tente novamente.')
    } finally {
      setLoadingEmail(false)
    }
  }

  const onRegistrar = async (data: RegistroData) => {
    if (!dadosEmail) return
    setLoadingRegistro(true)
    setApiError('')
    try {
      await api.post('/auth/register', {
        nomeEmpresa: dadosEmail.nomeEmpresa,
        nome: dadosEmail.nome,
        email: dadosEmail.email,
        password: data.password,
        codigoVerificacao: data.codigo,
      })
      setStep('sucesso')
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoadingRegistro(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">

          {/* ── Sucesso ─────────────────────────────────────────────────── */}
          {step === 'sucesso' && (
            <div className="text-center py-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-green-700 mb-2">Conta criada com sucesso!</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Faça login para continuar e aproveitar seus 15 dias gratuitos.
              </p>
              <Link
                href="/login"
                className="inline-block w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition text-center text-sm"
              >
                Ir para o login
              </Link>
            </div>
          )}

          {/* ── Etapa 1: dados + e-mail ──────────────────────────────────── */}
          {step === 'email' && (
            <>
              <h2 className="text-xl font-semibold mb-6">Criar conta grátis</h2>
              <form onSubmit={emailForm.handleSubmit(onEnviarCodigo)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nome da empresa</label>
                  <input
                    {...emailForm.register('nomeEmpresa')}
                    type="text"
                    className={inputCls(!!emailForm.formState.errors.nomeEmpresa)}
                    placeholder="Ex: Empório Terra Viva"
                  />
                  {emailForm.formState.errors.nomeEmpresa && (
                    <p className="text-red-500 text-xs mt-1">{emailForm.formState.errors.nomeEmpresa.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Seu nome</label>
                  <input
                    {...emailForm.register('nome')}
                    type="text"
                    className={inputCls(!!emailForm.formState.errors.nome)}
                    placeholder="Nome completo"
                  />
                  {emailForm.formState.errors.nome && (
                    <p className="text-red-500 text-xs mt-1">{emailForm.formState.errors.nome.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">E-mail</label>
                  <input
                    {...emailForm.register('email')}
                    type="email"
                    className={inputCls(!!emailForm.formState.errors.email)}
                    placeholder="voce@empresa.com.br"
                  />
                  {emailForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                {apiError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {apiError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingEmail}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 text-sm"
                >
                  {loadingEmail ? 'Enviando código...' : 'Continuar →'}
                </button>
              </form>
            </>
          )}

          {/* ── Etapa 2: código + senha ──────────────────────────────────── */}
          {step === 'codigo' && dadosEmail && (
            <>
              <button
                onClick={() => { setStep('email'); setApiError('') }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6">
                <Mail className="w-4 h-4 text-green-700 shrink-0" />
                <p className="text-sm text-green-800">
                  Código enviado para <strong>{dadosEmail.email}</strong>. Verifique sua caixa de entrada.
                </p>
              </div>

              <h2 className="text-xl font-semibold mb-6">Verificar e criar senha</h2>
              <form onSubmit={registroForm.handleSubmit(onRegistrar)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Código de verificação</label>
                  <input
                    {...registroForm.register('codigo')}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className={`${inputCls(!!registroForm.formState.errors.codigo)} text-center text-2xl tracking-[0.5em] font-bold`}
                    placeholder="000000"
                  />
                  {registroForm.formState.errors.codigo && (
                    <p className="text-red-500 text-xs mt-1">{registroForm.formState.errors.codigo.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Senha</label>
                  <div className="relative">
                    <SenhaField register={registroForm.register} onWatch={setSenha} />
                  </div>
                  {registroForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{registroForm.formState.errors.password.message}</p>
                  )}
                  <PasswordCriteria senha={senha} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirmar senha</label>
                  <PasswordInput register={registroForm.register} name="confirmPassword" />
                  {registroForm.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{registroForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {apiError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {apiError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingRegistro || !senhaValida(senha)}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 text-sm"
                >
                  {loadingRegistro ? 'Criando conta...' : 'Criar conta grátis'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}

// Campo de senha com watch interno
function SenhaField({ register, onWatch }: { register: any; onWatch: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        {...register('password', {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => onWatch(e.target.value),
        })}
        type={show ? 'text' : 'password'}
        placeholder="Mínimo 8 caracteres"
        className={inputCls()}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
