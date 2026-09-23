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
          <header className="border-b border-amber-100 bg-white/90 shadow-sm backdrop-blur">
            <AdminAwareNav />
          </header>
          <main>{children}</main>
          <footer className="mt-20 border-t border-amber-200 bg-[#2f3e3a] py-10 text-center text-sm text-amber-50">
            <div className="container">
              <p className="font-black text-xl">Tikè Ayiti</p>
              <p className="mt-2 text-amber-100/90">Fèt nou, fason nou.</p>
              <p className="mt-3 text-xs text-amber-100/70">© 2026 · Billets culturels et événements haïtiens</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
