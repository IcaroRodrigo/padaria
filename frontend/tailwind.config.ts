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
          DEFAULT: '#4a7c2f',
          dark: '#3a6124',
          light: '#6da044',
          foreground: '#ffffff',
        },
        golden: '#c49a3c',
        cream: '#f5f0e8',
        border: '#e2d9c5',
        input: '#e2d9c5',
        ring: '#4a7c2f',
        background: '#f5f0e8',
        foreground: '#1a1a1a',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1a1a1a',
        },
        muted: {
          DEFAULT: '#f0ebe0',
          foreground: '#6b6b6b',
        },
        accent: {
          DEFAULT: '#6da044',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#16a34a',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#c49a3c',
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
