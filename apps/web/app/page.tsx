'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, uploadUrl } from '../lib/api';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  city: { name: string };
  category: { name: string };
  eventDate: string;
  price: number;
  bannerUrl: string | null;
}

interface PageResult {
  items: EventItem[];
  total: number;
}

/* ---------- Petits éléments décoratifs ---------- */

function Asterisk({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-block select-none font-black text-campy ${className}`}>
      ✳
    </span>
  );
}

function Dots({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none ${className}`}
      style={{
        backgroundImage: 'radial-gradient(rgba(47,91,255,0.35) 2px, transparent 2px)',
        backgroundSize: '18px 18px'
      }}
    />
  );
}

/** Faux QR décoratif (motif déterministe) pour le mockup téléphone. */
function FakeQr() {
  const cells = [];
  for (let i = 0; i < 64; i++) {
    const on = (i * 7 + 13) % 3 !== 0 && (i * 11 + 5) % 7 !== 0;
    cells.push(
      <span key={i} className={`block h-full w-full ${on ? 'bg-slate-900' : 'bg-white'}`} />
    );
  }
  return (
    <div className="grid grid-cols-8 gap-[2px] rounded-xl bg-white p-2 shadow-inner" style={{ width: 120, height: 120 }}>
      {cells}
    </div>
  );
}

/** Mockup téléphone avec un billet TiketHaiti à l'intérieur. */
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] rotate-3 sm:w-[300px]">
      <Asterisk className="absolute -left-10 top-6 text-4xl" />
      <Dots className="absolute -right-12 bottom-10 h-24 w-24" />
      <div className="animate-float rounded-[2.8rem] border-[10px] border-slate-900 bg-white shadow-2xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-cream px-4 pb-5 pt-8">
          <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" />
          <p className="text-center text-sm font-black text-campy">Tikè Ayiti</p>
          <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-campy to-campyDark p-4 text-white">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Billet</p>
            <p className="mt-1 text-lg font-black leading-tight">Festival Mizik<br />Cap-Haïtien</p>
            <p className="mt-2 text-xs font-bold text-white/80">Sam. 12 déc. · 19h00</p>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-white p-3 shadow">
            <FakeQr />
            <div className="pl-3">
              <p className="font-mono text-sm font-black text-slate-900">TH-8F3K2A</p>
              <p className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">
                ✓ Vérifié
              </p>
              <p className="mt-2 text-[11px] font-bold text-slate-500">2 billets · 1 500 HTG</p>
            </div>
          </div>
          <div className="mt-3 rounded-full bg-campy py-2.5 text-center text-sm font-black text-white">
            Mes billets
          </div>
        </div>
      </div>
      {/* Badges flottants */}
      <div className="animate-float-slow absolute -right-6 top-16 rounded-2xl bg-white px-4 py-2.5 shadow-xl">
        <p className="text-xs font-black text-emerald-600">✓ Paiement confirmé</p>
        <p className="text-[11px] font-bold text-slate-500">via MonCash</p>
      </div>
      <div className="animate-float-slow absolute -left-8 bottom-20 rounded-2xl bg-white px-4 py-2.5 shadow-xl">
        <p className="text-xs font-black text-slate-900">🎟️ QR scanné</p>
        <p className="text-[11px] font-bold text-slate-500">Entrée validée</p>
      </div>
    </div>
  );
}

/* ---------- Sections ---------- */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/90 via-cream/60 to-white">
      {/* Halos décoratifs */}
      <div aria-hidden className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-campy/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-amber-300/25 blur-3xl" />
      <Dots className="absolute left-8 top-24 hidden h-28 w-28 lg:block" />
      <div className="container relative grid items-center gap-12 py-14 sm:py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-campy shadow-sm">
            🎟️ La billetterie 100% haïtienne
          </p>
          <h1 className="mt-6 text-4xl font-black leading-[1.05] text-slate-900 sm:text-5xl md:text-6xl">
            Tes billets d'événements,{' '}
            <span className="bg-gradient-to-r from-campy to-campyDark bg-clip-text text-transparent">sans faire la queue.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            Concerts, festivals, soirées… Choisis ton événement, paie par transfert{' '}
            <strong>MonCash</strong> ou <strong>NatCash</strong>, et reçois ton billet QR
            dès que ton paiement est validé.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/events"
              className="rounded-full bg-campy px-8 py-3.5 font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-campyDark"
            >
              Voir les événements
            </Link>
            <a
              href="#comment-ca-marche"
              className="inline-flex items-center gap-3 font-black text-slate-900"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-campy shadow">
                ▶
              </span>
              Comment ça marche
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Concert', 'Festival', 'Culture', 'Sport'].map((c) => (
              <Link
                key={c}
                href={`/events?category=${encodeURIComponent(c)}`}
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs font-black text-slate-600 backdrop-blur transition hover:border-campy hover:text-campy"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
        <PhoneMockup />
      </div>
      {/* Vague de transition */}
      <svg aria-hidden viewBox="0 0 1440 60" preserveAspectRatio="none" className="relative block h-10 w-full text-campy">
        <path d="M0,32 C240,60 480,0 720,24 C960,48 1200,8 1440,32 L1440,60 L0,60 Z" fill="currentColor" />
      </svg>
    </section>
  );
}

