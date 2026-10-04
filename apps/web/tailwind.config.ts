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
        // Thème v3 "bleu corporate" : bleu roi #2F5BFF + blanc/bleu très clair,
        // fini l'ambre/doré dans l'interface publique.
        tike: {
          bg: '#F7FAFF',
          ink: '#0F172A',
          muted: '#64748B',
          violet: '#2F5BFF',
          pink: '#1E3FAE',
          amber: '#F4B942'
        },
        // Direction éditoriale v2 (landing 2026-10-03) : papier clair + encre + vermillon.
        ed: {
          paper: '#FAF6EF',
          ink: '#16130E',
          red: '#D93A2B',
          muted: '#6B6355',
          rule: '#D8D0BF'
        }
      },
      fontFamily: {
        display: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        ed: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        tike: '0 20px 45px -18px rgba(47,91,255,.22)'
      }
    }
  },
  plugins: []
} satisfies Config;
