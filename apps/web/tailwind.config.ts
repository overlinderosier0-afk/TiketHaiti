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
        // Thème v2 "sunset" : violet / rose / ambre.
        tike: {
          bg: '#FBFAFF',
          ink: '#221D33',
          muted: '#6F6A85',
          violet: '#7C3AED',
          pink: '#EC4899',
          amber: '#F59E0B'
        }
      },
      fontFamily: {
        display: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        tike: '0 20px 45px -18px rgba(124,58,237,.22)'
      }
    }
  },
  plugins: []
} satisfies Config;
