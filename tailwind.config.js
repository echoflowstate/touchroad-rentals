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

/**
 * The Coastal Light system. Every value that sits behind text was measured
 * against WCAG AA before it landed here; the notes record the ratio.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ground: warm sand, lifting to near-white for raised surfaces.
        sand: {
          DEFAULT: '#F7F2E9',
          50: '#FDFBF7',
          100: '#FBF7F0',
          200: '#EFE7D8',
          300: '#E2D6C1',
        },
        // Ink: deep sea green. 14.6:1 on white, 13.1:1 on sand.
        ink: {
          DEFAULT: '#0F2E28',
          muted: '#4A6B62', // 5.88 on white, 5.27 on sand
          faint: '#527066', // 5.43 on white, 4.87 on sand
        },
        // Gulf emerald. The primary is the darkest step of the brand hue that
        // clears AA as text on white and on sand, and as a button fill under
        // white text: 5.75 / 5.15 / 5.75.
        emerald: {
          DEFAULT: '#0B7458',
          deep: '#085943',
          bright: '#0E8C6D', // decoration and illustration only, never behind text
          soft: '#7FC8AE',
          tint: '#E3F0EC',
          wash: '#EAF4F1',
        },
        // Sunset coral, used sparingly. Solid coral carries ink text at 5.17;
        // `graphic` is the drawn-mark step that clears the 3:1 non-text rule.
        coral: {
          DEFAULT: '#FF6B4A',
          graphic: '#F2542E', // 3.45 on white
          ink: '#C63F22', // 5.08 as text on white
          text: '#B33A1F', // 5.23 as text on the coral tint band
          tint: '#FFEDE7',
        },
        // Sun gold lives inside illustrations only.
        gold: {
          DEFAULT: '#FFC65C',
          deep: '#F2A73B',
        },
        aqua: {
          DEFAULT: '#7FD4C8',
          light: '#AEE5DC',
          deep: '#3FA694',
        },
        line: '#E7DFD1',
        'line-soft': '#F0E9DC',
      },
      fontFamily: {
        display: ['Outfit', ...systemStack],
        sans: ['"Plus Jakarta Sans"', ...systemStack],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        // Warm shadows: the shadow of something sitting on sand, not on slate.
        card: '0 1px 2px rgba(47, 36, 20, 0.04), 0 8px 20px rgba(47, 36, 20, 0.06)',
        'card-hover': '0 2px 6px rgba(47, 36, 20, 0.07), 0 18px 38px rgba(47, 36, 20, 0.14)',
        lift: '0 10px 30px rgba(47, 36, 20, 0.12), 0 2px 6px rgba(47, 36, 20, 0.06)',
        sheet: '0 -18px 52px rgba(47, 36, 20, 0.20)',
        tabbar: '0 6px 24px rgba(15, 46, 40, 0.16), 0 1px 3px rgba(15, 46, 40, 0.10)',
        glow: '0 0 90px 30px rgba(255, 198, 92, 0.28)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      maxWidth: {
        shell: '76rem',
      },
      transitionTimingFunction: {
        coast: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-slide': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.96)' },
          '60%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        // The card cascade on a fresh set of results.
        'card-rise': {
          '0%': { opacity: '0', transform: 'translateY(18px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // The $0 line settling like a stamp.
        stamp: {
          '0%': { opacity: '0', transform: 'scale(1.5) rotate(-8deg)' },
          '55%': { opacity: '1', transform: 'scale(0.94) rotate(1.5deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        'sun-pulse': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.06)' },
        },
        'water-shimmer': {
          '0%': { transform: 'translateX(-2%)' },
          '100%': { transform: 'translateX(2%)' },
        },
        'car-drive-in': {
          '0%': { opacity: '0', transform: 'translateX(-140%)' },
          '70%': { opacity: '1', transform: 'translateX(6%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'glare-sweep': {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '100%': { transform: 'translateX(240%) skewX(-18deg)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'icon-bounce': {
          '0%': { transform: 'translateY(0)' },
          '45%': { transform: 'translateY(-4px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'drop-in': {
          '0%': { opacity: '0', transform: 'translateY(-22px) scale(0.97)' },
          '65%': { opacity: '1', transform: 'translateY(4px) scale(1.01)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        'fade-slide': 'fade-slide 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 240ms ease-out both',
        pop: 'pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'sheet-up': 'sheet-up 280ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'card-rise': 'card-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both',
        stamp: 'stamp 460ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'sun-pulse': 'sun-pulse 5s ease-in-out infinite',
        'water-shimmer': 'water-shimmer 7s ease-in-out infinite alternate',
        'car-drive-in': 'car-drive-in 1500ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'glare-sweep': 'glare-sweep 720ms ease-out',
        'toast-in': 'toast-in 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'icon-bounce': 'icon-bounce 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'drop-in': 'drop-in 520ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
    },
  },
  plugins: [],
}
