import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className }: LogoProps) {
  const heights = {
    sm: 'h-10',
    md: 'h-14',
    lg: 'h-20',
  }[size]

  return (
    <Image
      src="/logo-cb.png"
      alt="Começa Bem"
      width={927}
      height={320}
      className={cn(' object-contain', heights, className)}
      priority
    />
  )
}
