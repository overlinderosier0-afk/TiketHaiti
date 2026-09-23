'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { EmptyState, ErrorBox, Field, GhostButton, PageHead, PrimaryButton, StatusPill, inputCls } from '../../components/ui';

interface ManualPaymentInfo {
  provider: string;
  providerLabel: string;
  merchantNumber: string;
  reference: string | null;
  amount: number;
  expiresAt: string | null;
  instructions: string;
}

interface OrderItem {
  id: string;
  total: number;
  quantity: number;
  paymentStatus: string;
  paymentReference: string | null;
  paymentMethod: string | null;
  expiresAt: string | null;
  createdAt: string;
  event: { title: string; eventDate: string };
  manualPayment: ManualPaymentInfo | null;
}

function copyText(text: string, done: () => void) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(done).catch(done);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    done();
  }
}

function orderTone(status: string): 'green' | 'amber' | 'red' | 'slate' {
  if (status === 'PAID') return 'green';
  if (status === 'PENDING') return 'amber';
  if (status === 'CANCELLED') return 'red';
  return 'slate';
}

function orderLabel(status: string): string {
  if (status === 'PAID') return 'Payée';
  if (status === 'PENDING') return 'En attente';
  if (status === 'CANCELLED') return 'Annulée';
  return status;
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
        <PageHead eyebrow="Compte" title="Mon profil" sub="Connecte-toi pour voir ton profil." />
        <Link href="/login?next=/profile" className="mt-6 inline-flex items-center justify-center rounded-full bg-campy px-7 py-3 font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-campyDark">
          Se connecter
        </Link>
      </section>
    );
  }

  return (
    <section className="container py-14">
      <PageHead eyebrow="Compte" title="Mon profil" />
      {savedMsg && <p className="mt-4 font-bold text-emerald-700">{savedMsg}</p>}

      {user && (
        <div className="mt-8 rounded-[1.8rem] border border-slate-100 bg-white p-7 shadow-sm">
          {!editing ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Compte connecté</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">{user.firstName} {user.lastName}</h2>
                <p className="mt-1 font-bold text-slate-500">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="rounded-full border-2 border-campy px-5 py-2 text-sm font-black text-campy transition hover:bg-campy hover:text-white"
              >
                Modifier mon profil
              </button>
            </div>
          ) : (
            <form onSubmit={saveProfile} className="grid gap-4">
              <h2 className="text-xl font-black text-slate-900">Modifier mon profil</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prénom">
                  <input className={inputCls} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                </Field>
                <Field label="Nom">
                  <input className={inputCls} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                </Field>
              </div>
              <Field label="Email">
                <input className={inputCls} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </Field>
              <Field label="Téléphone">
                <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ex. +509…" />
              </Field>
              <div className="flex gap-3">
                <PrimaryButton disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </PrimaryButton>
                <GhostButton type="button" onClick={() => setEditing(false)}>
                  Annuler
                </GhostButton>
              </div>
            </form>
          )}
        </div>
      )}

      <h2 className="mt-12 text-2xl font-black text-slate-900">Mes commandes</h2>
      {error && <div className="mt-4"><ErrorBox>{error}</ErrorBox></div>}
      {orders.length === 0 && !error && (
        <div className="mt-4">
          <EmptyState
            title="Aucune commande pour le moment"
            text="Tes commandes apparaîtront ici après ton premier achat."
            actionHref="/events"
            actionLabel="Voir les événements"
          />
        </div>
      )}
      <div className="mt-4 space-y-3">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    </section>
  );
}

function OrderCard({ order: o }: { order: OrderItem }) {
  const [copied, setCopied] = useState(false);
  const pending = o.paymentStatus === 'PENDING' && o.manualPayment;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-black text-slate-900">{o.event.title}</p>
          <p className="text-sm font-bold text-slate-500">
            {new Date(o.event.eventDate).toLocaleDateString('fr-FR')} · {o.quantity} billet(s) · {o.total.toLocaleString('fr-FR')} HTG
          </p>
        </div>
        <StatusPill tone={orderTone(o.paymentStatus)}>{orderLabel(o.paymentStatus)}</StatusPill>
      </div>

      {pending && o.manualPayment && (
        <div className="mt-3 rounded-xl border-2 border-campy/20 bg-blue-50/60 p-4">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-campy">
            💳 Paiement {o.manualPayment.providerLabel} en attente
          </p>
          <p className="mt-2 text-sm font-bold text-slate-600">{o.manualPayment.instructions}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Numéro marchand</p>
              <p className="mt-1 font-mono text-lg font-black text-slate-900">
                {o.manualPayment.merchantNumber || 'À configurer'}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Référence (note du transfert)</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="font-mono text-lg font-black text-campy">{o.manualPayment.reference}</p>
                {o.manualPayment.reference && (
                  <button
                    onClick={() => copyText(o.manualPayment!.reference!, () => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    })}
                    className="rounded-full bg-campy px-3 py-1 text-xs font-black text-white transition hover:bg-campyDark"
                  >
                    {copied ? 'Copié ✓' : 'Copier'}
                  </button>
                )}
              </div>
            </div>
          </div>
          {o.manualPayment.expiresAt && (
            <p className="mt-2 text-xs font-bold text-amber-600">
              ⏳ À régler avant le {new Date(o.manualPayment.expiresAt).toLocaleString('fr-FR')}, sinon la commande est annulée.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
