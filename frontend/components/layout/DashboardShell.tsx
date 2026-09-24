'use client'

import { useState } from 'react'
import { Menu, Cookie } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { TrialBanner } from './TrialBanner'
import { useAuthStore } from '@/store/auth'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthStore()

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-primary-dark flex items-center gap-3 px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
            <Cookie className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">{user?.empresaNome ?? 'Panificadora'}</span>
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
