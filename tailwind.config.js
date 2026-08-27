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
        // The car rides the road's actual curve. `drive-across` is expressed in
        // vw so the mapping from animation time to screen position is identical
        // at every viewport width; `road-ride` and `road-tilt` are sampled from
        // the same bezier the road is drawn with, so they stay in register.
        'drive-across': {
          '0%': { transform: 'translateX(-14vw)' },
          '100%': { transform: 'translateX(114vw)' },
        },
        'drive-back': {
          '0%': { transform: 'translateX(114vw) scaleX(-1)' },
          '100%': { transform: 'translateX(-14vw) scaleX(-1)' },
        },
        'road-ride': {
          '0%': { transform: 'translateY(53.3px)' },
          '8%': { transform: 'translateY(53.3px)' },
          '12%': { transform: 'translateY(50.8px)' },
          '16%': { transform: 'translateY(41.8px)' },
          '20%': { transform: 'translateY(33.7px)' },
          '24%': { transform: 'translateY(26.4px)' },
          '28%': { transform: 'translateY(20.0px)' },
          '32%': { transform: 'translateY(14.4px)' },
          '36%': { transform: 'translateY(9.6px)' },
          '40%': { transform: 'translateY(5.6px)' },
          '44%': { transform: 'translateY(2.6px)' },
          '48%': { transform: 'translateY(0.7px)' },
          '52%': { transform: 'translateY(0.3px)' },
          '56%': { transform: 'translateY(1.7px)' },
          '60%': { transform: 'translateY(4.5px)' },
          '64%': { transform: 'translateY(8.6px)' },
          '68%': { transform: 'translateY(13.6px)' },
          '72%': { transform: 'translateY(19.6px)' },
          '76%': { transform: 'translateY(26.4px)' },
          '80%': { transform: 'translateY(33.7px)' },
          '84%': { transform: 'translateY(41.3px)' },
          '88%': { transform: 'translateY(49.2px)' },
          '92%': { transform: 'translateY(51.3px)' },
          '100%': { transform: 'translateY(51.3px)' },
        },
        'road-tilt': {
          '0%': { transform: 'rotate(-7.2deg)' },
          '8%': { transform: 'rotate(-7.2deg)' },
          '12%': { transform: 'rotate(-7.1deg)' },
          '16%': { transform: 'rotate(-6.64deg)' },
          '20%': { transform: 'rotate(-5.94deg)' },
          '24%': { transform: 'rotate(-5.29deg)' },
          '28%': { transform: 'rotate(-4.66deg)' },
          '32%': { transform: 'rotate(-4.06deg)' },
          '36%': { transform: 'rotate(-3.42deg)' },
          '40%': { transform: 'rotate(-2.71deg)' },
          '44%': { transform: 'rotate(-1.92deg)' },
          '48%': { transform: 'rotate(-0.91deg)' },
          '52%': { transform: 'rotate(0.39deg)' },
          '56%': { transform: 'rotate(1.67deg)' },
          '60%': { transform: 'rotate(2.68deg)' },
          '64%': { transform: 'rotate(3.52deg)' },
          '68%': { transform: 'rotate(4.29deg)' },
          '72%': { transform: 'rotate(4.94deg)' },
          '76%': { transform: 'rotate(5.44deg)' },
          '80%': { transform: 'rotate(5.78deg)' },
          '84%': { transform: 'rotate(6deg)' },
          '92%': { transform: 'rotate(6.18deg)' },
          '100%': { transform: 'rotate(6.18deg)' },
        },
        'car-bob': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-1.5px)' },
        },
        'wheel-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'gull-drift': {
          '0%': { transform: 'translate(-8vw, 0)', opacity: '0' },
          '10%, 90%': { opacity: '0.75' },
          '50%': { transform: 'translate(50vw, -14px)' },
          '100%': { transform: 'translate(112vw, 4px)', opacity: '0' },
        },
        'cloud-drift': {
          '0%': { transform: 'translateX(-10vw)' },
          '100%': { transform: 'translateX(110vw)' },
        },
        'water-bob': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'glint-sweep': {
          '0%': { transform: 'translateX(-140%) skewX(-16deg)', opacity: '0' },
          '35%': { opacity: '1' },
          '100%': { transform: 'translateX(240%) skewX(-16deg)', opacity: '0' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-2.2deg)' },
          '50%': { transform: 'rotate(2.2deg)' },
        },
        'float-idle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'drop-in': {
          '0%': { opacity: '0', transform: 'translateY(-22px) scale(0.97)' },
          '65%': { opacity: '1', transform: 'translateY(4px) scale(1.01)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // The trip planner: the car settles onto the pick-up day, the flag
        // plants on the drop-off day, and the road draws itself between them.
        'car-settle': {
          '0%': { opacity: '0', transform: 'translateY(-14px) scale(0.55)' },
          '62%': { opacity: '1', transform: 'translateY(2px) scale(1.06)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'flag-plant': {
          '0%': { opacity: '0', transform: 'scale(0.4) rotate(-14deg)' },
          '70%': { opacity: '1', transform: 'scale(1.12) rotate(4deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        // pathLength is normalized to 1, so the wipe is length independent.
        'road-draw': {
          '0%': { strokeDashoffset: '1' },
          '100%': { strokeDashoffset: '0' },
        },
        'road-flow': {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-0.036' },
        },
        'month-in-right': {
          '0%': { opacity: '0', transform: 'translateX(22px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'month-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-22px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'popover-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.985)' },
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
        'drive-across': 'drive-across 17s linear infinite',
        'road-ride': 'road-ride 17s linear infinite',
        'road-tilt': 'road-tilt 17s linear infinite',
        'road-ride-far': 'road-ride 27s linear infinite',
        'road-tilt-far': 'road-tilt 27s linear infinite',
        'drive-back': 'drive-back 27s linear infinite',
        'car-bob': 'car-bob 1.1s ease-in-out infinite',
        'wheel-spin': 'wheel-spin 0.7s linear infinite',
        'gull-drift': 'gull-drift 26s linear infinite',
        'cloud-drift': 'cloud-drift 70s linear infinite',
        'water-bob': 'water-bob 4.5s ease-in-out infinite',
        'glint-sweep': 'glint-sweep 900ms ease-out',
        sway: 'sway 4s ease-in-out infinite',
        'float-idle': 'float-idle 5.5s ease-in-out infinite',
        'drop-in': 'drop-in 520ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'car-settle': 'car-settle 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'flag-plant': 'flag-plant 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'road-draw': 'road-draw 520ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'road-flow': 'road-flow 1.1s linear infinite',
        'month-in-right': 'month-in-right 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'month-in-left': 'month-in-left 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'popover-in': 'popover-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
