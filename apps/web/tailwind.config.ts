import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#0d6b53',
        sun: '#f4b942',
        // Palette "landing" inspirée des templates modernes : fond crème + bleu vif.
        campy: '#2f5bff',
        campyDark: '#1e3fae',
        cream: '#fff9f1'
      }
    }
  },
  plugins: []
} satisfies Config;
