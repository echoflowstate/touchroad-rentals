/** @type {import('tailwindcss').Config} */
const systemStack = [
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
]

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0a0f1c',
          800: '#111a2e',
          700: '#182440',
          600: '#22314f',
        },
        brand: {
          DEFAULT: '#2E6BFF',
          600: '#1F53D8',
          400: '#5C8CFF',
          300: '#8FB0FF',
        },
        surface: '#F7F8FA',
        ink: {
          DEFAULT: '#0F1524',
          muted: '#5B6478',
          faint: '#666E80',
        },
        line: '#E4E7EE',
        mint: {
          DEFAULT: '#12B76A',
          // Darker sibling for text: #12B76A is 2.62:1 on white, below AA.
          ink: '#0A7C48',
        },
      },
      fontFamily: {
        display: ['Archivo', ...systemStack],
        sans: ['Inter', ...systemStack],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 21, 36, 0.04), 0 6px 16px rgba(15, 21, 36, 0.06)',
        'card-hover': '0 2px 6px rgba(15, 21, 36, 0.07), 0 14px 32px rgba(15, 21, 36, 0.13)',
        sheet: '0 -18px 52px rgba(10, 15, 28, 0.24)',
        glow: '0 0 120px 44px rgba(46, 107, 255, 0.18)',
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      maxWidth: {
        shell: '76rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-slide': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.96)' },
          '60%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)' },
        },
        'roll-up': {
          '0%': { opacity: '0', transform: 'translateY(55%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        'fade-slide': 'fade-slide 240ms ease-out both',
        pop: 'pop 220ms ease-out',
        'roll-up': 'roll-up 420ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'sheet-up': 'sheet-up 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fade-in 200ms ease-out both',
      },
    },
  },
  plugins: [],
}
