'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, uploadFile, uploadUrl } from '../../lib/api';
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
  const [form, setForm] = useState({ title: '', description: '', address: '', cityId: '', category: '', price: '', capacity: '', eventDate: '', isFree: false, isDraft: false });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerKey, setBannerKey] = useState(0);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [checkinCode, setCheckinCode] = useState('');
  const [checkinMsg, setCheckinMsg] = useState('');
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [pending, setPending] = useState<PendingOrder[]>([]);
  const [pendingMsg, setPendingMsg] = useState('');
  const [confirmRef, setConfirmRef] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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
      const created = await api<{ id: string }>('/admin/events', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          slug: `${slugify(form.title)}-${Date.now().toString(36)}`,
          cityId: Number(form.cityId),
          category: form.category.trim() || undefined,
          address: form.address.trim() || undefined,
          eventDate: form.eventDate,
          price: form.isFree ? 0 : Number(form.price),
          capacity: Number(form.capacity),
          status: form.isDraft ? 'DRAFT' : 'PUBLISHED'
        })
      });
      if (bannerFile) {
        await uploadFile(`/admin/events/${created.id}/banner`, bannerFile);
      }
      setForm({ title: '', description: '', address: '', cityId: '', category: '', price: '', capacity: '', eventDate: '', isFree: false, isDraft: false });
      setBannerFile(null);
      setBannerKey((k) => k + 1);
      setError('');
      api<AdminEvent[]>('/admin/events').then(setEvents).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Création impossible');
    } finally {
      setCreating(false);
    }
  }

  async function handleBannerUpload(id: string, file: File) {
    setUploadingId(id);
    setError('');
    try {
      await uploadFile(`/admin/events/${id}/banner`, file);
      api<AdminEvent[]>('/admin/events').then(setEvents).catch(() => {});
    } catch (err: any) {
      setError(err?.message || "Envoi de l'affiche impossible");
    } finally {
      setUploadingId(null);
    }
  }

  async function removeBanner(id: string) {
    setError('');
    try {
      await api(`/admin/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ bannerUrl: null })
      });
      api<AdminEvent[]>('/admin/events').then(setEvents).catch(() => {});
    } catch (err: any) {
      setError(err?.message || "Suppression de l'affiche impossible");
    }
  }

  async function setEventStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED') {
    setError('');
    try {
      await api(`/admin/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      api<AdminEvent[]>('/admin/events').then(setEvents).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Changement de statut impossible');
    }
  }

  async function removeEvent(id: string, title: string) {    if (!window.confirm(`Supprimer définitivement « ${title} » ? Cette action est irréversible.`)) return;
    setError('');
    try {
      await api(`/admin/events/${id}`, { method: 'DELETE' });
      api<AdminEvent[]>('/admin/events').then(setEvents).catch(() => {});
    } catch (err: any) {
      setError(err?.message || "Suppression de l'événement impossible");
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
        <Link href="/login?next=/admin" className="mt-6 inline-flex items-center justify-center bg-ed-red px-7 py-3.5 text-sm font-extrabold uppercase tracking-widest text-white transition hover:bg-ed-ink">
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
            <div key={label as string} className="border-2 border-ed-ink bg-white p-5">
              <p className="text-xs font-extrabold uppercase tracking-widest text-ed-muted">{label}</p>
              <p className="mt-2 text-2xl font-black text-ed-red">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="border-2 border-ed-ink bg-white p-7">
          <h2 className="text-xl font-black uppercase tracking-tight text-ed-ink">Créer un événement</h2>
          <form onSubmit={createEvent} className="mt-5 grid gap-4">
            <Field label="Titre">
              <input className={inputCls} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea className={inputCls} required rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Adresse / lieu (optionnel)">
              <input className={inputCls} placeholder="Ex. Centre culturel Caraïbes, rue Chavannes, Pétion-Ville" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="Affiche (JPG, PNG ou WebP — 5 Mo max, optionnel)">
              <input
                key={bannerKey}
                className={inputCls}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
              />
              {bannerFile && <p className="mt-1 text-xs font-bold text-ed-muted">{bannerFile.name}</p>}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ville">
                <select className={inputCls} required value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
                  <option value="">Choisir…</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Catégorie (texte libre)">
                <input
                  className={inputCls}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex : Konpa, Rap Kreyòl, Théâtre…"
                />
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-3 border-2 border-ed-ink bg-ed-paper p-3">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
                className="h-5 w-5 accent-[#D93A2B]"
              />
              <span className="text-sm font-extrabold uppercase tracking-wide text-ed-ink">
                Événement gratuit <span className="font-bold normal-case tracking-normal text-ed-muted">— les billets sont émis sans paiement</span>
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prix (HTG)">
                <input
                  className={inputCls}
                  type="number"
                  required={!form.isFree}
                  min={0}
                  disabled={form.isFree}
                  value={form.isFree ? 0 : form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Field>
              <Field label="Capacité">
                <input className={inputCls} type="number" required min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <input className={inputCls} type="datetime-local" required value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
              </Field>
            </div>
            <PrimaryButton disabled={creating} className="w-full">
              {creating ? 'Création…' : 'Créer l\u2019événement'}
            </PrimaryButton>
            <label className="flex cursor-pointer items-center gap-3 border-2 border-ed-ink bg-ed-paper p-3">
              <input
                type="checkbox"
                checked={form.isDraft}
                onChange={(e) => setForm({ ...form, isDraft: e.target.checked })}
                className="h-5 w-5 accent-[#D93A2B]"
              />
              <span className="text-sm font-extrabold uppercase tracking-wide text-ed-ink">
                Enregistrer comme brouillon <span className="font-bold normal-case tracking-normal text-ed-muted">— invisible dans le catalogue tant qu'il n'est pas publié</span>
              </span>
            </label>
            <p className="text-xs font-bold text-ed-muted">Le slug est généré automatiquement à partir du titre.</p>
          </form>
        </div>

        <div className="border-2 border-ed-ink bg-white p-7">
          <h2 className="text-xl font-black uppercase tracking-tight text-ed-ink">Check-in (scan)</h2>
          <form onSubmit={checkin} className="mt-5 flex gap-2">
            <input
              className="w-full border-2 border-ed-ink bg-white p-3 outline-none transition placeholder:text-ed-muted/60 focus:border-ed-red"
              placeholder="ID du billet (visible sur le billet)"
              value={checkinCode}
              onChange={(e) => setCheckinCode(e.target.value)}
            />
            <PrimaryButton disabled={checkinBusy || !checkinCode} className="shrink-0 px-5">
              Valider
            </PrimaryButton>
          </form>
          {checkinMsg && <p className="mt-4 font-bold text-ed-ink">{checkinMsg}</p>}
          <p className="mt-4 text-xs font-bold text-ed-muted">
            Saisis le code du billet pour valider l'entrée, ou scanne son QR.
          </p>
        </div>
      </div>

      <div className="mt-12 border-2 border-ed-ink bg-white p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-ed-ink">Paiements en attente</h2>
            <p className="mt-1 text-sm font-bold text-ed-muted">
              Vérifiez le transfert reçu sur votre MonCash/NatCash (montant + référence en note), puis confirmez.
              La confirmation émet les billets automatiquement.
            </p>
          </div>
          <GhostButton onClick={sweepExpired}>
            Purger les expirées
          </GhostButton>
        </div>
        {pendingMsg && <p className="mt-3 font-bold text-ed-ink">{pendingMsg}</p>}
        <div className="mt-5 space-y-3">
          {pending.map((o) => (
            <div key={o.id} className="border border-ed-rule bg-ed-paper p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black text-ed-ink">{o.event.title} · {o.quantity} billet(s) · {o.total.toLocaleString('fr-FR')} HTG</p>
                  <p className="text-sm font-bold text-ed-muted">
                    {o.user.firstName} {o.user.lastName} ({o.user.email}{o.user.phone ? ` · ${o.user.phone}` : ''})
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="border border-ed-rule bg-white px-2 py-0.5 font-mono font-black text-ed-red">{o.paymentReference}</span>
                    <StatusPill tone="blue">{o.paymentMethod ?? o.payments[0]?.provider ?? '—'}</StatusPill>
                    {o.expiresAt && (
                      <span className="text-xs font-bold text-ed-muted">
                        expire le {new Date(o.expiresAt).toLocaleString('fr-FR')}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="w-44 border-2 border-ed-ink bg-white p-2 text-sm outline-none transition placeholder:text-ed-muted/60 focus:border-ed-red"
                    placeholder="Réf. transfert (optionnel)"
                    value={confirmRef[o.id] || ''}
                    onChange={(e) => setConfirmRef((r) => ({ ...r, [o.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => confirmPending(o.id)}
                    className="bg-ed-ink px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-ed-paper transition hover:bg-ed-red"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => cancelPending(o.id)}
                    className="border-[1.5px] border-ed-red px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-ed-red transition hover:bg-ed-red hover:text-white"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="font-bold text-ed-muted">Aucune commande en attente.</p>}
        </div>
      </div>

      <h2 className="mt-12 text-2xl font-black uppercase tracking-tight text-ed-ink">Événements</h2>
      <div className="mt-4 space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="border-2 border-ed-ink bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {(() => {
                  const src = uploadUrl(ev.bannerUrl);
                  return src ? (
                    <img src={src} alt="" className="h-14 w-14 shrink-0 border border-ed-rule object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-ed-rule bg-ed-paper text-xl">Affiche</div>
                  );
                })()}
                <div>
                  <p className="font-black text-ed-ink">{ev.title}</p>
                  <p className="text-sm font-bold text-ed-muted">
                    {new Date(ev.eventDate).toLocaleDateString('fr-FR')} · {ev.city?.name} · {ev.price > 0 ? `${ev.price.toLocaleString('fr-FR')} HTG` : 'Gratuit'} · {ev.ticketsAvailable} restants
                  </p>
                </div>
              </div>
              <StatusPill tone={eventStatusTone(ev.status)}>{ev.status}</StatusPill>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {ev.status === 'PUBLISHED' ? (
                <button
                  onClick={() => setEventStatus(ev.id, 'DRAFT')}
                  className="border-[1.5px] border-ed-ink px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-ed-ink transition hover:bg-ed-ink hover:text-ed-paper"
                >
                  Dépublier
                </button>
              ) : (
                <button
                  onClick={() => setEventStatus(ev.id, 'PUBLISHED')}
                  className="bg-ed-ink px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-ed-paper transition hover:bg-ed-red"
                >
                  Publier
                </button>
              )}
              <label className={`cursor-pointer border-[1.5px] border-ed-ink px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition ${uploadingId === ev.id ? 'opacity-50' : 'text-ed-ink hover:bg-ed-ink hover:text-ed-paper'}`}>
                {uploadingId === ev.id ? "Envoi…" : "Changer l'affiche"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingId === ev.id}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) handleBannerUpload(ev.id, f);
                  }}
                />
              </label>
              {ev.bannerUrl && (
                <button
                  onClick={() => removeBanner(ev.id)}
                  className="border border-ed-rule px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-ed-muted transition hover:bg-ed-ink hover:text-ed-paper"
                >
                  Retirer
                </button>
              )}
              <button
                onClick={() => removeEvent(ev.id, ev.title)}
                className="border-[1.5px] border-ed-red px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-ed-red transition hover:bg-ed-red hover:text-white"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="font-bold text-ed-muted">Aucun événement.</p>}
      </div>
    </section>
  );
}
