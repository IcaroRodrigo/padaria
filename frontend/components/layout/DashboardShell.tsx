'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Menu, Cookie } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { TrialBanner } from './TrialBanner'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthStore()
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
    enabled: !!user,
  })
  const storeName = settings?.store_name || user?.empresaNome || 'Minha Padaria'

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-primary-dark flex items-center gap-3 px-4 border-b border-[#493329]/20">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[#493329]/70 hover:text-[#493329] hover:bg-[#493329]/10 transition"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Cookie className="w-4 h-4 text-white" />
          </div>
          <span className="text-[#493329] font-bold text-sm">{storeName}</span>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-cream overflow-auto pt-14 md:pt-0">
        <TrialBanner />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
