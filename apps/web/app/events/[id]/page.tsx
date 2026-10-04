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

  // Données structurées schema.org/Event : permettent à Google d'afficher
  // l'événement en résultat enrichi (date, prix, disponibilité).
  const eventUrl = `https://tikeayiti.com/events/${event.slug || event.id}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: new Date(event.eventDate).toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.address || event.city?.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.city?.name,
        addressCountry: 'HT'
      }
    },
    image: banner ? [banner] : [],
    offers: {
      '@type': 'Offer',
      url: eventUrl,
      price: event.price,
      priceCurrency: 'HTG',
      availability:
        event.ticketsAvailable > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut'
    },
    ...(event.artistName
      ? { performer: { '@type': 'Person', name: event.artistName } }
      : {}),
    organizer: {
      '@type': 'Organization',
      name: 'Tikè Ayiti',
      url: 'https://tikeayiti.com'
    }
  };

  return (
    <section className="container py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/events"
        className="text-sm font-extrabold uppercase tracking-widest text-ed-red transition hover:text-ed-ink"
      >
        ← Tous les événements
      </Link>

      <div className="mt-6 max-w-3xl">
        {banner ? (
          <div className="border-2 border-ed-ink bg-white">
            <div className="border-b-2 border-ed-ink">
              <img src={banner} alt={event.title} className="h-64 w-full object-cover md:h-96" />
            </div>
            <div className="p-6 md:p-8">
              {event.category && <CategoryPill>{event.category}</CategoryPill>}
              <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.2em] text-ed-red">
                {formatDate(event.eventDate)} · {event.city?.name}
              </p>
              <h1 className="mt-3 text-4xl font-black uppercase leading-tight tracking-tight text-ed-ink md:text-5xl">
                {event.title}
              </h1>
            </div>
          </div>
        ) : (
          <>
            {event.category && <CategoryPill>{event.category}</CategoryPill>}
            <p className="ed-kicker mt-4">
              {formatDate(event.eventDate)} · {event.city?.name}
            </p>
            <h1 className="mt-3 text-4xl font-black uppercase leading-tight tracking-tight text-ed-ink md:text-5xl">
              {event.title}
            </h1>
          </>
        )}
        {event.artistName && (
          <p className="mt-3 text-xl font-bold text-ed-muted">{event.artistName}</p>
        )}
        {isPast && (
          <div className="mt-6">
            <StatusPill tone="red">Événement terminé</StatusPill>
          </div>
        )}
        <p className="mt-6 text-lg leading-8 text-ed-muted">{event.description}</p>
        <div className="mt-6 space-y-1 text-sm font-bold text-ed-muted">
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
