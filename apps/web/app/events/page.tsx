import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { serverApiBase, publicUploadUrl } from '../../lib/server';
import CityFilter from './CityFilter';
import CategoryFilter from './CategoryFilter';
import { CategoryPill, EmptyState, ErrorBox, PageHead, StatusPill } from '../../components/ui';

export const metadata: Metadata = {
  title: 'Événements en Haïti — Tikè Ayiti',
  description:
    'Concerts, festivals et sorties partout en Haïti. Choisis ton événement, paie par MonCash ou NatCash, reçois ton billet QR.',
  openGraph: {
    title: 'Événements en Haïti — Tikè Ayiti',
    description:
      'Concerts, festivals et sorties partout en Haïti. Billets en MonCash ou NatCash.',
    type: 'website'
  }
};

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

async function getEvents(city: string, category: string, page: number): Promise<PageResult> {
  const params = new URLSearchParams({ status: 'PUBLISHED', page: String(page), limit: '12' });
  if (city) params.set('city', city);
  if (category) params.set('category', category);
  // L'API exclut déjà les événements terminés par défaut.
  const res = await fetch(`${serverApiBase()}/events?${params.toString()}`, {
    next: { revalidate: 60 }
  });
  if (!res.ok) throw new Error(`Catalogue indisponible (${res.status})`);
  return (await res.json()) as PageResult;
}

async function getCategories(): Promise<{ id: number; name: string }[]> {
  try {
    const res = await fetch(`${serverApiBase()}/events/categories`, {
      next: { revalidate: 600 }
    });
    if (!res.ok) return [];
    return (await res.json()) as { id: number; name: string }[];
  } catch {
    return [];
  }
}

function pageHref(city: string, category: string, page: number): string {
  const p = new URLSearchParams();
  if (city) p.set('city', city);
  if (category) p.set('category', category);
  p.set('page', String(page));
  return `/events?${p.toString()}`;
}

export default async function EventsPage({
  searchParams
}: {
  searchParams: Promise<{ city?: string; category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const city = sp.city ?? '';
  const category = sp.category ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  let data: PageResult | null = null;
  let categories: { id: number; name: string }[] = [];
  let error = '';
  try {
    [data, categories] = await Promise.all([getEvents(city, category, page), getCategories()]);
  } catch (e: any) {
    error = e?.message || 'Chargement impossible';
  }

  return (
    <section className="container py-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
        <PageHead
          eyebrow="Catalogue"
          title="Événements"
          sub="Concerts, festivals et sorties partout en Haïti."
        />
        <Suspense>
          <CityFilter initial={city} />
        </Suspense>
      </div>

      <div className="mt-4">
        <Suspense>
          <CategoryFilter categories={categories} initial={category} />
        </Suspense>
      </div>

      {error && (
        <div className="mt-8">
          <ErrorBox>{error}</ErrorBox>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((ev) => (
          <Link
            key={ev.id}
            href={`/events/${ev.slug || ev.id}`}
            className="group rounded-3xl border border-slate-100 bg-white p-3 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl sm:rounded-[1.8rem] sm:p-6"
          >
            {publicUploadUrl(ev.bannerUrl) && (
              <div className="-m-3 mb-3 h-28 overflow-hidden rounded-t-3xl sm:-mx-6 sm:-mt-6 sm:mb-6 sm:h-44 sm:rounded-t-[1.8rem]">
                <img
                  src={publicUploadUrl(ev.bannerUrl)!}
                  alt={ev.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
            )}
            <CategoryPill>{ev.category?.name}</CategoryPill>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:mt-4 sm:text-xs sm:tracking-[0.18em]">
              {formatDate(ev.eventDate)} · {ev.city?.name}
            </p>
            <h3 className="mt-1 line-clamp-2 text-base font-black text-slate-900 sm:mt-2 sm:text-2xl">
              {ev.title}
            </h3>
            <div className="mt-3 flex flex-col items-start gap-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black text-slate-900 sm:text-lg">
                {ev.price > 0 ? `${ev.price.toLocaleString('fr-FR')} HTG` : 'Gratuit'}
              </p>
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
            title="Aucun événement à venir"
            text="Essaie une autre ville, ou reviens bientôt : le catalogue s'agrandit."
          />
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href={pageHref(city, category, page - 1)}
            aria-disabled={page <= 1}
            className={`rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 ${
              page <= 1 ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            ← Précédent
          </Link>
          <span className="text-sm font-bold text-slate-600">
            Page {page} / {data.totalPages}
          </span>
          <Link
            href={pageHref(city, category, page + 1)}
            aria-disabled={page >= data.totalPages}
            className={`rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 ${
              page >= data.totalPages ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            Suivant →
          </Link>
        </div>
      )}
    </section>
  );
}
