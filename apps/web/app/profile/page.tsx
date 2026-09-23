'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

interface OrderItem {
  id: string;
  totalAmount: number;
  quantity: number;
  paymentStatus: string;
  createdAt: string;
  event: { title: string; eventDate: string };
}

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || ''
    });
    api<OrderItem[]>('/orders/my')
      .then(setOrders)
      .catch((e: any) => setError(e?.message || 'Chargement impossible'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    setError('');
    try {
      await api('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined
        })
      });
      await refresh();
      setEditing(false);
      setSavedMsg('✅ Profil mis à jour');
    } catch (err: any) {
      setError(err?.message || 'Mise à jour impossible');
    } finally {
      setSaving(false);
    }
  }

  if (!loading && !user) {
    return (
      <section className="container py-14">
        <h1 className="text-4xl font-black">Mon profil</h1>
        <p className="mt-4 text-slate-600">Connectez-vous pour voir votre profil.</p>
        <Link href="/login?next=/profile" className="mt-4 inline-block rounded-full bg-brand px-6 py-3 font-black text-white">Se connecter</Link>
      </section>
    );
  }

  const input = 'w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand';

  return (
    <section className="container py-14">
      <h1 className="text-4xl font-black">Mon profil</h1>
      {savedMsg && <p className="mt-4 font-bold text-emerald-700">{savedMsg}</p>}

      {user && (
        <div className="mt-8 rounded-3xl bg-white p-7 shadow">
          {!editing ? (
            <>
              <p className="text-sm text-slate-500">Compte connecté</p>
              <h2 className="mt-2 text-2xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="mt-1 text-slate-600">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
              <button
                onClick={() => setEditing(true)}
                className="mt-5 rounded-full border border-brand px-5 py-2 text-sm font-black text-brand transition hover:bg-brand hover:text-white"
              >
                Modifier mon profil
              </button>
            </>
          ) : (
            <form onSubmit={saveProfile} className="grid gap-4">
              <h2 className="text-xl font-black">Modifier mon profil</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold">Prénom
                  <input className={input} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                </label>
                <label className="text-sm font-bold">Nom
                  <input className={input} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                </label>
              </div>
              <label className="text-sm font-bold">Email
                <input className={input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </label>
              <label className="text-sm font-bold">Téléphone
                <input className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ex. +509…" />
              </label>
              <div className="flex gap-3">
                <button disabled={saving} className="rounded-full bg-brand px-6 py-2 font-black text-white transition hover:bg-[#ba5521] disabled:opacity-60">
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-slate-200 px-6 py-2 font-black text-slate-500">
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <h2 className="mt-10 text-2xl font-black">Mes commandes</h2>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}
      {orders.length === 0 && !error && (
        <p className="mt-4 text-slate-500">Aucune commande pour le moment.</p>
      )}
      <div className="mt-4 space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between rounded-2xl border border-amber-100 bg-white p-4">
            <div>
              <p className="font-bold">{o.event.title}</p>
              <p className="text-sm text-slate-500">
                {new Date(o.event.eventDate).toLocaleDateString('fr-FR')} · {o.quantity} billet(s) · {o.totalAmount.toLocaleString('fr-FR')} HTG
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${
              o.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
              o.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {o.paymentStatus}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
