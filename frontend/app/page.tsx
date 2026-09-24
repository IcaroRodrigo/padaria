import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Wallet,
  Check,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { HardwareForm } from '@/components/landing/HardwareForm'

const features = [
  {
    icon: ShoppingCart,
    title: 'PDV com Balança Integrada',
    description:
      'Leitura automática de etiquetas da balança Toledo. Finalize vendas em segundos com múltiplas formas de pagamento.',
  },
  {
    icon: Package,
    title: 'Controle de Estoque',
    description:
      'Entrada de mercadorias, rastreamento por fornecedor e alertas de estoque mínimo em tempo real.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Financeiro',
    description:
      'Visualize faturamento, ticket médio e lucratividade do dia, semana ou mês em um único painel.',
  },
  {
    icon: Users,
    title: 'Gestão de Clientes',
    description:
      'Cadastro completo, histórico de compras e acompanhamento do comportamento de cada cliente.',
  },
  {
    icon: Wallet,
    title: 'Controle de Despesas',
    description:
      'Registre despesas fixas e variáveis, programe vencimentos e acompanhe o fluxo de caixa.',
  },
]

const benefits = [
  'Sem limites de produtos ou vendas',
  'Suporte via WhatsApp incluso',
  'Dados na nuvem com backup automático',
  'Impressão de etiquetas com nome, preço e código PLU do produto',
  'Sem contrato de fidelidade',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 sm:h-16 flex items-center justify-between">
          <div className="sm:hidden">
            <Logo size="sm" className="h-10" />
          </div>
          <div className="hidden sm:block">
            <Logo size="md" className="h-14" />
          </div>
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <Link
              href="/login"
              className="text-[13px] sm:text-sm text-gray-600 font-medium hover:text-gray-900 transition px-2 sm:px-3 py-2 whitespace-nowrap"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="bg-[#4a7c2f] hover:bg-[#3a6124] text-white text-[13px] sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition whitespace-nowrap"
            >
              Testar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-8 lg:pt-24 lg:pb-12">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Texto */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#4a7c2f]/10 text-[#4a7c2f] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-[#4a7c2f] rounded-full" />
              15 dias grátis · Sem cartão de crédito
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4 tracking-tight">
              Seu empório{' '}
              <span className="text-[#4a7c2f]">organizado</span>{' '}
              desde o começo
            </h1>

            <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              PDV, estoque, clientes e despesas em um único sistema.
              Simples, rápido e feito para lojas de produtos naturais e a granel.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Link
                href="/cadastro"
                className="w-full sm:w-auto bg-[#4a7c2f] hover:bg-[#3a6124] text-white font-semibold px-7 py-3.5 rounded-xl text-base transition shadow-sm text-center"
              >
                Começar grátis agora
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto text-gray-600 hover:text-gray-900 font-medium text-base transition text-center px-2 py-3.5"
              >
                Já tenho conta →
              </Link>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 mt-8">
              {[
                'Sem instalação',
                'Acesso pelo navegador',
                'Suporte WhatsApp',
              ].map(item => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Check className="w-3.5 h-3.5 text-[#4a7c2f]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Mockup */}
          <div className="flex-1 flex items-center justify-center lg:justify-end w-full max-w-lg lg:max-w-none">
            <Image
              src="/notebook-hero.png"
              alt="GranelSystem no notebook"
              width={620}
              height={420}
              className="w-full max-w-md lg:max-w-full drop-shadow-xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Logos / prova social (linha discreta) ───────────────────────────── */}
      <div className="border-y border-gray-100 py-5 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-3 text-sm text-gray-400 sm:flex-row sm:justify-center sm:gap-2">
          <span className="font-medium text-gray-500">Feito para:</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:flex sm:items-center sm:gap-2">
            {['Empórios naturais', 'Lojas a granel', 'Ervanárias', 'Lojas de suplementos'].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-2">
                <span className="text-center sm:text-left">{s}</span>
                {i < arr.length - 1 && <span className="hidden sm:inline text-gray-200">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Tudo que sua loja precisa
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Ferramentas pensadas para o dia a dia do varejo a granel e produtos naturais.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#4a7c2f]/30 hover:shadow-md transition-all"
              >
                <div className="w-11 h-11 bg-[#4a7c2f]/10 group-hover:bg-[#4a7c2f]/15 rounded-xl flex items-center justify-center mb-4 transition">
                  <Icon className="w-5 h-5 text-[#4a7c2f]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hardware ────────────────────────────────────────────────────────── */}
      <section className="bg-[#f5f0e8] border-y border-[#e2d9c5] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Compatibilidade de hardware
            </h2>
            <p className="text-gray-500 text-base max-w-2xl mx-auto">
              O sistema se integra com balanças e impressoras específicas. Veja se o seu equipamento já é homologado — ou nos conte o que você tem e analisamos a possibilidade.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* Equipamentos homologados */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1 text-base">Equipamentos homologados</h3>
              <p className="text-sm text-gray-400 mb-6">Integração testada e funcionando.</p>

              <div className="flex flex-col gap-5">
                {[
                  {
                    categoria: 'Balança',
                    itens: ['Toledo Prix 3 Fit'],
                  },
                  {
                    categoria: 'Impressora de etiquetas',
                    itens: ['Toledo IT400M'],
                  },
                ].map(({ categoria, itens }) => (
                  <div key={categoria}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{categoria}</p>
                    <ul className="flex flex-col gap-1.5">
                      {itens.map(item => (
                        <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                          <span className="w-5 h-5 bg-[#4a7c2f]/10 rounded-full flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-[#4a7c2f]" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Outros modelos podem funcionar com homologação. Use o formulário ao lado.
                </p>
              </div>
            </div>

            {/* Formulário */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1 text-base">Tem outro equipamento?</h3>
              <p className="text-sm text-gray-400 mb-6">
                Informe o seu hardware e analisamos a possibilidade de homologar no sistema.
              </p>
              <HardwareForm />
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA verde ───────────────────────────────────────────────────────── */}
      <section className="bg-[#f5f0e8] border-y border-[#e2d9c5] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#4a7c2f] rounded-3xl p-10 md:p-14 text-white text-center shadow-xl">
            <h2 className="text-3xl font-extrabold mb-3 tracking-tight">
              15 dias grátis, sem cartão de crédito
            </h2>
            <p className="text-[#c8e6b0] text-base mb-8 max-w-md mx-auto">
              Experimente o Começa Bem Empório sem risco. Cancele a qualquer momento.
            </p>
            <ul className="inline-flex flex-col gap-3 text-left mb-10">
              {benefits.map(b => (
                <li key={b} className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <Link
              href="/cadastro"
              className="inline-block bg-white text-[#4a7c2f] hover:bg-[#f5f0e8] font-semibold px-8 py-3.5 rounded-xl text-base transition shadow-md"
            >
              Começar agora grátis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-md mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Preço simples</h2>
          <p className="text-gray-500 text-sm mb-10">
            Um único plano com tudo incluso. Sem surpresas na fatura.
          </p>

          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-left shadow-sm">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-gray-900 mb-1">
                R$ 89
                <span className="text-xl font-normal text-gray-400">/mês</span>
              </div>
              <p className="text-sm text-gray-400">após os 15 dias de trial gratuito</p>
            </div>

            <ul className="space-y-3 mb-8">
              {benefits.map(b => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <div className="w-4 h-4 bg-[#4a7c2f]/15 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-[#4a7c2f]" />
                  </div>
                  {b}
                </li>
              ))}
            </ul>

            <Link
              href="/cadastro"
              className="block w-full bg-[#4a7c2f] hover:bg-[#3a6124] text-white font-semibold py-3.5 rounded-xl text-sm transition text-center shadow-sm"
            >
              Começar 15 dias grátis
            </Link>
            <p className="text-center text-xs text-gray-400 mt-3">
              Sem cartão de crédito · Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <Logo size="sm" />
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-gray-600 transition">Entrar</Link>
            <Link href="/cadastro" className="hover:text-gray-600 transition">Criar conta</Link>
            <Link href="/recuperar-senha" className="hover:text-gray-600 transition">Recuperar senha</Link>
          </div>
          <span>© 2026 Começa Bem Empório · Todos os direitos reservados</span>
        </div>
      </footer>

    </div>
  )
}
