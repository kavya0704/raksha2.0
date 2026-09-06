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
        tactical: {
          bg: "#0B0F17",
          card: "#111827",
          border: "#1F2937",
          accent: "#06B6D4",      // Cyan
          success: "#10B981",     // Emerald (Safe / Synced)
          warning: "#F59E0B",     // Amber (Delayed / Warning)
          danger: "#EF4444",      // Red (Critical Threat)
          muted: "#64748B",
          panel: "#0F172A"
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