/** Bandeau défilant avec les villes (décoratif). */
function Marquee() {
  const cities = ['Port-au-Prince', 'Cap-Haïtien', 'Jacmel', 'Les Cayes', 'Gonaïves', 'Saint-Marc', 'Pétion-Ville', 'Jérémie'];
  const row = [...cities, ...cities];
  return (
    <div className="overflow-hidden bg-campy py-4">
      <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {row.map((c, i) => (
          <span key={i} className="flex items-center gap-8 text-sm font-black uppercase tracking-[0.25em] text-white">
            {c} <span className="text-white/50">✳</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function StatsBand() {
  const stats: [string, string][] = [
    ['100%', 'Billets numériques'],
    ['2', 'Paiements locaux'],
    ['24/7', 'Billets accessibles'],
    ['0', "File d'attente"]
  ];
  return (
    <section className="bg-white">
      <div className="container grid grid-cols-2 gap-6 py-12 md:grid-cols-4">
        {stats.map(([value, label]) => (
          <div key={label} className="rounded-3xl bg-cream p-6 text-center transition hover:-translate-y-1 hover:shadow-lg">
            <p className="bg-gradient-to-r from-campy to-campyDark bg-clip-text text-4xl font-black text-transparent md:text-5xl">{value}</p>
            <p className="mt-1 text-sm font-bold text-slate-600">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EventsShowcase() {
  const [data, setData] = useState<PageResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<PageResult>('/events?limit=3')
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  return (
    <section className="container py-14 sm:py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-campy">À l'affiche</p>
          <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl md:text-5xl">
            Les événements du moment
          </h2>
        </div>
        <Link href="/events" className="shrink-0 font-black text-campy">
          Tout voir →
        </Link>
      </div>

      {!data && !failed && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-3xl bg-white p-3 shadow sm:rounded-[1.8rem] sm:p-6">
              <div className="h-4 w-16 rounded-full bg-blue-50 sm:h-5 sm:w-24" />
              <div className="mt-3 h-3 w-24 rounded bg-slate-100 sm:mt-5 sm:h-4 sm:w-40" />
              <div className="mt-2 h-5 w-3/4 rounded bg-slate-100 sm:mt-3 sm:h-7" />
            </div>
          ))}
        </div>
      )}

      {failed && (
        <p className="mt-10 rounded-2xl bg-white p-6 text-center font-bold text-slate-500 shadow">
          Impossible de charger les événements pour le moment.{' '}
          <Link href="/events" className="text-campy">Voir la liste complète →</Link>
        </p>
      )}

      {data && data.items.length === 0 && (
        <p className="mt-10 rounded-2xl bg-white p-6 text-center font-bold text-slate-500 shadow">
          Aucun événement publié pour le moment. Revenez bientôt !
        </p>
      )}

      {data && data.items.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 md:grid-cols-3">
          {data.items.map((event) => (
            <article
              key={event.id}
              className="group rounded-3xl border border-slate-100 bg-white p-3 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl sm:rounded-[1.8rem] sm:p-6"
            >
              {uploadUrl(event.bannerUrl) && (
                <div className="-m-3 mb-3 h-28 overflow-hidden rounded-t-3xl sm:-mx-6 sm:-mt-6 sm:mb-6 sm:h-44 sm:rounded-t-[1.8rem]">
                  <img src={uploadUrl(event.bannerUrl)!} alt={event.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                </div>
              )}
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-campy">
                {event.category?.name}
              </span>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:mt-4 sm:text-xs sm:tracking-[0.18em]">
                {new Date(event.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} · {event.city?.name}
              </p>
              <h3 className="mt-1 line-clamp-2 text-base font-black text-slate-900 sm:mt-2 sm:text-2xl">{event.title}</h3>
              <p className="mt-2 text-xs font-bold text-slate-600 sm:mt-3 sm:text-sm">
                {event.price > 0 ? `À partir de ${event.price.toLocaleString('fr-FR')} HTG` : 'Entrée gratuite'}
              </p>
              <Link
                href={`/events/${event.slug || event.id}`}
                className="mt-3 hidden rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black text-white transition hover:bg-campy sm:mt-5 sm:inline-flex"
              >
                Prendre mes billets →
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/** Tuiles de catégories avec vraies photos (liens vers le catalogue). */
function Categories() {
  // Tuiles alimentées par les vraies catégories en base (endpoint public).
  // Chaque tuile filtre le catalogue : /events?category=Nom.
  const IMG_BY_CATEGORY: Record<string, string> = {
    concert: '/categories/concert.jpg',
    festival: '/categories/festival.jpg',
    culture: '/categories/soiree.jpg',
    sport: '/categories/sport.jpg',
    conference: '/categories/conference.jpg'
  };
  const FALLBACK_IMG = '/categories/soiree.jpg';
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const [cats, setCats] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${base}/events/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => Array.isArray(list) && setCats(list))
      .catch(() => {});
  }, []);
  return (
    <section className="bg-cream/60 py-14 sm:py-20">
      <div className="container">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-campy">Parcourir</p>
        <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl md:text-5xl">
          Qu'est-ce qui te tente ?
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {cats.map((c) => {
            const img = IMG_BY_CATEGORY[normalize(c.name)] || FALLBACK_IMG;
            return (
              <Link
                key={c.id}
                href={`/events?category=${encodeURIComponent(c.name)}`}
                className="group relative h-36 overflow-hidden rounded-3xl text-white shadow-md transition hover:-translate-y-1.5 hover:shadow-xl sm:h-44"
              >
                <img
                  src={img}
                  alt={c.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
              <span className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 block p-4 sm:p-5">
                <span className="block text-sm font-black sm:text-base">{c.name}</span>
                <span className="mt-0.5 inline-block text-xs font-bold text-white/80 opacity-0 transition group-hover:opacity-100">
                  Explorer →
                </span>
              </span>
            </Link>
            );
          })}
        </div>
        <p className="mt-4 text-center text-[11px] font-medium text-slate-400">
          Photos : contributeurs Flickr et Wikimedia Commons (tuile « Conférence » : Biswarup Ganguly, CC BY), licences Creative Commons
        </p>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: '💳',
      title: 'Paiement MonCash & NatCash',
      text: 'Paie comme tu as l’habitude : un simple transfert depuis ton téléphone, avec ta référence de commande en note.',
      link: '/events',
      linkLabel: 'Voir les événements'
    },
    {
      icon: '🎟️',
      title: 'Billets QR sécurisés',
      text: 'Chaque billet porte un QR signé et unique. Impossible à falsifier, vérifiable en un scan à l’entrée.',
      link: '/tickets',
      linkLabel: 'Mes billets'
    },
    {
      icon: '⚡',
      title: 'Billets émis après validation',
      text: 'Dès que notre équipe confirme ton transfert (en général quelques minutes), tes billets apparaissent dans ton compte, avec PDF téléchargeable.',
      link: '/events',
      linkLabel: 'En profiter'
    },
    {
      icon: '🇭🇹',
      title: 'Pensé pour Haïti',
      text: 'Prix en gourdes, interface en français, support local qui comprend comment tu paies vraiment.',
      link: '/register',
      linkLabel: 'Créer un compte'
    }
  ];
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="container">
        <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-campy">Nos atouts</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-black text-slate-900 sm:text-4xl md:text-5xl">
          La façon la plus simple de sortir en Haïti.
        </h2>
        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-[1.8rem] border border-slate-100 bg-cream p-6 transition hover:-translate-y-1.5 hover:shadow-xl sm:p-7"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                {f.icon}
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-900">{f.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{f.text}</p>
              <Link href={f.link} className="mt-4 inline-block text-sm font-black text-campy">
                {f.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '1', title: 'Choisis ton événement', text: 'Parcours le catalogue, choisis ta date et ton nombre de billets.' },
    { n: '2', title: 'Paie par transfert', text: 'Envoie le montant via MonCash ou NatCash avec ta référence en note.' },
    { n: '3', title: 'Reçois ton billet QR', text: 'Paiement confirmé, billets émis : présente ton QR à l’entrée.' }
  ];
  return (
    <section id="comment-ca-marche" className="container py-14 sm:py-20">
      <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-campy">Simple comme bonjou</p>
      <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-black text-slate-900 sm:text-4xl md:text-5xl">
        Ton billet en 3 étapes
      </h2>
      <div className="relative mt-10 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-3">
        {/* Ligne de liaison (desktop) */}
        <div aria-hidden className="absolute left-[16%] right-[16%] top-14 hidden border-t-2 border-dashed border-blue-200 md:block" />
        {steps.map((s) => (
          <div key={s.n} className="relative rounded-[1.8rem] bg-white p-6 shadow-sm sm:p-8">
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-campy text-xl font-black text-white ring-4 ring-white">
              {s.n}
            </span>
            <h3 className="mt-5 text-xl font-black text-slate-900">{s.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Appel aux organisateurs. */
function OrganizerCta() {
  return (
    <section className="container pb-14 sm:pb-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-6 py-12 sm:px-10 md:px-14 md:py-16">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-campy/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
        <Asterisk className="absolute right-8 top-8 text-5xl !text-white/20" />
        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Organisateurs</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Tu organises un événement ?
            </h2>
            <p className="mt-4 max-w-md leading-7 text-slate-300">
              Vends tes billets en ligne sans site web : publie ton événement, reçois les
              paiements MonCash & NatCash, et contrôle les entrées avec un simple scan QR.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-block rounded-full bg-campy px-8 py-3.5 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-campyDark"
            >
              Créer mon compte
            </Link>
          </div>
          <ul className="space-y-4">
            {[
              ['🚀', 'Mise en vente en quelques minutes'],
              ['💰', 'Paiements MonCash & NatCash'],
              ['📱', 'Contrôle des entrées par scan QR'],
              ['📊', 'Suivi des ventes en temps réel']
            ].map(([icon, text]) => (
              <li key={text} className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 backdrop-blur">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">{icon}</span>
                <span className="font-black text-white">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    {
      q: 'Comment je paie mon billet ?',
      a: 'Au checkout, choisis MonCash ou NatCash : tu reçois le numéro marchand et une référence (ex. TH-8F3K2A). Envoie le montant exact via ton application, en recopiant la référence dans la note du transfert. Notre équipe vérifie et confirme ton paiement.'
    },
    {
      q: 'Comment je reçois mon billet ?',
      a: 'Dès que ton paiement est confirmé, tes billets apparaissent dans la rubrique « Mes billets » avec un QR unique, et tu peux télécharger le PDF. Présente simplement ton QR à l’entrée.'
    },
    {
      q: 'Combien de temps prend la confirmation ?',
      a: 'En général quelques minutes pendant nos heures d’activité. Ta commande reste réservée pendant 2 heures : si le paiement n’est pas confirmé dans ce délai, elle est annulée et les places sont libérées.'
    },
    {
      q: 'Faut-il un compte pour acheter ?',
      a: 'Oui, un compte gratuit : il permet de retrouver tes billets, de suivre tes commandes et de recevoir tes confirmations. L’inscription prend moins d’une minute.'
    },
    {
      q: 'Puis-je me faire rembourser ?',
      a: 'Les conditions de remboursement dépendent de chaque organisateur et sont indiquées sur la page de l’événement. En cas d’annulation d’un événement, les billets sont remboursés.'
    }
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="container py-14 sm:py-20">
      <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-campy">FAQ</p>
      <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-black text-slate-900 sm:text-4xl md:text-5xl">
        Une question ? On a la réponse.
      </h2>
      <div className="mx-auto mt-8 max-w-3xl space-y-4 sm:mt-10">
        {items.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left font-black text-slate-900"
            >
              {item.q}
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition ${open === i ? 'bg-campy' : 'bg-slate-200 text-slate-600'}`}>
                {open === i ? '−' : '+'}
              </span>
            </button>
            {open === i && <p className="px-5 pb-5 leading-7 text-slate-600">{item.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="container pb-14 sm:pb-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-campy to-campyDark px-6 py-12 sm:px-8 md:px-14 md:py-14">
        <Asterisk className="absolute right-10 top-8 text-5xl !text-white/40" />
        <Dots className="absolute bottom-8 left-10 h-20 w-20 opacity-40" />
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <h2 className="text-3xl font-black text-white sm:text-4xl md:text-5xl">
            Prêt pour ta prochaine sortie ?
          </h2>
          <p className="mt-4 text-lg text-white/85">
            Les meilleurs événements d’Haïti t’attendent. Ton billet est à trois clics.
          </p>
          <Link
            href="/events"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 font-black text-campy shadow-lg transition hover:-translate-y-0.5"
          >
            Trouver mon événement
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes float { 0%,100% { transform: translateY(0) rotate(3deg); } 50% { transform: translateY(-10px) rotate(3deg); } }
        @keyframes floatSlow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-float-slow { animation: floatSlow 6s ease-in-out infinite; }
      `}</style>
      <Hero />
      <Marquee />
      <EventsShowcase />
      <Categories />
      <StatsBand />
      <Features />
      <HowItWorks />
      <OrganizerCta />
      <Faq />
      <CtaBanner />
    </>
  );
}
