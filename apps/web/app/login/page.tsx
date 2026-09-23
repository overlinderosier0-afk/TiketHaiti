'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { useAuth } from '../../lib/auth';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/events';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      router.push(next);
    } catch (err: any) {
      setError(err?.message || 'Connexion impossible');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container flex justify-center py-20">
      <div className="w-full max-w-md rounded-[2rem] border border-amber-100 bg-white p-8 shadow-xl">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-brand">Tikè Ayiti</p>
          <h1 className="mt-4 text-3xl font-black">Bon retour</h1>
        </div>
        <form onSubmit={submit} className="mt-8">
          {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
          <label className="block text-sm font-bold">
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand" />
          </label>
          <label className="mt-4 block text-sm font-bold">
            Mot de passe
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand" />
          </label>
          <button disabled={busy} className="mt-7 w-full rounded-full bg-brand p-3 font-black text-white transition hover:bg-[#ba5521] disabled:opacity-60">
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
          <div className="mt-5 text-center text-sm">
            <span className="text-slate-500">Pas encore de compte ?</span>{' '}
            <Link href="/register" className="font-black text-brand">Créer un compte</Link>
          </div>
        </form>
      </div>
    </section>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<section className="container py-20">Chargement…</section>}>
      <LoginForm />
    </Suspense>
  );
}
