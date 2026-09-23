'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '../../lib/auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined
      });
      router.push('/events');
    } catch (err: any) {
      setError(err?.message || 'Inscription impossible');
    } finally {
      setBusy(false);
    }
  }

  const input = 'mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand';

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

        <form onSubmit={submit} className="mt-8 grid gap-5 md:grid-cols-2">
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 md:col-span-2">{error}</p>}
          <label className="block text-sm font-bold">
            Prénom
            <input className={input} type="text" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </label>
          <label className="block text-sm font-bold">
            Nom
            <input className={input} type="text" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </label>
          <label className="block text-sm font-bold md:col-span-2">
            Email
            <input className={input} type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
          </label>
          <label className="block text-sm font-bold md:col-span-2">
            Téléphone <span className="font-normal text-slate-400">(optionnel)</span>
            <input className={input} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </label>
          <label className="block text-sm font-bold md:col-span-2">
            Mot de passe <span className="font-normal text-slate-400">(6 caractères min.)</span>
            <input className={input} type="password" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} />
          </label>
          <div className="md:col-span-2">
            <button disabled={busy} className="w-full rounded-full bg-brand px-6 py-3 font-black text-white transition hover:bg-[#ba5521] hover:scale-[1.02] disabled:opacity-60">
              {busy ? 'Création…' : 'Créer un compte'}
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
