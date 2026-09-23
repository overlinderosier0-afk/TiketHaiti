'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, downloadFile } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { EmptyState, ErrorBox, GhostButton, PageHead, StatusPill } from '../../components/ui';

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
        <PageHead eyebrow="Billets" title="Mes billets" sub="Connecte-toi pour voir tes billets." />
        <Link href="/login?next=/tickets" className="mt-6 inline-flex items-center justify-center rounded-full bg-campy px-7 py-3 font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-campyDark">
          Se connecter
        </Link>
      </section>
    );
  }

  return (
    <section className="container py-14">
      <PageHead eyebrow="Billets" title="Mes billets" sub="Présente ton QR à l'entrée, c'est tout." />

      {error && <div className="mt-6"><ErrorBox>{error}</ErrorBox></div>}

      {tickets.length === 0 && !error && (
        <div className="mt-8">
          <EmptyState
            title="Aucun billet pour le moment"
            text="Tes billets apparaîtront ici après ton achat."
            actionHref="/events"
            actionLabel="Voir les événements"
          />
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {tickets.map((t) => (
          <article key={t.id} className="overflow-hidden rounded-[1.8rem] border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="bg-gradient-to-br from-campy to-campyDark p-5 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
                {new Date(t.event.eventDate).toLocaleDateString('fr-FR')} · {t.event.city?.name}
              </p>
              <h3 className="mt-1 text-xl font-black leading-tight">{t.event.title}</h3>
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="font-mono text-sm font-black text-slate-900">{t.code}</p>
                <div className="mt-2">
                  {t.isUsed ? (
                    <StatusPill tone="slate">Utilisé</StatusPill>
                  ) : (
                    <StatusPill tone="green">✓ Valide</StatusPill>
                  )}
                </div>
                <GhostButton
                  onClick={() => pdf(t)}
                  disabled={busy === t.id}
                  className="mt-4"
                >
                  {busy === t.id ? 'Génération…' : 'Télécharger le PDF'}
                </GhostButton>
              </div>
              {t.qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.qrDataUrl} alt={`QR ${t.code}`} className="h-28 w-28 shrink-0 rounded-xl border border-slate-200 bg-white p-1" />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
