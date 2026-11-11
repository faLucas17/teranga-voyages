/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Charte Teranga Voyages : bleu Bic, bleu clair, blanc
        bic: {
          50: '#EEF3FF',
          100: '#D9E4FF',
          200: '#B3C8FF',
          300: '#7FA2F5',
          400: '#3D6FE0',
          500: '#0A4FD1',
          600: '#0039A6', // bleu Bic (couleur principale)
          700: '#002B7F',
          800: '#001F5C',
          900: '#00143D',
        },
        sky: {
          50: '#F2FAFE',
          100: '#E6F4FD', // bleu très clair (fonds)
          200: '#BEE3F8',
          300: '#8DCDF2',
          400: '#4FB3E8', // bleu clair (accent)
          500: '#2A9BD8',
          600: '#1A7DB5',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 30px -12px rgba(0, 57, 166, 0.25)',
      },
    },
  },
  plugins: [],
}
