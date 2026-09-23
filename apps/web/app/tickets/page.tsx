'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, downloadFile } from '../../lib/api';
import { useAuth } from '../../lib/auth';

interface TicketItem {
  id: string;
  code: string;
  qrCode: string;
  qrDataUrl: string | null;
  isUsed: boolean;
  createdAt: string;
  event: { title: string; eventDate: string; address: string; city: { name: string } };
}

export default function TicketsPage() {
  const { user, loading } = useAuth();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    api<TicketItem[]>('/users/tickets')
      .then(setTickets)
      .catch((e: any) => setError(e?.message || 'Chargement impossible'));
  }, [loading, user]);

  async function pdf(t: TicketItem) {
    setBusy(t.id);
    try {
      await downloadFile(`/tickets/${t.id}/pdf`, `billet-${t.code}.pdf`);
    } catch (e: any) {
      setError(e?.message || 'Téléchargement impossible');
    } finally {
      setBusy(null);
    }
  }

  if (!loading && !user) {
    return (
      <section className="container py-14">
        <h1 className="text-4xl font-black">Mes billets</h1>
        <p className="mt-4 text-slate-600">Connectez-vous pour voir vos billets.</p>
        <Link href="/login?next=/tickets" className="mt-4 inline-block rounded-full bg-brand px-6 py-3 font-black text-white">Se connecter</Link>
      </section>
    );
  }

  return (
    <section className="container py-14">
      <h1 className="text-4xl font-black">Mes billets</h1>

      {error && <p className="mt-6 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}

      {tickets.length === 0 && !error && (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-lg font-bold">Aucun billet pour le moment</p>
          <p className="mt-2 text-slate-500">Vos billets apparaîtront ici après votre achat.</p>
          <Link href="/events" className="mt-4 inline-block rounded-full bg-brand px-6 py-3 font-black text-white">Voir les événements</Link>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {tickets.map((t) => (
          <div key={t.id} className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-brand">
                  {new Date(t.event.eventDate).toLocaleDateString('fr-FR')} · {t.event.city?.name}
                </p>
                <h3 className="mt-1 text-xl font-black">{t.event.title}</h3>
                <p className="mt-1 font-mono text-sm text-slate-500">{t.code}</p>
                <p className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-black ${t.isUsed ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                  {t.isUsed ? 'Utilisé' : 'Valide'}
                </p>
              </div>
              {t.qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.qrDataUrl} alt={`QR ${t.code}`} className="h-28 w-28 rounded-xl border border-slate-200" />
              )}
            </div>
            <button
              onClick={() => pdf(t)}
              disabled={busy === t.id}
              className="mt-4 rounded-full border border-slate-200 px-5 py-2 text-sm font-black hover:bg-slate-50 disabled:opacity-50"
            >
              {busy === t.id ? 'Génération…' : 'Télécharger le PDF'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
