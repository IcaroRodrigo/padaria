import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#B8662D',
          dark: '#EAD8C2',
          light: '#d4845a',
          foreground: '#FFF8EC',
        },
        cream: '#FFF8EC',
        border: '#EAD9C3',
        input: '#EAD9C3',
        ring: '#B8662D',
        background: '#FFF8EC',
        foreground: '#2E2925',
        card: {
          DEFAULT: '#FFFEFB',
          foreground: '#2E2925',
        },
        muted: {
          DEFAULT: '#f5ece0',
          foreground: '#6b5a47',
        },
        accent: {
          DEFAULT: '#B8662D',
          foreground: '#FFF8EC',
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#43805A',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#d4845a',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addUtilities }: { addUtilities: (u: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.safe-area-bottom': { paddingBottom: 'env(safe-area-inset-bottom, 0px)' },
        '.safe-area-top': { paddingTop: 'env(safe-area-inset-top, 0px)' },
      })
    },
  ],
}

export default config
