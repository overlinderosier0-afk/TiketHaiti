'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../lib/auth';

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

export default function AdminAwareNav() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/events', label: 'Événements' },
    { href: '/tickets', label: 'Mes billets' },
    { href: '/#comment-ca-marche', label: 'Comment ça marche' },
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin' }] : [])
  ];

  return (
    <div className="font-ed">
      <nav className="container flex h-[72px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-xl font-black tracking-tight text-ed-ink">
            TIKE<span className="text-ed-red">AYITI</span>
          </span>
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[0.95rem] font-bold uppercase tracking-wide text-ed-ink transition hover:text-ed-red"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <span className="hidden text-sm font-bold text-ed-ink sm:block">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={logout}
                className="bg-ed-ink px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-ed-paper transition hover:bg-ed-red"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden border-2 border-ed-ink bg-ed-paper px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-ed-ink transition hover:bg-ed-ink hover:text-ed-paper sm:block"
              >
                Connexion
              </Link>
              <Link
                href="/events"
                className="hidden bg-ed-red px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-ed-ink sm:block"
              >
                Billets
              </Link>
            </>
          )}
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            className="flex h-11 w-11 items-center justify-center border-2 border-ed-ink text-ed-ink transition hover:bg-ed-ink hover:text-ed-paper md:hidden"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 4l12 12M16 4L4 16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-t-2 border-ed-ink bg-ed-paper shadow-xl md:hidden">
          <div className="container flex flex-col py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3.5 text-base font-bold uppercase tracking-wide text-ed-ink transition hover:text-ed-red"
              >
                {l.label}
              </Link>
            ))}
            {!loading && !user && (
              <div className="mt-2 flex gap-3 border-t border-ed-rule px-4 pb-2 pt-4">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 border-2 border-ed-ink px-4 py-3 text-center text-sm font-extrabold uppercase tracking-wide text-ed-ink"
                >
                  Connexion
                </Link>
                <Link
                  href="/events"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-ed-red px-4 py-3 text-center text-sm font-extrabold uppercase tracking-wide text-white"
                >
                  Billets
                </Link>
              </div>
            )}
            {!loading && user && (
              <div className="mt-2 border-t border-ed-rule px-4 pb-2 pt-4">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="block bg-ed-ink px-4 py-3 text-center text-sm font-extrabold uppercase tracking-wide text-ed-paper"
                >
                  Mon profil
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
