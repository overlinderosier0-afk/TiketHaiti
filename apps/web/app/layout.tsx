import './globals.css';
import Link from 'next/link';
import AdminAwareNav from '../components/AdminAwareNav';
import DevWarningBanner from '../components/DevWarningBanner';
import { AuthProvider } from '../lib/auth';

const SITE_URL = 'https://tikeayiti.com';
const SITE_DESC =
  'Tes billets pour les plus beaux événements d’Haïti. Paie avec MonCash ou NatCash, reçois ton billet QR par email.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Tikè Ayiti — Tikè ou, nan poch ou',
  description: SITE_DESC,
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Tikè Ayiti',
    title: 'Tikè Ayiti — Tikè ou, nan poch ou',
    description: SITE_DESC,
    locale: 'fr_HT'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tikè Ayiti — Tikè ou, nan poch ou',
    description: SITE_DESC
  },
  robots: {
    index: true,
    follow: true
  }
};

function LogoMark() {
  return (
    <span className="grid h-10 w-10 place-items-center bg-ed-ink">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FAF6EF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-5z" />
        <path d="M13 5v2M13 11v2M13 17v2" />
      </svg>
    </span>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ht">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Inter:wght@400;500;600;700&family=Archivo:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <header className="sticky top-0 z-50 border-b-2 border-ed-ink bg-ed-paper/95 backdrop-blur">
            <AdminAwareNav />
          </header>
          <DevWarningBanner />
          <main>{children}</main>
          <footer className="border-t-2 border-ed-ink bg-ed-paper font-ed">
            <div className="container flex flex-wrap items-center justify-between gap-4 py-10">
              <Link href="/" className="flex items-center gap-2.5">
                <LogoMark />
                <span className="text-xl font-black tracking-tight text-ed-ink">
                  TIKE<span className="text-ed-red">AYITI</span>
                </span>
              </Link>
              <div className="flex gap-6">
                {[
                  ['Événements', '/events'],
                  ['Mes billets', '/tickets'],
                  ['Contact', '/profile'],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-sm font-bold uppercase tracking-wide text-ed-muted transition hover:text-ed-red"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <p className="text-sm text-ed-muted">
                © 2026 Tikè Ayiti. Fait avec fierté en Haïti.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
