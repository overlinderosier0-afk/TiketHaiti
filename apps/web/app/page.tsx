'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

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
      <div className="rounded-[2.8rem] border-[10px] border-slate-900 bg-white shadow-2xl">
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
    </div>
  );
}

/* ---------- Sections ---------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Dots className="absolute left-8 top-24 hidden h-28 w-28 lg:block" />
      <div className="container grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-campy">
            🎟️ La billetterie 100% haïtienne
          </p>
          <h1 className="mt-6 text-5xl font-black leading-[1.05] text-slate-900 md:text-6xl">
            Tes billets d'événements,{' '}
            <span className="text-campy">sans faire la queue.</span>
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
        </div>
        <PhoneMockup />
      </div>
    </section>
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
    <section className="bg-campy">
      <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
        {stats.map(([value, label]) => (
          <div key={label} className="text-center text-white">
            <p className="text-4xl font-black md:text-5xl">{value}</p>
            <p className="mt-1 text-sm font-bold text-white/80">{label}</p>
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
    <section className="container py-20">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-campy">À l'affiche</p>
          <h2 className="mt-3 text-4xl font-black text-slate-900 md:text-5xl">
            Les événements du moment
          </h2>
        </div>
        <Link href="/events" className="hidden font-black text-campy sm:inline">
          Tout voir →
        </Link>
      </div>

      {!data && !failed && (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-[1.8rem] bg-white p-6 shadow">
              <div className="h-5 w-24 rounded-full bg-blue-50" />
              <div className="mt-5 h-4 w-40 rounded bg-slate-100" />
              <div className="mt-3 h-7 w-3/4 rounded bg-slate-100" />
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
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {data.items.map((event) => (
            <article
              key={event.id}
              className="rounded-[1.8rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl"
            >
              {event.bannerUrl && (
                <div className="-mx-6 -mt-6 mb-6 h-44 overflow-hidden rounded-t-[1.8rem]">
                  <img src={event.bannerUrl} alt={event.title} className="h-full w-full object-cover" />
                </div>
              )}
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-campy">
                {event.category?.name}
              </span>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                {new Date(event.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} · {event.city?.name}
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">{event.title}</h3>
              <p className="mt-3 text-sm font-bold text-slate-600">
                À partir de {event.price.toLocaleString('fr-FR')} HTG
              </p>
              <Link
                href={`/events/${event.slug || event.id}`}
                className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black text-white transition hover:bg-campy"
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
    <section className="bg-white py-20">
      <div className="container">
        <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-campy">Nos atouts</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center text-4xl font-black text-slate-900 md:text-5xl">
          La façon la plus simple de sortir en Haïti.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-[1.8rem] border border-slate-100 bg-cream p-7 transition hover:-translate-y-1.5 hover:shadow-xl"
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
    <section id="comment-ca-marche" className="container py-20">
      <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-campy">Simple comme bonjou</p>
      <h2 className="mx-auto mt-3 max-w-2xl text-center text-4xl font-black text-slate-900 md:text-5xl">
        Ton billet en 3 étapes
      </h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="relative rounded-[1.8rem] bg-white p-8 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-campy text-xl font-black text-white">
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
    <section className="container py-20">
      <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-campy">FAQ</p>
      <h2 className="mx-auto mt-3 max-w-2xl text-center text-4xl font-black text-slate-900 md:text-5xl">
        Une question ? On a la réponse.
      </h2>
      <div className="mx-auto mt-10 max-w-3xl space-y-4">
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
    <section className="container pb-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-campy px-8 py-14 md:px-14">
        <Asterisk className="absolute right-10 top-8 text-5xl !text-white/40" />
        <Dots className="absolute bottom-8 left-10 h-20 w-20 opacity-40" />
        <div className="relative max-w-2xl">
          <h2 className="text-4xl font-black text-white md:text-5xl">
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
      <Hero />
      <StatsBand />
      <EventsShowcase />
      <Features />
      <HowItWorks />
      <Faq />
      <CtaBanner />
    </>
  );
}
