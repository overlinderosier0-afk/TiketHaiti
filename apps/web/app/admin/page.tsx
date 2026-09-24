'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { ErrorBox, Field, GhostButton, PageHead, PrimaryButton, StatusPill, inputCls } from '../../components/ui';

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
  bannerUrl: string | null;
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

function eventStatusTone(status: string): 'green' | 'red' | 'slate' {
  if (status === 'PUBLISHED') return 'green';
  if (status === 'CANCELLED') return 'red';
  return 'slate';
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', bannerUrl: '', cityId: '', categoryId: '', price: '', capacity: '', eventDate: '' });
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [checkinCode, setCheckinCode] = useState('');
  const [checkinMsg, setCheckinMsg] = useState('');
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [pending, setPending] = useState<PendingOrder[]>([]);
  const [pendingMsg, setPendingMsg] = useState('');
  const [confirmRef, setConfirmRef] = useState<Record<string, string>>({});
  const [bannerEdit, setBannerEdit] = useState<Record<string, string>>({});

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
    api<{ id: number; name: string }[]>('/admin/cities').then(setCities).catch(() => {});
    api<{ id: number; name: string }[]>('/admin/categories').then(setCategories).catch(() => {});
    loadPending();
  }, [loading, isAdmin, loadPending]);

  function slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async function createEvent(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api('/admin/events', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          slug: `${slugify(form.title)}-${Date.now().toString(36)}`,
          bannerUrl: form.bannerUrl.trim() || undefined,
          cityId: Number(form.cityId),
          categoryId: Number(form.categoryId),
          address: '',
          eventDate: form.eventDate,
          price: Number(form.price),
          capacity: Number(form.capacity)
        })
      });
      setForm({ title: '', description: '', bannerUrl: '', cityId: '', categoryId: '', price: '', capacity: '', eventDate: '' });
      setError('');
      api<AdminEvent[]>('/admin/events').then(setEvents).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Création impossible');
    } finally {
      setCreating(false);
    }
  }

  async function saveBanner(id: string) {
    const url = (bannerEdit[id] ?? '').trim();
    setError('');
    try {
      await api(`/admin/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ bannerUrl: url || null })
      });
      setBannerEdit((b) => ({ ...b, [id]: '' }));
      api<AdminEvent[]>('/admin/events').then(setEvents).catch(() => {});
    } catch (err: any) {
      setError(err?.message || "Sauvegarde de l'affiche impossible");
    }
  }

  async function checkin(e: FormEvent) {    e.preventDefault();
    setCheckinBusy(true);
    setCheckinMsg('');
    try {
      const res = await api<{ message: string }>('/admin/checkin', {
        method: 'POST',
        body: JSON.stringify({ code: checkinCode })
      });
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
        <PageHead eyebrow="Admin" title="Administration" sub="Connecte-toi pour accéder à cette page." />
        <Link href="/login?next=/admin" className="mt-6 inline-flex items-center justify-center rounded-full bg-campy px-7 py-3 font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-campyDark">
          Se connecter
        </Link>
      </section>
    );
  }
  if (!loading && user && !isAdmin) {
    return (
      <section className="container py-14">
        <PageHead eyebrow="Admin" title="Accès refusé" sub="Cette page est réservée aux administrateurs." />
      </section>
    );
  }

  return (
    <section className="container py-14">
      <PageHead eyebrow="Admin" title="Administration" />
      {error && <div className="mt-6"><ErrorBox>{error}</ErrorBox></div>}

      {stats && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Événements', stats.totalEvents],
            ['Billets', stats.totalTickets],
            ['Commandes', stats.totalOrders],
            ['Revenu (HTG)', stats.revenue.toLocaleString('fr-FR')],
            ['Scannés (24h)', stats.scannedToday]
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-black text-campy">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="rounded-[1.8rem] border border-slate-100 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Créer un événement</h2>
          <form onSubmit={createEvent} className="mt-5 grid gap-4">
            <Field label="Titre">
              <input className={inputCls} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea className={inputCls} required rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Affiche (URL de l'image, optionnel)">
              <input className={inputCls} type="url" placeholder="https://…" value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ville">
                <select className={inputCls} required value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
                  <option value="">Choisir…</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Catégorie">
                <select className={inputCls} required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Choisir…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prix (HTG)">
                <input className={inputCls} type="number" required min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </Field>
              <Field label="Capacité">
                <input className={inputCls} type="number" required min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date">
                <input className={inputCls} type="datetime-local" required value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
              </Field>
            </div>
            <PrimaryButton disabled={creating} className="w-full">
              {creating ? 'Création…' : 'Créer (brouillon)'}
            </PrimaryButton>
            <p className="text-xs font-bold text-slate-400">Le slug est généré automatiquement à partir du titre.</p>
          </form>
        </div>

        <div className="rounded-[1.8rem] border border-slate-100 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Check-in (scan)</h2>
          <form onSubmit={checkin} className="mt-5 flex gap-2">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition focus:border-campy focus:ring-2 focus:ring-blue-100"
              placeholder="ID du billet (visible sur le billet)"
              value={checkinCode}
              onChange={(e) => setCheckinCode(e.target.value)}
            />
            <PrimaryButton disabled={checkinBusy || !checkinCode} className="shrink-0 px-5">
              Valider
            </PrimaryButton>
          </form>
          {checkinMsg && <p className="mt-4 font-bold text-slate-700">{checkinMsg}</p>}
          <p className="mt-4 text-xs font-bold text-slate-400">
            Saisis le code du billet pour valider l'entrée, ou scanne son QR.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-[1.8rem] border-2 border-blue-100 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Paiements en attente</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Vérifiez le transfert reçu sur votre MonCash/NatCash (montant + référence en note), puis confirmez.
              La confirmation émet les billets automatiquement.
            </p>
          </div>
          <GhostButton onClick={sweepExpired}>
            Purger les expirées
          </GhostButton>
        </div>
        {pendingMsg && <p className="mt-3 font-bold text-slate-700">{pendingMsg}</p>}
        <div className="mt-5 space-y-3">
          {pending.map((o) => (
            <div key={o.id} className="rounded-2xl border border-slate-100 bg-cream p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900">{o.event.title} · {o.quantity} billet(s) · {o.total.toLocaleString('fr-FR')} HTG</p>
                  <p className="text-sm font-bold text-slate-500">
                    {o.user.firstName} {o.user.lastName} ({o.user.email}{o.user.phone ? ` · ${o.user.phone}` : ''})
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded bg-white px-2 py-0.5 font-mono font-black text-campy shadow-sm">{o.paymentReference}</span>
                    <StatusPill tone="blue">{o.paymentMethod ?? o.payments[0]?.provider ?? '—'}</StatusPill>
                    {o.expiresAt && (
                      <span className="text-xs font-bold text-amber-600">
                        ⏳ expire le {new Date(o.expiresAt).toLocaleString('fr-FR')}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="w-44 rounded-xl border border-slate-200 bg-white p-2 text-sm outline-none transition focus:border-campy focus:ring-2 focus:ring-blue-100"
                    placeholder="Réf. transfert (optionnel)"
                    value={confirmRef[o.id] || ''}
                    onChange={(e) => setConfirmRef((r) => ({ ...r, [o.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => confirmPending(o.id)}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => cancelPending(o.id)}
                    className="rounded-full bg-red-100 px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-200"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="font-bold text-slate-400">Aucune commande en attente. 🎉</p>}
        </div>
      </div>

      <h2 className="mt-12 text-2xl font-black text-slate-900">Événements</h2>
      <div className="mt-4 space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {ev.bannerUrl ? (
                  <img src={ev.bannerUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">🖼️</div>
                )}
                <div>
                  <p className="font-black text-slate-900">{ev.title}</p>
                  <p className="text-sm font-bold text-slate-500">
                    {new Date(ev.eventDate).toLocaleDateString('fr-FR')} · {ev.city?.name} · {ev.price.toLocaleString('fr-FR')} HTG · {ev.ticketsAvailable} restants
                  </p>
                </div>
              </div>
              <StatusPill tone={eventStatusTone(ev.status)}>{ev.status}</StatusPill>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm outline-none transition focus:border-campy focus:ring-2 focus:ring-blue-100"
                placeholder="URL de l'affiche… (vide pour retirer)"
                value={bannerEdit[ev.id] ?? ev.bannerUrl ?? ''}
                onChange={(e) => setBannerEdit((b) => ({ ...b, [ev.id]: e.target.value }))}
              />
              <button
                onClick={() => saveBanner(ev.id)}
                className="shrink-0 rounded-full bg-campy px-4 py-2 text-sm font-black text-white transition hover:bg-campyDark"
              >
                OK
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="font-bold text-slate-400">Aucun événement.</p>}
      </div>
    </section>
  );
}
