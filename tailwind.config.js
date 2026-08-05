/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        card: '#0F172A',
        border: '#1E293B',
        primary: {
          DEFAULT: '#22D3EE',
          light: '#67E8F9',
          dark: '#06B6D4',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
        },
        // Legacy aliases (Cyber-Slate)
        slate: { bg: '#020617', card: '#0F172A', border: '#1E293B' },
        cyber: { accent: '#22D3EE', text: '#F8FAFC', muted: '#94A3B8' },
        status: {
          active: '#22D3EE',
          completed: '#10B981',
          pending: '#F59E0B',
          rejected: '#EF4444',
          inactive: '#64748B',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { glow: '0 0 20px rgba(34, 211, 238, 0.15)' },
    },
  },
  plugins: [],
};
