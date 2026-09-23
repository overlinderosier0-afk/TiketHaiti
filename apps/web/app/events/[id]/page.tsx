'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { CategoryPill, ErrorBox, PrimaryButton, StatusPill, inputCls } from '../../../components/ui';

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
        <ErrorBox>{error}</ErrorBox>
        <Link href="/events" className="mt-4 inline-block font-black text-campy">← Retour aux événements</Link>
      </section>
    );
  }
  if (!event) return <section className="container py-14 text-slate-400">Chargement…</section>;

  return (
    <section className="container py-14">
      <Link href="/events" className="text-sm font-black text-campy transition hover:text-campyDark">
        ← Tous les événements
      </Link>

      <div className="mt-6 max-w-3xl">
        <CategoryPill>{event.category?.name}</CategoryPill>
        <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-campy">
          {new Date(event.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {event.city?.name}
        </p>
        <h1 className="mt-3 text-5xl font-black leading-tight text-slate-900">{event.title}</h1>
        {event.artistName && <p className="mt-3 text-xl font-bold text-slate-600">{event.artistName}</p>}
        <p className="mt-6 text-lg leading-8 text-slate-600">{event.description}</p>
        <div className="mt-6 space-y-1 text-sm font-bold text-slate-500">
          <p>📍 {event.address}</p>
          {event.doorsOpen && (
            <p>🚪 Ouverture des portes : {new Date(event.doorsOpen).toLocaleString('fr-FR')}</p>
          )}
        </div>
      </div>

      <div className="mt-10 rounded-[1.8rem] border border-slate-100 bg-white p-7 shadow-sm md:flex md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Entrée générale</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{event.price.toLocaleString('fr-FR')} HTG</p>
          <p className="mt-1 text-sm font-bold text-slate-500">Billet numérique · QR sécurisé</p>
          <div className="mt-2">
            {event.ticketsAvailable > 0 ? (
              <StatusPill tone="green">{event.ticketsAvailable} billets restants</StatusPill>
            ) : (
              <StatusPill tone="red">Événement complet</StatusPill>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-0">
          <label className="text-sm font-black text-slate-800">
            Qté
            <input
              type="number" min={1} max={Math.min(10, event.ticketsAvailable)}
              value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className={`${inputCls} ml-2 !mt-0 w-20 text-center`}
            />
          </label>
          <PrimaryButton onClick={buy} disabled={busy || event.ticketsAvailable <= 0}>
            {busy ? '…' : 'Prendre mes billets →'}
          </PrimaryButton>
        </div>
      </div>
      {error && <div className="mt-4 max-w-xl"><ErrorBox>{error}</ErrorBox></div>}
    </section>
  );
}
