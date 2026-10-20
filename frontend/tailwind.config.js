/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        sidebar: {
          bg: '#0c1322',
          card: '#152033',
          border: '#1e293b',
          hover: '#1e293b',
          text: '#94a3b8',
          active: '#38bdf8'
        },
        status: {
          approve: '#10b981',
          verify: '#f59e0b',
          block: '#ef4444',
        },
        ink: '#07080a',
        'ink-2': '#0c0d12',
        bone: '#f4f4f5',
        mist: '#a1a1aa',
        dim: '#71717a',
        line: 'rgba(255, 255, 255, 0.08)',
        'line-strong': 'rgba(255, 255, 255, 0.16)',
        surface: 'rgba(255, 255, 255, 0.03)',
        tide: '#8b5cf6',
        foam: '#8bf3e6',
        synapse: {
          violet: '#8b5cf6',
          indigo: '#6366f1',
          cyan: '#8bf3e6',
          glow: 'rgba(139, 92, 246, 0.22)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
