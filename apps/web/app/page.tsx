'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  city: { name: string };
  category: string | null;
  eventDate: string;
  price: number;
  bannerUrl: string | null;
}

interface PageResult {
  items: EventItem[];
  total: number;
}

/*
 * Numéros marchands affichés sur la landing.
 * Source de vérité : MERCHANT_MONCASH_NUMBER / MERCHANT_NATCASH_NUMBER dans le .env de l'API.
 * Si tu changes les numéros côté API, mets à jour ces deux constantes.
 */
const MONCASH_NUMBER = '+509 3642 5538';
const NATCASH_NUMBER = '+509 3584 5627';

const MOIS_COURT = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

function fmtDate(iso: string): { jour: string; mois: string; annee: string } {
  const d = new Date(iso);
  return {
    jour: String(d.getDate()),
    mois: MOIS_COURT[d.getMonth()] ?? '',
    annee: String(d.getFullYear())
  };
}

function fmtPrice(p: number): string {
  if (p <= 0) return 'Gratuit';
  return `${p.toLocaleString('fr-FR')} HTG`;
}

function eventHref(e: EventItem): string {
  return `/events/${e.slug || e.id}`;
}

function nextEvent(items: EventItem[]): EventItem | null {
  if (!items.length) return null;
  const now = Date.now();
  const upcoming = items
    .filter((e) => new Date(e.eventDate).getTime() >= now - 24 * 3600 * 1000)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  return upcoming[0] ?? items[0];
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copier ${label}`}
      onClick={() => {
        const finish = () => {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        };
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(finish).catch(finish);
        else finish();
      }}
      className="ml-3 inline-flex items-center border-2 border-ed-ink bg-ed-paper px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-ed-ink transition hover:bg-ed-ink hover:text-ed-paper"
    >
      {done ? 'Copié' : 'Copier'}
    </button>
  );
}

/* ---------------- Hero ---------------- */

function Hero({ events }: { events: EventItem[] | null }) {
  const headliner = events ? nextEvent(events) : null;
  const d = headliner ? fmtDate(headliner.eventDate) : null;
  return (
    <section className="border-b-2 border-ed-ink">
      <div className="container py-14 md:py-20">
        <p className="ed-kicker">La billetterie d&apos;Haïti · Cap-Haïtien</p>
        <h1 className="mt-5 font-black uppercase leading-[0.95] tracking-tight text-ed-ink text-[clamp(3rem,9vw,7.5rem)]">
          Le konpa
          <br />
          <span className="ed-outline">t&apos;attend.</span>
        </h1>
        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_360px] md:items-start">
          <div>
            <p className="max-w-[46ch] text-lg text-ed-muted">
              TikeAyiti vend les billets des concerts et festivals d&apos;Haïti. Tu paies par MonCash
              ou NatCash, ton billet QR arrive par email. Sans carte bancaire, sans complication.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href="/events"
                className="bg-ed-red px-8 py-4 text-sm font-extrabold uppercase tracking-widest text-white transition hover:bg-ed-ink"
              >
                Voir les événements
              </Link>
              <Link
                href="#comment-ca-marche"
                className="border-2 border-ed-ink px-8 py-4 text-sm font-extrabold uppercase tracking-widest text-ed-ink transition hover:bg-ed-ink hover:text-ed-paper"
              >
                Comment ça marche
              </Link>
            </div>
          </div>
          <aside aria-label="Prochain événement" className="border-2 border-ed-ink bg-white">
            <div className="border-b-2 border-dashed border-ed-ink p-5">
              <p className="ed-kicker">Prochain événement</p>
              {headliner && d ? (
                <>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-ed-ink">{headliner.title}</h2>
                  <p className="mt-1 text-sm text-ed-muted">
                    {d.jour} {d.mois} {d.annee} · {headliner.city?.name ?? ''}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-ed-muted">Chargement…</p>
              )}
            </div>
            <div className="flex items-center justify-between p-5">
              <span className="text-xl font-black text-ed-ink">{headliner ? fmtPrice(headliner.price) : '…'}</span>
              {headliner && (
                <Link
                  href={eventHref(headliner)}
                  className="bg-ed-ink px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest text-ed-paper transition hover:bg-ed-red"
                >
                  Acheter
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Agenda ---------------- */

function Agenda({ events }: { events: EventItem[] | null }) {
  return (
    <section id="agenda" className="container scroll-mt-24 py-14 md:py-16">
      <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-black uppercase tracking-tight text-ed-ink">
        L&apos;agenda
      </h2>
      <p className="mt-2 text-ed-muted">Toutes les dates, un seul endroit. Prix affichés en gourdes.</p>
      <div className="mt-8">
        {events === null && <p className="py-8 text-ed-muted">Chargement des événements…</p>}
        {events && events.length === 0 && (
          <div className="border-2 border-dashed border-ed-rule p-10 text-center">
            <p className="font-bold text-ed-muted">
              Aucun événement pour le moment. Reviens bientôt, la scène ne dort jamais longtemps.
            </p>
            <Link
              href="/events"
              className="mt-5 inline-block bg-ed-ink px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-ed-paper transition hover:bg-ed-red"
            >
              Voir tous les événements
            </Link>
          </div>
        )}
        {events &&
          events.map((e) => {
            const d = fmtDate(e.eventDate);
            const soon =
              new Date(e.eventDate).getTime() - Date.now() < 14 * 24 * 3600 * 1000 &&
              new Date(e.eventDate).getTime() >= Date.now();
            return (
              <Link
                key={e.id}
                href={eventHref(e)}
                className="group grid grid-cols-[86px_1fr_auto] items-center gap-4 border-t border-ed-rule px-1 py-5 transition last:border-b hover:bg-[#f3ecdd] md:grid-cols-[110px_1fr_auto_auto] md:gap-6"
              >
                <div className="font-black uppercase leading-tight text-ed-ink">
                  <span className="block text-base">
                    {d.jour} {d.mois}
                  </span>
                  <span className="block text-xs text-ed-red">{d.annee}</span>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-ed-ink group-hover:text-ed-red md:text-2xl">
                    {e.title}
                  </h3>
                  <p className="text-sm text-ed-muted">{e.city?.name ?? ''}</p>
                </div>
                <span
                  className={`hidden border-[1.5px] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest md:inline-block ${
                    soon ? 'border-ed-red bg-ed-red text-white' : 'border-ed-ink text-ed-ink'
                  }`}
                >
                  {soon ? 'Bientôt' : 'En vente'}
                </span>
                <span className="whitespace-nowrap text-lg font-black text-ed-ink">{fmtPrice(e.price)}</span>
              </Link>
            );
          })}
      </div>
    </section>
  );
}

/* ---------------- Manifeste ---------------- */

function Manifesto() {
  return (
    <section className="bg-ed-ink py-14 text-ed-paper md:py-16">
      <div className="container">
        <p className="max-w-[38ch] text-[clamp(1.4rem,3.2vw,2.4rem)] font-extrabold leading-snug tracking-tight">
          Fini les billets perdus et les longues files.{' '}
          <span className="text-ed-red">Ton billet vit dans ton téléphone</span>, ton paiement passe
          par ton mobile money, et la fête commence à l&apos;heure.
        </p>
      </div>
    </section>
  );
}

/* ---------------- Comment ça marche ---------------- */

const STEPS = [
  {
    n: '01',
    title: 'Tu choisis',
    text: 'Sélectionne ton événement et tes billets. Une référence TH-XXXXXX est créée pour ta commande.'
  },
  {
    n: '02',
    title: 'Tu paies par mobile',
    text: 'Envoie le montant exact via MonCash ou NatCash au numéro marchand, avec ta référence en note.'
  },
  {
    n: '03',
    title: 'Tu entres avec ton QR',
    text: "Dès le paiement vérifié, ton billet à QR sécurisé arrive par email. Présente-le à l'entrée."
  }
];

function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="container scroll-mt-24 py-14 md:py-16">
      <p className="ed-kicker">Le parcours</p>
      <h2 className="mt-3 text-[clamp(2rem,4.5vw,3.5rem)] font-black uppercase tracking-tight text-ed-ink">
        Trois gestes, c&apos;est réglé
      </h2>
      <div className="mt-8">
        {STEPS.map((s) => (
          <div key={s.n} className="grid grid-cols-[72px_1fr] gap-5 border-t border-ed-rule py-6 last:border-b md:grid-cols-[110px_1fr]">
            <span aria-hidden="true" className="ed-outline text-5xl font-black leading-none md:text-6xl">
              {s.n}
            </span>
            <div>
              <h3 className="text-lg font-extrabold uppercase tracking-wide text-ed-ink">{s.title}</h3>
              <p className="mt-1 max-w-[62ch] text-ed-muted">{s.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[
          { label: 'MonCash marchand', number: MONCASH_NUMBER },
          { label: 'NatCash marchand', number: NATCASH_NUMBER }
        ].map((m) => (
          <div key={m.label} className="border-2 border-ed-ink bg-white p-6">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-ed-muted">{m.label}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-ed-ink md:text-[1.7rem]">
              {m.number}
              <CopyButton value={m.number.replace(/\s/g, '')} label={m.label} />
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-ed-muted">
        Les numéros marchands s&apos;affichent aussi à l&apos;étape de paiement, avec ta référence personnelle.
      </p>
    </section>
  );
}

/* ---------------- CTA final ---------------- */

function FinalCta() {
  return (
    <section className="border-t-2 border-ed-ink py-14 text-center md:py-16">
      <div className="container">
        <h2 className="text-[clamp(2.2rem,5.5vw,4.5rem)] font-black uppercase tracking-tight text-ed-ink">
          On se voit au concert.
        </h2>
        <p className="mt-3 text-ed-muted">Choisis ta date, paie par mobile, reçois ton QR.</p>
        <Link
          href="/events"
          className="mt-8 inline-block bg-ed-red px-10 py-4 text-sm font-extrabold uppercase tracking-widest text-white transition hover:bg-ed-ink"
        >
          Prendre mon billet
        </Link>
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[] | null>(null);

  useEffect(() => {
    api<PageResult>('/events?limit=12')
      .then((r) => setEvents(r.items ?? []))
      .catch(() => setEvents([]));
  }, []);

  return (
    <div className="ed-scope">
      <Hero events={events} />
      <Agenda events={events} />
      <Manifesto />
      <HowItWorks />
      <FinalCta />
    </div>
  );
}
