/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cricket: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          neon: '#00ff87',
          glow: '#00df82',
        },
        stadium: {
          950: '#080c10',
          900: '#0c1219',
          850: '#111923',
          800: '#16202c',
          750: '#1c2937',
          700: '#233243',
          600: '#334458',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'neon': '0 0 20px -3px rgba(0, 255, 135, 0.25)',
        'neon-lg': '0 0 30px -4px rgba(0, 255, 135, 0.4)',
        'wicket': '0 0 20px -3px rgba(239, 68, 68, 0.35)',
      }
    },
  },
  plugins: [],
}
