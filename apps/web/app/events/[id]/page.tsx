import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverApiBase, publicUploadUrl } from '../../../lib/server';
import BuyBox from './BuyBox';
import { CategoryPill, StatusPill } from '../../../components/ui';

interface EventDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  address: string;
  artistName: string | null;
  bannerUrl: string | null;
  eventDate: string;
  doorsOpen: string | null;
  price: number;
  ticketsAvailable: number;
  status: string;
  city: { name: string };
  category: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

async function getEvent(id: string): Promise<EventDetail | null> {
  const res = await fetch(`${serverApiBase()}/events/${encodeURIComponent(id)}`, {
    next: { revalidate: 60 }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Événement indisponible (${res.status})`);
  return (await res.json()) as EventDetail;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id).catch(() => null);

  const title = event ? `${event.title} — Tikè Ayiti` : 'Événement — Tikè Ayiti';
  const description = event
    ? `${formatDate(event.eventDate)} · ${event.city?.name} · ${
        event.price > 0 ? `${event.price.toLocaleString('fr-FR')} HTG` : 'Entrée gratuite'
      }`
    : 'Concerts, festivals et événements culturels : billets en MonCash ou NatCash.';
  const image = event ? publicUploadUrl(event.bannerUrl) : null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: image ? [{ url: image }] : []
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : []
    }
  };
}

export default async function EventDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id).catch(() => null);
  if (!event) notFound();

  const isPast = new Date(event.eventDate) < new Date();
  const banner = publicUploadUrl(event.bannerUrl);

  return (
    <section className="container py-14">
      <Link
        href="/events"
        className="text-sm font-black text-campy transition hover:text-campyDark"
      >
        ← Tous les événements
      </Link>

      <div className="mt-6 max-w-3xl">
        {banner ? (
          <div className="relative overflow-hidden rounded-[1.8rem] shadow-sm">
            <img src={banner} alt={event.title} className="h-64 w-full object-cover md:h-96" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              {event.category && <CategoryPill>{event.category}</CategoryPill>}
              <h1 className="mt-3 text-4xl font-black leading-tight text-white md:text-5xl">
                {event.title}
              </h1>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-white/85">
                {formatDate(event.eventDate)} · {event.city?.name}
              </p>
            </div>
          </div>
        ) : (
          <>
            {event.category && <CategoryPill>{event.category}</CategoryPill>}
            <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-campy">
              {formatDate(event.eventDate)} · {event.city?.name}
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-slate-900 md:text-5xl">
              {event.title}
            </h1>
          </>
        )}
        {event.artistName && (
          <p className="mt-3 text-xl font-bold text-slate-600">{event.artistName}</p>
        )}
        {isPast && (
          <div className="mt-6">
            <StatusPill tone="red">Événement terminé</StatusPill>
          </div>
        )}
        <p className="mt-6 text-lg leading-8 text-slate-600">{event.description}</p>
        <div className="mt-6 space-y-1 text-sm font-bold text-slate-500">
          {event.address && <p>📍 {event.address}</p>}
          {event.doorsOpen && (
            <p>🚪 Ouverture des portes : {new Date(event.doorsOpen).toLocaleString('fr-FR')}</p>
          )}
        </div>
      </div>

      <BuyBox
        eventId={event.id}
        slug={event.slug || event.id}
        price={event.price}
        ticketsAvailable={event.ticketsAvailable}
        disabled={isPast}
        disabledReason={isPast ? 'Événement terminé' : undefined}
      />
    </section>
  );
}
