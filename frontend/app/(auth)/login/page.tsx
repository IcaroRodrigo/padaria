'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { Logo } from '@/components/ui/Logo'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

type FormData = z.infer<typeof schema>

/* ────────────────────────────────────────────────────────────
   Decorações SVG — blobs orgânicos + ramos de trigo/espiga
   aria-hidden, pointer-events-none, z-0
──────────────────────────────────────────────────────────── */

function DecoTopLeft() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 left-0 pointer-events-none z-0"
    >
      {/* Blob orgânico */}
      <div
        className="absolute -top-14 -left-14 w-52 h-44 lg:w-64 lg:h-52 bg-[#F6E7D5] opacity-75"
        style={{ borderRadius: '55% 45% 62% 38% / 42% 60% 40% 58%' }}
      />

      {/* Ramo com espigas */}
      <svg
        width="240"
        height="240"
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-0 left-0 w-44 h-44 lg:w-56 lg:h-56"
      >
        {/* Caule principal */}
        <path
          d="M12,228 C36,185 68,132 100,76"
          stroke="#9B5529"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.55"
        />
        {/* Ramo lateral */}
        <path
          d="M52,162 C72,144 98,136 116,126"
          stroke="#9B5529"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.44"
        />

        {/* Espiga 1 — grande, inferior */}
        <g transform="translate(32,188) rotate(-38)">
          <path
            d="M0,0 C-11,-4 -13,-21 0,-28 C13,-21 11,-4 0,0 Z"
            fill="#C89B6E"
            opacity="0.70"
          />
          <path d="M0,0 L0,-28" stroke="#B8662D" strokeWidth="0.8" opacity="0.42" />
        </g>

        {/* Espiga 2 — média */}
        <g transform="translate(62,140) rotate(-18)">
          <path
            d="M0,0 C-9,-3 -11,-18 0,-24 C11,-18 9,-3 0,0 Z"
            fill="#9B5529"
            opacity="0.60"
          />
          <path d="M0,0 L0,-24" stroke="#7A3E1A" strokeWidth="0.7" opacity="0.38" />
        </g>

        {/* Espiga 3 — pequena, topo */}
        <g transform="translate(90,96) rotate(12)">
          <path
            d="M0,0 C-7,-3 -8,-14 0,-19 C8,-14 7,-3 0,0 Z"
            fill="#7A3E1A"
            opacity="0.48"
          />
        </g>

        {/* Espiga no ramo lateral */}
        <g transform="translate(100,134) rotate(52)">
          <path
            d="M0,0 C-8,-3 -9,-16 0,-21 C9,-16 8,-3 0,0 Z"
            fill="#C89B6E"
            opacity="0.55"
          />
        </g>

        {/* Espiguinha solta */}
        <g transform="translate(78,114) rotate(-58)">
          <path
            d="M0,0 C-5,-2 -6,-11 0,-15 C6,-11 5,-2 0,0 Z"
            fill="#9B5529"
            opacity="0.40"
          />
        </g>
      </svg>
    </div>
  )
}

function DecoBottomRight() {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-0 right-0 pointer-events-none z-0"
    >
      {/* Blob orgânico */}
      <div
        className="absolute -bottom-12 -right-12 w-48 h-42 lg:w-60 lg:h-52 bg-[#EAD8C2] opacity-68"
        style={{ borderRadius: '45% 55% 38% 62% / 58% 42% 60% 38%' }}
      />

      {/* Ramo com espigas */}
      <svg
        width="220"
        height="220"
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-0 right-0 w-40 h-40 lg:w-52 lg:h-52"
      >
        {/* Caule */}
        <path
          d="M210,212 C180,180 148,148 116,116"
          stroke="#9B5529"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.54"
        />

        {/* Espiga 1 */}
        <g transform="translate(182,184) rotate(132)">
          <path
            d="M0,0 C-11,-4 -12,-20 0,-26 C12,-20 11,-4 0,0 Z"
            fill="#C89B6E"
            opacity="0.66"
          />
          <path d="M0,0 L0,-26" stroke="#B8662D" strokeWidth="0.8" opacity="0.42" />
        </g>

        {/* Espiga 2 */}
        <g transform="translate(152,154) rotate(112)">
          <path
            d="M0,0 C-9,-3 -10,-18 0,-23 C10,-18 9,-3 0,0 Z"
            fill="#9B5529"
            opacity="0.56"
          />
          <path d="M0,0 L0,-23" stroke="#7A3E1A" strokeWidth="0.7" opacity="0.38" />
        </g>

        {/* Espiga 3 — menor */}
        <g transform="translate(122,124) rotate(96)">
          <path
            d="M0,0 C-7,-3 -8,-13 0,-17 C8,-13 7,-3 0,0 Z"
            fill="#7A3E1A"
            opacity="0.46"
          />
        </g>
      </svg>
    </div>
  )
}

