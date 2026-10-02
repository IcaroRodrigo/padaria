'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Receipt,
  BarChart3,
  LogOut,
  Cookie,
  Settings,
  FileText,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
  { href: '/pdv', label: 'PDV / Caixa', icon: ShoppingCart, adminOnly: false },
  { href: '/produtos', label: 'Produtos', icon: Package, adminOnly: false },
  { href: '/clientes', label: 'Clientes', icon: Users, adminOnly: false },
  { href: '/fornecedores', label: 'Fornecedores', icon: Truck, adminOnly: true },
  { href: '/despesas', label: 'Despesas', icon: Receipt, adminOnly: true },
  { href: '/notas-fiscais', label: 'Notas Fiscais', icon: FileText, adminOnly: true },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3, adminOnly: true },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, adminOnly: true },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
    enabled: !!user,
  })
  const storeName = settings?.store_name || user?.empresaNome || 'Minha Padaria'

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-[#493329]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Cookie className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[#493329] font-bold text-base leading-tight">{storeName}</div>
            <div className="text-[#493329]/60 text-xs">Sistema de Gestão</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[#493329]/70 hover:text-[#493329] hover:bg-[#493329]/10 transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-[#9B5529] text-white'
                  : 'text-[#493329] hover:bg-[#493329]/10 hover:text-[#493329]',
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-[#493329]/20">
        <div className="px-3 py-2 mb-1">
          <div className="text-[#493329] text-sm font-medium truncate">{user?.name}</div>
          <div className="text-[#493329]/60 text-xs">
            {user?.role === 'ADMIN' ? 'Administrador' : 'Operador'}
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-[#493329] hover:bg-[#493329]/10 transition-all"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </>
  )
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex w-64 min-h-screen bg-primary-dark flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar — slide-in drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 bg-primary-dark flex flex-col md:hidden transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  )
}
