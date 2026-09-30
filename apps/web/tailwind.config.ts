import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#0d6b53',
        sun: '#f4b942',
        // Palette "landing" inspirée des templates modernes : fond crème + bleu vif.
        campy: '#2f5bff',
        campyDark: '#1e3fae',
        cream: '#fff9f1',
        // Thème v2 : mise en page de la maquette, mais palette d'origine
        // (bleu campy #2F5BFF, bleu foncé #1E3FAE, ambre sun #F4B942).
        tike: {
          bg: '#FFF9F1',
          ink: '#0F172A',
          muted: '#64748B',
          violet: '#2F5BFF',
          pink: '#1E3FAE',
          amber: '#F4B942'
        }
      },
      fontFamily: {
        display: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        tike: '0 20px 45px -18px rgba(47,91,255,.22)'
      }
    }
  },
  plugins: []
} satisfies Config;
