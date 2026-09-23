import './globals.css';
import AdminAwareNav from '../components/AdminAwareNav';
import { AuthProvider } from '../lib/auth';

export const metadata = {
  title: 'Tikè Ayiti — Billets d’événements en Haïti',
  description: 'Concerts, festivals et événements culturels : achetez vos billets en MonCash ou NatCash.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 shadow-sm backdrop-blur">
            <AdminAwareNav />
          </header>
          <main>{children}</main>
          <footer className="mt-20 bg-slate-900 py-12 text-center text-sm text-slate-300">
            <div className="container">
              <p className="text-xl font-black text-white">
                Tikè Ayiti <span className="text-campy">✳</span>
              </p>
              <p className="mt-2 font-bold text-slate-400">Fèt nou, fason nou.</p>
              <p className="mt-4 text-xs text-slate-500">© 2026 · Billets culturels et événements haïtiens</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
