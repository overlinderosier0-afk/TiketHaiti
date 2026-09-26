'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth';

export default function AdminAwareNav() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="container flex h-20 items-center justify-between">
      <Link href="/" className="text-2xl font-black tracking-tight text-slate-900">
        Tikè Ayiti <span className="text-campy">✳</span>
      </Link>
      <div className="hidden gap-6 text-sm font-bold text-slate-700 md:flex">
        <Link href="/" className="transition hover:text-campy">Accueil</Link>
        <Link href="/events" className="transition hover:text-campy">Événements</Link>
        {user?.role === 'ADMIN' && <Link href="/admin" className="transition hover:text-campy">Admin</Link>}
        <Link href="/tickets" className="transition hover:text-campy">Mes billets</Link>
        <Link href="/profile" className="transition hover:text-campy">Profil</Link>
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
            <Link href="/login" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50">Connexion</Link>
            <Link href="/register" className="rounded-full bg-campy px-5 py-2 text-sm font-black text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-campyDark">Créer un compte</Link>
          </>
        )}
      </div>
    </nav>
  );
}
