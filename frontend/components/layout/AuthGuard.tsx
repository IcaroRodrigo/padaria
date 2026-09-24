'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Leaf } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (user?.role === 'SUPER_ADMIN') {
      router.replace('/admin')
      return
    }
    if (user?.role === 'OPERATOR' && window.location.pathname === '/dashboard') {
      router.replace('/pdv')
    }
  }, [hasHydrated, isAuthenticated, user, router])

  // Aguarda Zustand reidratar o localStorage antes de qualquer decisão
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-3">
        <Leaf className="w-10 h-10 text-primary animate-pulse" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!isAuthenticated || user?.role === 'SUPER_ADMIN') {
    return null
  }

  return <>{children}</>
}
