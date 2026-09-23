'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { ErrorBox, Field, PrimaryButton, inputCls } from '../../components/ui';

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
      <div className="w-full max-w-md rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-campy">Tikè Ayiti</p>
          <h1 className="mt-4 text-3xl font-black text-slate-900">Bon retour</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">Connecte-toi pour retrouver tes billets.</p>
        </div>
        <form onSubmit={submit} className="mt-8">
          {error && <div className="mb-4"><ErrorBox>{error}</ErrorBox></div>}
          <Field label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputCls} />
          </Field>
          <Field label="Mot de passe" className="mt-4">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className={inputCls} />
          </Field>
          <PrimaryButton disabled={busy} className="mt-7 w-full">
            {busy ? 'Connexion…' : 'Se connecter'}
          </PrimaryButton>
          <div className="mt-5 text-center text-sm">
            <span className="text-slate-500">Pas encore de compte ?</span>{' '}
            <Link href="/register" className="font-black text-campy">Créer un compte</Link>
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
