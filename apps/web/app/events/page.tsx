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
    <section className="container py-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
        <PageHead
          eyebrow="Catalogue"
          title="Événements"
          sub="Concerts, festivals et sorties partout en Haïti."
        />
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); }}
          className="flex w-full gap-2 sm:w-auto"
        >
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville… (ex. Jacmel)"
            className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-campy focus:ring-2 focus:ring-blue-100"
          />
          <button className="shrink-0 rounded-full bg-campy px-5 py-2 text-sm font-black text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-campyDark">
            Filtrer
          </button>
        </form>
      </div>

      {error && <div className="mt-8"><ErrorBox>{error}</ErrorBox></div>}

      {!data && !error && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse rounded-3xl bg-white p-3 shadow-sm sm:rounded-[1.8rem] sm:p-6">
              <div className="h-4 w-16 rounded-full bg-blue-50 sm:h-5 sm:w-24" />
              <div className="mt-3 h-3 w-24 rounded bg-slate-100 sm:mt-5 sm:h-4 sm:w-40" />
              <div className="mt-2 h-5 w-3/4 rounded bg-slate-100 sm:mt-3 sm:h-7" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((ev) => (
          <Link
            key={ev.id}
            href={`/events/${ev.slug || ev.id}`}
            className="group rounded-3xl border border-slate-100 bg-white p-3 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl sm:rounded-[1.8rem] sm:p-6"
          >
            {uploadUrl(ev.bannerUrl) && (
              <div className="-m-3 mb-3 h-28 overflow-hidden rounded-t-3xl sm:-mx-6 sm:-mt-6 sm:mb-6 sm:h-44 sm:rounded-t-[1.8rem]">
                <img src={uploadUrl(ev.bannerUrl)!} alt={ev.title} className="h-full w-full object-cover transition group-hover:scale-105" />
              </div>
            )}
            <CategoryPill>{ev.category?.name}</CategoryPill>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:mt-4 sm:text-xs sm:tracking-[0.18em]">
              {new Date(ev.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {ev.city?.name}
            </p>
            <h3 className="mt-1 line-clamp-2 text-base font-black text-slate-900 sm:mt-2 sm:text-2xl">{ev.title}</h3>
            <div className="mt-3 flex flex-col items-start gap-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black text-slate-900 sm:text-lg">{ev.price > 0 ? `${ev.price.toLocaleString('fr-FR')} HTG` : 'Gratuit'}</p>
              {ev.ticketsAvailable > 0 ? (
                <StatusPill tone="green">{ev.ticketsAvailable} billets</StatusPill>
              ) : (
                <StatusPill tone="red">Complet</StatusPill>
              )}
            </div>
            <span className="mt-5 hidden rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black text-white transition group-hover:bg-campy sm:inline-flex">
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
