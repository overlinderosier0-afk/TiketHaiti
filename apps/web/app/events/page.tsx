'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, uploadUrl } from '../../lib/api';
import { CategoryPill, EmptyState, ErrorBox, PageHead, StatusPill } from '../../components/ui';

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
  bannerUrl: string | null;
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
      <div className="flex flex-wrap items-end justify-between gap-6">
        <PageHead
          eyebrow="Catalogue"
          title="Événements"
          sub="Concerts, festivals et sorties partout en Haïti."
        />
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); }}
          className="flex gap-2"
        >
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville… (ex. Jacmel)"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-campy focus:ring-2 focus:ring-blue-100"
          />
          <button className="rounded-full bg-campy px-5 py-2 text-sm font-black text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-campyDark">
            Filtrer
          </button>
        </form>
      </div>

      {error && <div className="mt-8"><ErrorBox>{error}</ErrorBox></div>}

      {!data && !error && (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse rounded-[1.8rem] bg-white p-6 shadow-sm">
              <div className="h-5 w-24 rounded-full bg-blue-50" />
              <div className="mt-5 h-4 w-40 rounded bg-slate-100" />
              <div className="mt-3 h-7 w-3/4 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((ev) => (
          <Link
            key={ev.id}
            href={`/events/${ev.slug || ev.id}`}
            className="group rounded-[1.8rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl"
          >
            {uploadUrl(ev.bannerUrl) && (
              <div className="-mx-6 -mt-6 mb-6 h-44 overflow-hidden rounded-t-[1.8rem]">
                <img src={uploadUrl(ev.bannerUrl)!} alt={ev.title} className="h-full w-full object-cover transition group-hover:scale-105" />
              </div>
            )}
            <CategoryPill>{ev.category?.name}</CategoryPill>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              {new Date(ev.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {ev.city?.name}
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">{ev.title}</h3>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-lg font-black text-slate-900">{ev.price.toLocaleString('fr-FR')} HTG</p>
              {ev.ticketsAvailable > 0 ? (
                <StatusPill tone="green">{ev.ticketsAvailable} billets</StatusPill>
              ) : (
                <StatusPill tone="red">Complet</StatusPill>
              )}
            </div>
            <span className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black text-white transition group-hover:bg-campy">
              Prendre mes billets →
            </span>
          </Link>
        ))}
      </div>

      {data && data.items.length === 0 && (
        <div className="mt-10">
          <EmptyState
            title="Aucun événement trouvé"
            text="Essaie une autre ville, ou reviens bientôt : le catalogue s'agrandit."
          />
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            ← Précédent
          </button>
          <span className="text-sm font-bold text-slate-600">Page {page} / {data.totalPages}</span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      )}
    </section>
  );
}