/* Decoração mínima para mobile (painel direito, canto superior-direito) */
function DecoMobileCorner() {
  return (
    <div
      aria-hidden="true"
      className="md:hidden absolute top-0 right-0 pointer-events-none z-0"
    >
      <div
        className="absolute -top-8 -right-8 w-28 h-24 bg-[#EAD9C3] opacity-55"
        style={{ borderRadius: '50% 0% 55% 45% / 40% 0% 60% 60%' }}
      />
      <svg
        width="90"
        height="90"
        viewBox="0 0 90 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-0 right-0"
      >
        <g transform="translate(65,25) rotate(142)">
          <path
            d="M0,0 C-6,-2 -7,-13 0,-17 C7,-13 6,-2 0,0 Z"
            fill="#C89B6E"
            opacity="0.52"
          />
        </g>
        <g transform="translate(78,46) rotate(120)">
          <path
            d="M0,0 C-5,-2 -5,-10 0,-13 C5,-10 5,-2 0,0 Z"
            fill="#9B5529"
            opacity="0.42"
          />
        </g>
      </svg>
    </div>
  )
}

/* ───────────────────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      const user = await login(data.email, data.password)
      if (user.role === 'SUPER_ADMIN') router.push('/admin')
      else if (user.role === 'OPERATOR') router.push('/pdv')
      else router.push('/dashboard')
    } catch {
      setError('E-mail ou senha incorretos. Verifique seus dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#FFF8EC] overflow-hidden relative">

      {/* Mancha inferior — fica no background geral, atrás das duas seções */}
      <DecoBottomRight />

      {/* ── Painel esquerdo ──────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col w-[44%] lg:w-[46%] relative overflow-hidden z-10 pl-2 pr-0 py-6">

        <DecoTopLeft />

        {/* Bloco unificado — w-[70%] + ml-auto ancora tudo na borda direita do painel */}
        <div className="relative z-10 mt-auto flex flex-col w-[70%] ml-auto mb-[100px]">

          <div className="pl-[8%]">
            <Logo size="md" className="h-[73px] w-auto" />
            <span className="mt-1 block text-[10px] font-extrabold tracking-[0.25em] text-[#B8662D] uppercase">
              Padaria
            </span>
            <div className="mt-4">
              <h1 className="text-3xl lg:text-[2.25rem] font-extrabold text-[#2E2925] leading-tight mb-3">
                Organize sua padaria<br />com mais leveza
              </h1>
              <p className="text-[#6b5a47] text-sm lg:text-base leading-relaxed">
                PDV, estoque, clientes e despesas em um só lugar.
              </p>
            </div>
          </div>

          <Image
            src="/login-illustration.png"
            alt="Padeira sorrindo atrás do balcão com pães, croissants e bolos"
            width={1536}
            height={1024}
            className="mt-3 w-full object-contain"
            priority
          />
        </div>
      </div>

      {/* ── Painel direito ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center relative overflow-hidden z-10 pl-2 pr-4 py-6 sm:pl-4 sm:pr-6">

        <DecoMobileCorner />

        <div className="w-full max-w-[480px] relative z-10">

          {/* Logo — apenas mobile */}
          <div className="md:hidden flex justify-center mb-5">
            <Logo size="md" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#EAD9C3] px-6 py-6 sm:px-8">

            <div className="mb-5">
              <p className="text-[10px] font-extrabold tracking-[0.22em] text-[#B8662D] uppercase mb-3">
                PadariaGest
              </p>
              <h2 className="text-2xl font-bold text-[#2E2925] mb-1.5">
                Acesse sua conta
              </h2>
              <p className="text-[#6b5a47] text-sm leading-relaxed">
                Entre para continuar gerenciando sua padaria.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

              {/* E-mail */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#2E2925] mb-1.5">
                  E-mail
                </label>
                <input
                  id="email"
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                  className="w-full h-12 px-4 rounded-xl border border-[#EAD9C3] bg-white text-[#2E2925] placeholder:text-[#a89070] text-sm focus:outline-none focus:ring-2 focus:ring-[#B8662D] focus:border-transparent transition"
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-[#D92D20] text-xs mt-1.5">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#2E2925] mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    aria-invalid={!!errors.password}
                    className="w-full h-12 pl-4 pr-12 rounded-xl border border-[#EAD9C3] bg-white text-[#2E2925] placeholder:text-[#a89070] text-sm focus:outline-none focus:ring-2 focus:ring-[#B8662D] focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a89070] hover:text-[#6b5a47] transition"
                  >
                    {showPassword
                      ? <EyeOff className="w-[18px] h-[18px]" />
                      : <Eye className="w-[18px] h-[18px]" />
                    }
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="text-[#D92D20] text-xs mt-1.5">
                    {errors.password.message}
                  </p>
                )}
                <div className="flex justify-end mt-2">
                  <Link
                    href="/recuperar-senha"
                    className="text-xs font-medium text-[#B8662D] hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              </div>

              {/* Erro global */}
              {error && (
                <div
                  role="alert"
                  className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] text-sm rounded-xl px-4 py-3 leading-relaxed"
                >
                  {error}
                </div>
              )}

              {/* Botão principal */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#B8662D] hover:bg-[#9B5529] active:bg-[#7A3E1A] text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm tracking-wide"
              >
                {loading ? 'Entrando...' : 'Acessar minha conta'}
              </button>
            </form>
          </div>

          {/* Rodapé */}
          <div className="mt-4 text-center space-y-1">
            <p className="text-sm text-[#6b5a47]">
              Ainda não tem uma conta?{' '}
              <Link href="/cadastro" className="font-semibold text-[#B8662D] hover:underline">
                Crie grátis
              </Link>
            </p>
            <p className="text-[11px] text-[#a89070]">
              15 dias grátis · Sem cartão de crédito
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
