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
      <div className="w-full max-w-2xl border-2 border-ed-ink bg-white p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="ed-kicker">Tikè Ayiti</p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-ed-ink">Créer mon compte</h1>
            <p className="mt-2 text-sm font-bold text-ed-muted">Gratuit, en moins d'une minute.</p>
          </div>
          <span className="border-[1.5px] border-ed-ink px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-ed-ink">Gratuit</span>
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
          <Field label={<>Téléphone <span className="font-normal normal-case tracking-normal text-ed-muted">(optionnel)</span></>} className="md:col-span-2">
            <input className={inputCls} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label={<>Mot de passe <span className="font-normal normal-case tracking-normal text-ed-muted">(6 caractères min.)</span></>} className="md:col-span-2">
            <input className={inputCls} type="password" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <PrimaryButton disabled={busy} className="w-full">
              {busy ? 'Création…' : 'Créer un compte'}
            </PrimaryButton>
          </div>
          <div className="md:col-span-2 text-center text-sm">
            <span className="text-ed-muted">Déjà inscrit ?</span>{' '}
            <Link href="/login" className="font-extrabold uppercase tracking-widest text-ed-red hover:text-ed-ink">Se connecter</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
