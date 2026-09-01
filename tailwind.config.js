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
        aviation: {
          dark: '#0B111E',
          card: '#131D31',
          cardHover: '#18243D',
          border: '#1E2D4A',
          borderLight: '#2A3C63',
          textMuted: '#8E9EB5',
          textLight: '#E2E8F0',
        },
        boeing: {
          DEFAULT: '#005DAA',
          light: '#2D8FE6',
          dark: '#003E73',
          glow: 'rgba(45, 143, 230, 0.25)',
          bg: '#0B2341'
        },
        airbus: {
          DEFAULT: '#00205B',
          cyan: '#0099FF',
          accent: '#38BDF8',
          teal: '#06B6D4',
          glow: 'rgba(56, 189, 248, 0.25)',
          bg: '#08253B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
