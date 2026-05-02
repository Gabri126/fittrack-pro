/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        accentBlue: '#0A84FF',
        accentOrange: '#FF9F0A',
        surface: '#1C1C1E',
        surfaceHover: '#2C2C2E',
        border: '#38383A',
        muted: '#8E8E93',
      },
      borderRadius: {
        '4xl': '32px',
        '3xl': '24px',
        '2xl': '16px',
        'xl': '12px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'soft': '0 4px 24px -4px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
