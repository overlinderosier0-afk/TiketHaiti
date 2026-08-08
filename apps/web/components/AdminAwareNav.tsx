'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminAwareNav() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedRole = window.localStorage.getItem('tikeAyiti.role') || 'PUBLIC';
    setIsAdmin(storedRole === 'ADMIN');
  }, []);

  return (
    <nav className="container flex h-20 items-center justify-between">
      <Link href="/" className="text-2xl font-black text-brand tracking-tight">Tikè Ayiti</Link>
      <div className="hidden gap-6 text-sm font-bold md:flex">
        <Link href="/events" className="transition hover:text-brand">Événements</Link>
        {isAdmin && <Link href="/admin" className="transition hover:text-brand">Admin</Link>}
        <Link href="/tickets" className="transition hover:text-brand">Mes billets</Link>
        <Link href="/profile" className="transition hover:text-brand">Profil</Link>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/login" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black hover:bg-slate-50">Connexion</Link>
        <Link href="/register" className="rounded-full bg-brand px-5 py-2 text-sm font-black text-white transition hover:bg-[#ba5521]">Créer un compte</Link>
      </div>
    </nav>
  );
}
