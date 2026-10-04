import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { serverApiBase, publicUploadUrl } from '../../lib/server';
import CityFilter from './CityFilter';
import SearchBox from './SearchBox';
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
  category: string | null;
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

async function getEvents(city: string, category: string, q: string, page: number): Promise<PageResult> {
  const params = new URLSearchParams({ status: 'PUBLISHED', page: String(page), limit: '12' });
  if (city) params.set('city', city);
  if (category) params.set('category', category);
  if (q) params.set('q', q);
  // L'API exclut déjà les événements terminés par défaut.
  const res = await fetch(`${serverApiBase()}/events?${params.toString()}`, {
    next: { revalidate: 60 }
  });
  if (!res.ok) throw new Error(`Catalogue indisponible (${res.status})`);
  return (await res.json()) as PageResult;
}

async function getCategories(): Promise<string[]> {
  try {
    const res = await fetch(`${serverApiBase()}/events/categories`, {
      next: { revalidate: 600 }
    });
    if (!res.ok) return [];
    return (await res.json()) as string[];
  } catch {
    return [];
  }
}

function pageHref(city: string, category: string, q: string, page: number): string {
  const p = new URLSearchParams();
  if (city) p.set('city', city);
  if (category) p.set('category', category);
  if (q) p.set('q', q);
  p.set('page', String(page));
  return `/events?${p.toString()}`;
}

export default async function EventsPage({
  searchParams
}: {
  searchParams: Promise<{ city?: string; category?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const city = sp.city ?? '';
  const category = sp.category ?? '';
  const q = sp.q ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  let data: PageResult | null = null;
  let categories: string[] = [];
  let error = '';
  try {
    [data, categories] = await Promise.all([getEvents(city, category, q, page), getCategories()]);
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
        <Suspense>
          <SearchBox initial={q} />
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

      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((ev) => (
          <Link
            key={ev.id}
            href={`/events/${ev.slug || ev.id}`}
            className="group border-2 border-ed-ink bg-white p-4 transition hover:bg-ed-paper sm:p-5"
          >
            {publicUploadUrl(ev.bannerUrl) && (
              <div className="-m-4 mb-4 h-40 overflow-hidden border-b-2 border-ed-ink sm:-m-5 sm:mb-5 sm:h-48">
                <img
                  src={publicUploadUrl(ev.bannerUrl)!}
                  alt={ev.title}
                  className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                />
              </div>
            )}
            {ev.category && <CategoryPill>{ev.category}</CategoryPill>}
            <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-ed-red">
              {formatDate(ev.eventDate)} · {ev.city?.name}
            </p>
            <h3 className="mt-1 line-clamp-2 text-xl font-black tracking-tight text-ed-ink sm:text-2xl">
              {ev.title}
            </h3>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-ed-rule pt-4">
              <p className="text-lg font-black text-ed-ink">
                {ev.price > 0 ? `${ev.price.toLocaleString('fr-FR')} HTG` : 'Gratuit'}
              </p>
              {ev.ticketsAvailable > 0 ? (
                <StatusPill tone="green">{ev.ticketsAvailable} billets</StatusPill>
              ) : (
                <StatusPill tone="red">Complet</StatusPill>
              )}
            </div>
            <span className="mt-4 inline-block bg-ed-ink px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest text-ed-paper transition group-hover:bg-ed-red">
              Prendre mes billets →
            </span>
          </Link>
        ))}
      </div>

      {data && data.items.length === 0 && (
        <div className="mt-10">
          <EmptyState
            title={q ? `Aucun résultat pour « ${q} »` : 'Aucun événement à venir'}
            text={
              q
                ? 'Essaie un autre mot, ou efface la recherche pour voir tout le catalogue.'
                : "Essaie une autre ville, ou reviens bientôt : le catalogue s'agrandit."
            }
          />
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href={pageHref(city, category, q, page - 1)}
            aria-disabled={page <= 1}
            className={`border-2 border-ed-ink bg-white px-4 py-2 text-sm font-extrabold uppercase tracking-widest text-ed-ink transition hover:bg-ed-ink hover:text-ed-paper ${
              page <= 1 ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            ← Précédent
          </Link>
          <span className="text-sm font-bold text-ed-muted">
            Page {page} / {data.totalPages}
          </span>
          <Link
            href={pageHref(city, category, q, page + 1)}
            aria-disabled={page >= data.totalPages}
            className={`border-2 border-ed-ink bg-white px-4 py-2 text-sm font-extrabold uppercase tracking-widest text-ed-ink transition hover:bg-ed-ink hover:text-ed-paper ${
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
