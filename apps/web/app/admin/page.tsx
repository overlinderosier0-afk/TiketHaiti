'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const role = window.localStorage.getItem('tikeAyiti.role') || 'PUBLIC';
    setIsAdmin(role === 'ADMIN');
  }, []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(true);
  }

  if (!isAdmin) {
    return (
      <section className="container py-20">
        <div className="rounded-[2rem] border border-red-100 bg-white p-12 text-center shadow-xl">
          <p className="font-black uppercase tracking-[0.24em] text-brand">Accès réservé</p>
          <h1 className="mt-4 text-4xl font-black">Espace administrateur</h1>
          <p className="mt-4 text-slate-600">Cette zone est uniquement visible pour les comptes avec rôle administrateur.</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/login" className="rounded-full bg-brand px-6 py-3 font-black text-white">Se connecter</Link>
            <Link href="/events" className="rounded-full border border-slate-300 px-6 py-3 font-black text-slate-700">Retour aux événements</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-14">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-black uppercase tracking-[0.2em] text-brand">Espace admin</p>
          <h1 className="mt-2 text-4xl font-black">Publier un événement</h1>
        </div>
        <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white">Admin</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={onSubmit} className="rounded-[2rem] border border-amber-100 bg-white p-8 shadow-xl">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-black">Titre de l’événement</span>
              <input className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand" required />
            </label>
            <label className="block">
              <span className="text-sm font-black">Région / Zone</span>
              <input className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand" placeholder="Port-au-Prince" required />
            </label>
            <label className="block">
              <span className="text-sm font-black">Catégorie</span>
              <select className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand" required>
                <option>Concert</option>
                <option>Culture</option>
                <option>Festival</option>
                <option>Conférence</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-black">Date</span>
              <input type="date" className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand" required />
            </label>
            <label className="block">
              <span className="text-sm font-black">Prix (HTG)</span>
              <input type="number" min="0" className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand" required />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-black">Description</span>
              <textarea className="mt-2 min-h-[160px] w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand" required />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <button className="rounded-full bg-brand px-7 py-3 font-black text-white transition hover:bg-[#ba5521]">
              Publier l’événement
            </button>
            <button type="button" className="rounded-full border border-slate-300 px-7 py-3 font-black text-slate-700 transition hover:bg-slate-50">
              Enregistrer comme brouillon
            </button>
          </div>

          {saved && (
            <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-900">
              Événement publié avec succès.
            </div>
          )}
        </form>

        <aside className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-200">Tableau</p>
          <h2 className="mt-2 text-3xl font-black">Statistiques</h2>
          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white/70">Événements</span>
                <span className="font-black text-2xl">08</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white/70">Billets vendus</span>
                <span className="font-black text-2xl">326</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white/70">Paiements actifs</span>
                <span className="font-black text-2xl">2</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
