/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#f8f9fa',
        darkCard: '#ffffff',
        darkBorder: 'rgba(0, 0, 0, 0.08)',
        customBlue: '#3B82F6',
        customPurple: '#8B5CF6',
        customGreen: '#22C55E',
        customOrange: '#F59E0B',
        customRed: '#EF4444',
        brandTeal: '#0D7A73',
        brandTealHover: '#0a5d58',
        slate: {
          50: '#0f172a',
          100: '#1e293b',
          200: '#334155',
          300: '#475569',
          400: '#64748b',
          500: '#94a3b8',
          600: '#cbd5e1',
          700: '#e2e8f0',
          800: '#f1f5f9',
          900: '#ffffff',
          950: '#f8f9fa',
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
