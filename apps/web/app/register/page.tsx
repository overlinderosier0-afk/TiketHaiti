'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { ErrorBox, Field, PrimaryButton, inputCls } from '../../components/ui';

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

  return (
    <section className="container flex justify-center py-20">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-campy">Tikè Ayiti</p>
            <h1 className="mt-3 text-4xl font-black text-slate-900">Créer mon compte</h1>
            <p className="mt-2 text-sm font-bold text-slate-500">Gratuit, en moins d'une minute.</p>
          </div>
          <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-campy">Gratuit</span>
        </div>

        <form onSubmit={submit} className="mt-8 grid gap-5 md:grid-cols-2">
          {error && <div className="md:col-span-2"><ErrorBox>{error}</ErrorBox></div>}
          <Field label="Prénom">
            <input className={inputCls} type="text" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </Field>
          <Field label="Nom">
            <input className={inputCls} type="text" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </Field>
          <Field label="Email" className="md:col-span-2">
            <input className={inputCls} type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label={<>Téléphone <span className="font-normal text-slate-400">(optionnel)</span></>} className="md:col-span-2">
            <input className={inputCls} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label={<>Mot de passe <span className="font-normal text-slate-400">(6 caractères min.)</span></>} className="md:col-span-2">
            <input className={inputCls} type="password" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <PrimaryButton disabled={busy} className="w-full hover:scale-[1.02]">
              {busy ? 'Création…' : 'Créer un compte'}
            </PrimaryButton>
          </div>
          <div className="md:col-span-2 text-center text-sm">
            <span className="text-slate-500">Déjà inscrit ?</span>{' '}
            <Link href="/login" className="font-black text-campy">Se connecter</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
