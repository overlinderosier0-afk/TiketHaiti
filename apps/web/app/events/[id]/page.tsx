'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

interface EventDetail {
  id: string;
  title: string;
  description: string;
  address: string;
  artistName: string | null;
  eventDate: string;
  doorsOpen: string | null;
  price: number;
  ticketsAvailable: number;
  status: string;
  city: { name: string };
  category: { name: string };
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    api<EventDetail>(`/events/${params.id}`)
      .then(setEvent)
      .catch((e: any) => setError(e?.message || 'Événement introuvable'));
  }, [params.id]);

  async function buy() {
    if (!event) return;
    if (!user) {
      router.push(`/login?next=/events/${params.id}`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await api<{ orderId: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify({ eventId: event.id, quantity: qty })
      });
      router.push(`/checkout?order=${res.orderId}`);
    } catch (e: any) {
      setError(e?.message || 'Commande impossible');
    } finally {
      setBusy(false);
    }
  }

  if (error && !event) {
    return (
      <section className="container py-14">
        <p className="rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>
        <Link href="/events" className="mt-4 inline-block font-black text-brand">← Retour aux événements</Link>
      </section>
    );
  }
  if (!event) return <section className="container py-14 text-slate-400">Chargement…</section>;

  return (
    <section className="container py-14">
      <Link href="/events" className="text-sm font-bold text-brand">← Tous les événements</Link>
      <p className="mt-4 font-bold text-brand">
        {new Date(event.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {event.city?.name}
      </p>
      <h1 className="mt-3 text-5xl font-black">{event.title}</h1>
      <p className="mt-2 text-lg text-slate-500">{event.category?.name}{event.artistName ? ` · ${event.artistName}` : ''}</p>
      <p className="mt-6 max-w-2xl text-lg text-slate-600">{event.description}</p>
      <p className="mt-4 text-sm text-slate-500">📍 {event.address}</p>
      {event.doorsOpen && (
        <p className="mt-1 text-sm text-slate-500">
          Ouverture des portes : {new Date(event.doorsOpen).toLocaleString('fr-FR')}
        </p>
      )}

      <div className="mt-10 rounded-3xl bg-white p-7 shadow md:flex md:items-center md:justify-between">
        <div>
          <p className="font-bold">Entrée générale</p>
          <p className="text-2xl font-black">{event.price.toLocaleString('fr-FR')} HTG</p>
          <p className="text-sm text-slate-500">Billet numérique · QR sécurisé</p>
          <p className={`mt-1 text-sm font-bold ${event.ticketsAvailable > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {event.ticketsAvailable > 0 ? `${event.ticketsAvailable} billets restants` : 'Événement complet'}
          </p>
        </div>
        <div className="mt-5 flex items-center gap-4 md:mt-0">
          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
          <label className="text-sm font-bold">
            Qté
            <input
              type="number" min={1} max={Math.min(10, event.ticketsAvailable)}
              value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="ml-2 w-16 rounded-xl border border-slate-200 p-2 text-center outline-none focus:border-brand"
            />
          </label>
          <button
            onClick={buy}
            disabled={busy || event.ticketsAvailable <= 0}
            className="rounded-full bg-brand px-7 py-3 font-bold text-white transition hover:bg-[#ba5521] disabled:opacity-40"
          >
            {busy ? '…' : 'Acheter'}
          </button>
        </div>
      </div>
    </section>
  );
}
