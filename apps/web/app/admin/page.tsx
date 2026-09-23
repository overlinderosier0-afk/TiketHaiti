'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

interface Stats {
  totalEvents: number;
  totalTickets: number;
  totalOrders: number;
  revenue: number;
  scannedToday: number;
}

interface AdminEvent {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  ticketsAvailable: number;
  eventDate: string;
  city: { name: string };
}

interface PendingOrder {
  id: string;
  quantity: number;
  total: number;
  paymentMethod: string | null;
  paymentReference: string | null;
  expiresAt: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string; phone: string | null };
  payments: { provider: string; status: string; transactionReference: string | null }[];
  event: { title: string; eventDate: string };
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', city: '', price: '', capacity: '', eventDate: '' });
  const [creating, setCreating] = useState(false);
  const [checkinCode, setCheckinCode] = useState('');
  const [checkinMsg, setCheckinMsg] = useState('');
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [pending, setPending] = useState<PendingOrder[]>([]);
  const [pendingMsg, setPendingMsg] = useState('');
  const [confirmRef, setConfirmRef] = useState<Record<string, string>>({});

  const isAdmin = user?.role === 'ADMIN';

  const loadPending = useCallback(() => {
    if (!isAdmin) return;
    api<PendingOrder[]>('/admin/orders/pending').then(setPending).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    if (loading || !isAdmin) return;
    api<Stats>('/admin/dashboard')
      .then(setStats)
      .catch((e: any) => setError(e?.message || 'Dashboard inaccessible'));
    api<AdminEvent[]>('/admin/events')
      .then(setEvents)
      .catch(() => {});
    loadPending();
  }, [loading, isAdmin, loadPending]);

  async function createEvent(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api('/admin/events', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          cityId: form.city,
          categoryId: '',
          address: '',
          eventDate: form.eventDate,
          price: Number(form.price),
          capacity: Number(form.capacity)
        })
      });
      setForm({ title: '', city: '', price: '', capacity: '', eventDate: '' });
      setError('');
      api<AdminEvent[]>('/admin/events').then(setEvents).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Création impossible');
    } finally {
      setCreating(false);
    }
  }

  async function checkin(e: FormEvent) {
    e.preventDefault();
    setCheckinBusy(true);
    setCheckinMsg('');
    try {
      const res = await api<{ message: string }>(`/admin/checkin/${checkinCode}`, { method: 'POST' });
      setCheckinMsg(`✅ ${res.message}`);
      setCheckinCode('');
    } catch (err: any) {
      setCheckinMsg(`❌ ${err?.message || 'Échec du check-in'}`);
    } finally {
      setCheckinBusy(false);
    }
  }

  async function confirmPending(id: string) {
    setPendingMsg('');
    try {
      await api(`/admin/orders/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ transactionReference: confirmRef[id]?.trim() || undefined })
      });
      setPendingMsg(`✅ Commande ${id.slice(0, 8)}… confirmée : billets émis.`);
      setConfirmRef((r) => ({ ...r, [id]: '' }));
      loadPending();
    } catch (err: any) {
      setPendingMsg(`❌ ${err?.message || 'Confirmation impossible'}`);
    }
  }

  async function cancelPending(id: string) {
    if (!window.confirm('Annuler cette commande et libérer les places ?')) return;
    setPendingMsg('');
    try {
      await api(`/admin/orders/${id}/cancel`, { method: 'POST' });
      setPendingMsg(`Commande ${id.slice(0, 8)}… annulée, places libérées.`);
      loadPending();
    } catch (err: any) {
      setPendingMsg(`❌ ${err?.message || 'Annulation impossible'}`);
    }
  }

  async function sweepExpired() {
    setPendingMsg('');
    try {
      const res = await api<{ expired: number }>('/admin/orders/sweep-expired', { method: 'POST' });
      setPendingMsg(`${res.expired} commande(s) expirée(s) annulée(s).`);
      loadPending();
    } catch (err: any) {
      setPendingMsg(`❌ ${err?.message || 'Purge impossible'}`);
    }
  }

  if (!loading && !user) {
    return (
      <section className="container py-14">
        <p className="font-bold">Connectez-vous pour accéder à cette page.</p>
        <Link href="/login?next=/admin" className="mt-4 inline-block rounded-full bg-brand px-6 py-3 font-black text-white">Se connecter</Link>
      </section>
    );
  }
  if (!loading && user && !isAdmin) {
    return (
      <section className="container py-14">
        <h1 className="text-3xl font-black">Accès refusé</h1>
        <p className="mt-3 text-slate-600">Cette page est réservée aux administrateurs.</p>
      </section>
    );
  }

  const input = 'w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand';

  return (
    <section className="container py-14">
      <h1 className="text-4xl font-black">Administration</h1>
      {error && <p className="mt-6 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}

      {stats && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Événements', stats.totalEvents],
            ['Billets', stats.totalTickets],
            ['Commandes', stats.totalOrders],
            ['Revenu (HTG)', stats.revenue.toLocaleString('fr-FR')],
            ['Scannés (24h)', stats.scannedToday]
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-black text-brand">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-amber-100 bg-white p-7 shadow">
          <h2 className="text-xl font-black">Créer un événement</h2>
          <form onSubmit={createEvent} className="mt-5 grid gap-4">
            <label className="text-sm font-bold">Titre
              <input className={input} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-bold">ID ville
                <input className={input} required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="cuid…" />
              </label>
              <label className="text-sm font-bold">Prix (HTG)
                <input className={input} type="number" required min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-bold">Capacité
                <input className={input} type="number" required min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </label>
              <label className="text-sm font-bold">Date
                <input className={input} type="datetime-local" required value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
              </label>
            </div>
            <button disabled={creating} className="rounded-full bg-brand p-3 font-black text-white transition hover:bg-[#ba5521] disabled:opacity-60">
              {creating ? 'Création…' : 'Créer (brouillon)'}
            </button>
            <p className="text-xs text-slate-400">Les IDs ville/catégorie sont temporaires — le sélecteur arrive dans la prochaine itération.</p>
          </form>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-white p-7 shadow">
          <h2 className="text-xl font-black">Check-in (scan)</h2>
          <form onSubmit={checkin} className="mt-5 flex gap-2">
            <input
              className={input}
              placeholder="Code billet (ex. TIK-XXXX)"
              value={checkinCode}
              onChange={(e) => setCheckinCode(e.target.value)}
            />
            <button disabled={checkinBusy || !checkinCode} className="shrink-0 rounded-full bg-brand px-5 font-black text-white disabled:opacity-60">
              Valider
            </button>
          </form>
          {checkinMsg && <p className="mt-4 font-bold">{checkinMsg}</p>}
        </div>
      </div>

      <h2 className="mt-10 text-2xl font-black">Paiements en attente</h2>
      <p className="mt-1 text-sm text-slate-500">
        Vérifiez le transfert reçu sur votre MonCash/NatCash (montant + référence en note), puis confirmez.
        La confirmation émet les billets automatiquement.
      </p>
      {pendingMsg && <p className="mt-3 font-bold">{pendingMsg}</p>}
      <div className="mt-4 space-y-3">
        {pending.map((o) => (
          <div key={o.id} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-black">{o.event.title} · {o.quantity} billet(s) · {o.total.toLocaleString('fr-FR')} HTG</p>
                <p className="text-sm text-slate-500">
                  {o.user.firstName} {o.user.lastName} ({o.user.email}{o.user.phone ? ` · ${o.user.phone}` : ''})
                </p>
                <p className="mt-1 text-sm">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-black">{o.paymentReference}</span>{' '}
                  <span className="font-bold text-slate-500">{o.paymentMethod ?? o.payments[0]?.provider ?? '—'}</span>
                  {o.expiresAt && (
                    <span className="ml-2 text-xs font-bold text-amber-600">
                      expire le {new Date(o.expiresAt).toLocaleString('fr-FR')}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="w-44 rounded-xl border border-slate-200 p-2 text-sm outline-none focus:border-brand"
                  placeholder="Réf. transfert (optionnel)"
                  value={confirmRef[o.id] || ''}
                  onChange={(e) => setConfirmRef((r) => ({ ...r, [o.id]: e.target.value }))}
                />
                <button
                  onClick={() => confirmPending(o.id)}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                >
                  Confirmer
                </button>
                <button
                  onClick={() => cancelPending(o.id)}
                  className="rounded-full bg-red-100 px-4 py-2 text-sm font-black text-red-700 hover:bg-red-200"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="text-slate-500">Aucune commande en attente.</p>}
      </div>
      <button onClick={sweepExpired} className="mt-3 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
        Purger les commandes expirées
      </button>

      <h2 className="mt-10 text-2xl font-black">Événements</h2>
      <div className="mt-4 space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center justify-between rounded-2xl border border-amber-100 bg-white p-4">
            <div>
              <p className="font-bold">{ev.title}</p>
              <p className="text-sm text-slate-500">
                {new Date(ev.eventDate).toLocaleDateString('fr-FR')} · {ev.city?.name} · {ev.price.toLocaleString('fr-FR')} HTG · {ev.ticketsAvailable} restants
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${
              ev.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
              ev.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'
            }`}>{ev.status}</span>
          </div>
        ))}
        {events.length === 0 && <p className="text-slate-500">Aucun événement.</p>}
      </div>
    </section>
  );
}
