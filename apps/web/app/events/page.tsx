'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  city: { name: string };
  category: { name: string };
  eventDate: string;
  price: number;
  ticketsAvailable: number;
  status: string;
}

interface PageResult {
  items: EventItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function EventsPage() {
  const [data, setData] = useState<PageResult | null>(null);
  const [error, setError] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({ status: 'PUBLISHED', page: String(page), limit: '12' });
    if (city.trim()) params.set('city', city.trim());
    api<PageResult>(`/events?${params}`)
      .then(setData)
      .catch((e: any) => setError(e?.message || 'Chargement impossible'));
  }, [city, page]);

  return (
    <section className="container py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black">Événements</h1>
          <p className="mt-2 text-slate-500">Concerts, festivals et sorties partout en Haïti.</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); }}
          className="flex gap-2"
        >
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville… (ex. Jacmel)"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand"
          />
          <button className="rounded-full bg-brand px-5 py-2 text-sm font-black text-white">Filtrer</button>
        </form>
      </div>

      {error && <p className="mt-8 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((ev) => (
          <Link
            key={ev.id}
            href={`/events/${ev.slug || ev.id}`}
            className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm transition hover:shadow-lg"
          >
            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-widest text-brand">
                {new Date(ev.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {ev.city?.name}
              </p>
              <h3 className="mt-2 text-xl font-black">{ev.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{ev.category?.name}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-lg font-black">{ev.price.toLocaleString('fr-FR')} HTG</p>
                <p className={`text-xs font-bold ${ev.ticketsAvailable > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {ev.ticketsAvailable > 0 ? `${ev.ticketsAvailable} billets` : 'Complet'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!data && !error && <p className="mt-10 text-center text-slate-400">Chargement des événements…</p>}
      {data && data.items.length === 0 && (
        <p className="mt-10 text-center text-slate-500">Aucun événement trouvé.</p>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40"
          >
            ← Précédent
          </button>
          <span className="text-sm font-bold">Page {page} / {data.totalPages}</span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      )}
    </section>
  );
}
