'use client';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <section className="container flex justify-center py-20">
      <div className="w-full max-w-2xl rounded-[2rem] border border-amber-200 bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-brand">Tikè Ayiti</p>
            <h1 className="mt-3 text-4xl font-black">Créer mon compte</h1>
          </div>
          <span className="rounded-full bg-brand px-4 py-2 text-xs font-black text-white">MVP</span>
        </div>

        <form className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-bold md:col-span-1">
            Prénom
            <input className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand" type="text" required />
          </label>
          <label className="block text-sm font-bold md:col-span-1">
            Nom
            <input className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand" type="text" required />
          </label>
          <label className="block text-sm font-bold md:col-span-2">
            Email
            <input className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand" type="email" required />
          </label>
          <label className="block text-sm font-bold md:col-span-2">
            Mot de passe
            <input className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand" type="password" required />
          </label>
          <div className="md:col-span-2">
            <button className="w-full rounded-full bg-brand px-6 py-3 font-black text-white transition hover:bg-brand-dark hover:scale-[1.02]">
              Créer un compte
            </button>
          </div>
          <div className="md:col-span-2 text-center text-sm">
            <span className="text-slate-500">Déjà inscrit ?</span>{' '}
            <Link href="/login" className="font-black text-brand">Se connecter</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
