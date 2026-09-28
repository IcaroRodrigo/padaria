import Link from 'next/link'
import {
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Wallet,
  Check,
  Cookie,
  Scale,
  Receipt,
} from 'lucide-react'
import { HardwareForm } from '@/components/landing/HardwareForm'

const features = [
  {
    icon: ShoppingCart,
    title: 'PDV com Balança Integrada',
    description:
      'Leitura automática de etiquetas Toledo. Venda pães, bolos e salgados por peso ou unidade em segundos, com múltiplas formas de pagamento.',
  },
  {
    icon: Package,
    title: 'Controle de Produtos',
    description:
      'Cadastre pães, bolos, salgados, bebidas e muito mais. Organize por categoria, defina preço de custo e venda, e acompanhe o estoque.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Financeiro',
    description:
      'Faturamento, ticket médio e lucro do dia, semana ou mês em um único painel. Saiba exatamente o que a padaria vendeu.',
  },
  {
    icon: Users,
    title: 'Gestão de Clientes',
    description:
      'Cadastro completo, histórico de compras e perfil de consumo de cada cliente. Fidelize quem compra todo dia.',
  },
  {
    icon: Wallet,
    title: 'Controle de Despesas',
    description:
      'Registre custos fixos e variáveis — aluguel, energia, matéria-prima — e acompanhe o fluxo de caixa em tempo real.',
  },
  {
    icon: Receipt,
    title: 'Emissão de NFC-e',
    description:
      'Emita nota fiscal de consumidor eletrônica diretamente pelo sistema, com impressão automática no cupom.',
  },
]

const benefits = [
  'Sem limites de produtos ou vendas',
  'Suporte via WhatsApp incluso',
  'Dados na nuvem com backup automático',
  'Etiquetas com nome, preço e PLU para balança',
  'Sem contrato de fidelidade',
]

function BrandLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-white/15' : 'bg-[#B8662D]'}`}>
        <Cookie className={`w-4.5 h-4.5 ${dark ? 'text-white' : 'text-white'}`} size={18} />
      </div>
      <span className={`font-extrabold text-lg tracking-tight ${dark ? 'text-white' : 'text-[#2E2925]'}`}>
        Padaria<span className={dark ? 'text-[#EAD8C2]' : 'text-[#B8662D]'}>Gest</span>
      </span>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#EAD9C3] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <Link
              href="/login"
              className="text-[13px] sm:text-sm text-[#493329] font-medium hover:text-[#2E2925] transition px-2 sm:px-3 py-2 whitespace-nowrap"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="bg-[#B8662D] hover:bg-[#9B5529] text-white text-[13px] sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition whitespace-nowrap"
            >
              Testar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#FFF8EC] border-b border-[#EAD9C3]">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-16 lg:pt-24 lg:pb-20">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Texto */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-[#B8662D]/10 text-[#9B5529] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-[#B8662D] rounded-full" />
                15 dias grátis · Sem cartão de crédito
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold text-[#2E2925] leading-tight mb-4 tracking-tight">
                Sua padaria{' '}
                <span className="text-[#B8662D]">no controle</span>{' '}
                todos os dias
              </h1>

              <p className="text-lg text-[#6b5a47] mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                PDV, balança, estoque, clientes e despesas em um único sistema.
                Simples, rápido e feito para panificadoras e confeitarias.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link
                  href="/cadastro"
                  className="w-full sm:w-auto bg-[#B8662D] hover:bg-[#9B5529] text-white font-semibold px-7 py-3.5 rounded-xl text-base transition shadow-sm text-center"
                >
                  Começar grátis agora
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto text-[#493329] hover:text-[#2E2925] font-medium text-base transition text-center px-2 py-3.5"
                >
                  Já tenho conta →
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 mt-8">
                {['Sem instalação', 'Acesso pelo navegador', 'Suporte WhatsApp'].map(item => (
                  <span key={item} className="flex items-center gap-1.5 text-xs text-[#6b5a47]">
                    <Check className="w-3.5 h-3.5 text-[#B8662D]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Mockup ilustrativo */}
            <div className="flex-1 flex items-center justify-center lg:justify-end w-full max-w-sm lg:max-w-none">
              <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#EAD9C3] p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-[#493329] uppercase tracking-wide">Vendas hoje</span>
                  <span className="text-xs text-[#6b5a47]">Quinta, 25 set</span>
                </div>
                <div className="text-3xl font-bold text-[#2E2925] mb-1">R$ 1.842,50</div>
                <div className="text-sm text-[#6b5a47] mb-6">47 vendas · ticket médio R$ 39,20</div>
                <div className="space-y-2.5">
                  {[
                    { name: 'Pão Francês (kg)', qty: '18,4 kg', value: 'R$ 312,80' },
                    { name: 'Bolo de Cenoura', qty: '12 un', value: 'R$ 216,00' },
                    { name: 'Coxinha', qty: '87 un', value: 'R$ 391,50' },
                  ].map(item => (
                    <div key={item.name} className="flex items-center justify-between py-2.5 border-b border-[#EAD9C3] last:border-0">
                      <div>
                        <div className="text-sm font-medium text-[#2E2925]">{item.name}</div>
                        <div className="text-xs text-[#6b5a47]">{item.qty}</div>
                      </div>
                      <span className="text-sm font-semibold text-[#B8662D]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feito para ───────────────────────────────────────────────────────── */}
      <div className="border-b border-[#EAD9C3] py-5 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-3 text-sm text-[#6b5a47] sm:flex-row sm:justify-center sm:gap-2">
          <span className="font-medium text-[#493329]">Feito para:</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:flex sm:items-center sm:gap-2">
            {['Panificadoras', 'Padarias artesanais', 'Confeitarias', 'Docerias'].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-2">
                <span className="text-center sm:text-left">{s}</span>
                {i < arr.length - 1 && <span className="hidden sm:inline text-[#EAD9C3]">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#2E2925] mb-3">
              Tudo que sua padaria precisa
            </h2>
            <p className="text-[#6b5a47] text-base max-w-xl mx-auto">
              Ferramentas pensadas para o dia a dia de panificadoras e confeitarias.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group bg-white rounded-2xl p-6 border border-[#EAD9C3] hover:border-[#B8662D]/40 hover:shadow-md transition-all"
              >
                <div className="w-11 h-11 bg-[#B8662D]/10 group-hover:bg-[#B8662D]/15 rounded-xl flex items-center justify-center mb-4 transition">
                  <Icon className="w-5 h-5 text-[#B8662D]" />
                </div>
                <h3 className="font-semibold text-[#2E2925] mb-2 text-sm">{title}</h3>
                <p className="text-sm text-[#6b5a47] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hardware ────────────────────────────────────────────────────────── */}
      <section className="bg-[#FFF8EC] border-y border-[#EAD9C3] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2E2925] mb-3">
              Compatibilidade de hardware
            </h2>
            <p className="text-[#6b5a47] text-base max-w-2xl mx-auto">
              O sistema integra com balanças e impressoras específicas. Veja se o seu equipamento já é homologado — ou nos conte o que você tem.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            <div className="bg-white rounded-2xl border border-[#EAD9C3] p-8 shadow-sm">
              <h3 className="font-semibold text-[#2E2925] mb-1 text-base">Equipamentos homologados</h3>
              <p className="text-sm text-[#6b5a47] mb-6">Integração testada e funcionando.</p>

              <div className="flex flex-col gap-5">
                {[
                  { categoria: 'Balança', itens: ['Toledo Prix 4 Uno'] },
                  { categoria: 'Impressora de cupom', itens: ['Bematech MP-4200 HS'] },
                ].map(({ categoria, itens }) => (
                  <div key={categoria}>
                    <p className="text-xs font-semibold text-[#6b5a47] uppercase tracking-wide mb-2">{categoria}</p>
                    <ul className="flex flex-col gap-1.5">
                      {itens.map(item => (
                        <li key={item} className="flex items-center gap-2.5 text-sm text-[#2E2925]">
                          <span className="w-5 h-5 bg-[#B8662D]/10 rounded-full flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-[#B8662D]" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-[#EAD9C3]">
                <p className="text-xs text-[#6b5a47]">
                  Outros modelos podem funcionar com homologação. Use o formulário ao lado.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EAD9C3] p-8 shadow-sm">
              <h3 className="font-semibold text-[#2E2925] mb-1 text-base">Tem outro equipamento?</h3>
              <p className="text-sm text-[#6b5a47] mb-6">
                Informe o seu hardware e analisamos a possibilidade de homologar no sistema.
              </p>
              <HardwareForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#3B2A22] rounded-3xl p-10 md:p-14 text-white text-center shadow-xl">
            <h2 className="text-3xl font-extrabold mb-3 tracking-tight">
              15 dias grátis, sem cartão de crédito
            </h2>
            <p className="text-[#EAD8C2] text-base mb-8 max-w-md mx-auto">
              Experimente o PadariaGest sem risco. Cancele a qualquer momento.
            </p>
            <ul className="inline-flex flex-col gap-3 text-left mb-10">
              {benefits.map(b => (
                <li key={b} className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 bg-white/15 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <Link
              href="/cadastro"
              className="inline-block bg-[#B8662D] hover:bg-[#9B5529] text-white font-semibold px-8 py-3.5 rounded-xl text-base transition shadow-md"
            >
              Começar agora grátis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#FFF8EC] border-t border-[#EAD9C3] py-20">
        <div className="max-w-md mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-[#2E2925] mb-2">Preço simples</h2>
          <p className="text-[#6b5a47] text-sm mb-10">
            Um único plano com tudo incluso. Sem surpresas na fatura.
          </p>

          <div className="bg-white rounded-2xl border border-[#EAD9C3] p-8 text-left shadow-sm">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-[#2E2925] mb-1">
                R$ 89
                <span className="text-xl font-normal text-[#6b5a47]">/mês</span>
              </div>
              <p className="text-sm text-[#6b5a47]">após os 15 dias de trial gratuito</p>
            </div>

            <ul className="space-y-3 mb-8">
              {benefits.map(b => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-[#2E2925]">
                  <div className="w-4 h-4 bg-[#B8662D]/15 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-[#B8662D]" />
                  </div>
                  {b}
                </li>
              ))}
            </ul>

            <Link
              href="/cadastro"
              className="block w-full bg-[#B8662D] hover:bg-[#9B5529] text-white font-semibold py-3.5 rounded-xl text-sm transition text-center shadow-sm"
            >
              Começar 15 dias grátis
            </Link>
            <p className="text-center text-xs text-[#6b5a47] mt-3">
              Sem cartão de crédito · Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#EAD9C3] bg-[#FFF8EC] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#6b5a47]">
          <BrandLogo />
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[#493329] transition">Entrar</Link>
            <Link href="/cadastro" className="hover:text-[#493329] transition">Criar conta</Link>
            <Link href="/recuperar-senha" className="hover:text-[#493329] transition">Recuperar senha</Link>
          </div>
          <span>© 2026 PadariaGest · Todos os direitos reservados</span>
        </div>
      </footer>

    </div>
  )
}
