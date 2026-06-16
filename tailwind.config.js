/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Segoe UI',
          'Inter',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Static brand accent (same in both themes)
        accent: '#0071e3',
        accentDark: '#0077ed',
        // Semantic, theme-aware tokens (CSS-variable backed; flip under .dark)
        ink: 'rgb(var(--ink) / <alpha-value>)',
        haze: 'rgb(var(--haze) / <alpha-value>)',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        // `fill` is black in light / white in dark — use at low opacity for
        // subtle backgrounds and hairlines (e.g. bg-fill/5, border-fill/10).
        fill: 'rgb(var(--fill) / <alpha-value>)',
      },
      borderRadius: {
        xl2: '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glass: '0 8px 30px rgba(0,0,0,0.08)',
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        lift: '0 12px 40px rgba(0,0,0,0.14)',
      },
      backdropBlur: { xl: '20px' },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bubble-in': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'bubble-in': 'bubble-in 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};
