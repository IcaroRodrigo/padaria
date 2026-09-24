import { Check, X } from 'lucide-react'

export const REGRAS_SENHA = [
  { label: 'Mínimo 8 caracteres', test: (s: string) => s.length >= 8 },
  { label: 'Letra maiúscula', test: (s: string) => /[A-Z]/.test(s) },
  { label: 'Letra minúscula', test: (s: string) => /[a-z]/.test(s) },
  { label: 'Número', test: (s: string) => /[0-9]/.test(s) },
  { label: 'Caractere especial', test: (s: string) => /[^A-Za-z0-9]/.test(s) },
]

export function senhaValida(senha: string) {
  return REGRAS_SENHA.every(r => r.test(senha))
}

export function senhaZodRules() {
  return {
    minLength: { value: 8, message: 'A senha deve ter pelo menos 8 caracteres' },
    validate: {
      maiuscula: (v: string) => /[A-Z]/.test(v) || 'A senha deve conter pelo menos uma letra maiúscula',
      minuscula: (v: string) => /[a-z]/.test(v) || 'A senha deve conter pelo menos uma letra minúscula',
      numero: (v: string) => /[0-9]/.test(v) || 'A senha deve conter pelo menos um número',
      especial: (v: string) => /[^A-Za-z0-9]/.test(v) || 'A senha deve conter pelo menos um caractere especial',
    },
  }
}

interface Props {
  senha: string
}

export function PasswordCriteria({ senha }: Props) {
  if (!senha) return null
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
      {REGRAS_SENHA.map(({ label, test }) => {
        const ok = test(senha)
        return (
          <span key={label} className={`flex items-center gap-1 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
            {ok
              ? <Check className="h-3 w-3 shrink-0" />
              : <X className="h-3 w-3 shrink-0" />
            }
            {label}
          </span>
        )
      })}
    </div>
  )
}
