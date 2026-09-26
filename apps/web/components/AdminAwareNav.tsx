'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../lib/auth';

export default function AdminAwareNav() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/', label: 'Accueil' },
    { href: '/events', label: 'Événements' },
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin' }] : []),
    { href: '/tickets', label: 'Mes billets' },
    { href: '/profile', label: 'Profil' },
  ];

  return (
    <>
      <nav className="container flex h-20 items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tight text-slate-900">
          Tikè Ayiti <span className="text-campy">✳</span>
        </Link>
        <div className="hidden gap-6 text-sm font-bold text-slate-700 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-campy">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <span className="hidden text-sm font-bold text-slate-700 sm:block">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:block">Connexion</Link>
              <Link href="/register" className="hidden rounded-full bg-campy px-5 py-2 text-sm font-black text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-campyDark sm:block">Créer un compte</Link>
            </>
          )}
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-800 transition hover:bg-slate-50 md:hidden"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 4l12 12M16 4L4 16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            )}
          </button>
        </div>
      </nav>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-t border-slate-100 bg-white shadow-xl md:hidden">
          <div className="container flex flex-col py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base font-bold text-slate-800 transition hover:bg-slate-50 hover:text-campy active:bg-slate-100"
              >
                {l.label}
              </Link>
            ))}
            {!loading && !user && (
              <div className="mt-2 flex gap-3 border-t border-slate-100 px-4 pt-4 pb-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-black text-slate-700"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full bg-campy px-4 py-3 text-center text-sm font-black text-white shadow-md shadow-blue-200"
                >
                  Créer un compte
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
