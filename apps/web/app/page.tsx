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
}

interface PageResult {
  items: EventItem[];
  total: number;
}

export default function Home() {
  const [data, setData] = useState<PageResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<PageResult>('/events?limit=3')
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  return (
    <section className="container py-14">
      <section className="hero-culture relative overflow-hidden rounded-[2rem] px-8 py-20 text-white shadow-xl md:px-14">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/60 bg-white/10 blur-sm" />
        <div className="max-w-3xl animate-rise">
          <p className="mb-4 font-black uppercase tracking-[0.22em] text-amber-200">Vivez le meilleur d’Haïti</p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Les moments qui nous rassemblent.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-amber-50">
            Retrouvez les concerts, festivals et rendez-vous culturels qui mettent le pays en mouvement.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/events" className="rounded-full bg-brand px-7 py-3 font-black text-white transition hover:scale-105 hover:bg-[#ba5521]">Découvrir les événements</Link>
            <Link href="/register" className="rounded-full border border-white/70 px-7 py-3 font-black text-white transition hover:bg-white hover:text-[#203b35]">Créer un compte</Link>
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-brand p-7 text-white shadow-soft animate-rise">
          <b className="text-4xl">100%</b>
          <p className="mt-2 font-bold">Billets numériques</p>
        </div>
        <div className="rounded-3xl bg-sun p-7 shadow-soft animate-rise-2">
          <b className="text-4xl">2</b>
          <p className="mt-2 font-bold">Paiements locaux</p>
        </div>
        <div className="rounded-3xl bg-white p-7 shadow-soft animate-rise">
          <b className="text-4xl">1</b>
          <p className="mt-2 font-bold">Communauté</p>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-black uppercase tracking-[0.2em] text-brand">À l’affiche</p>
            <h2 className="mt-2 text-3xl font-black">Événements populaires</h2>
          </div>
          <Link href="/events" className="font-black text-brand">Tout voir →</Link>
        </div>

        {!data && !failed && (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-[2rem] bg-white p-6 shadow-xl">
                <div className="h-5 w-24 rounded-full bg-amber-100" />
                <div className="mt-5 h-4 w-40 rounded bg-slate-100" />
                <div className="mt-3 h-7 w-3/4 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {failed && (
          <p className="mt-8 rounded-2xl bg-white p-6 text-center font-bold text-slate-500 shadow">
            Impossible de charger les événements pour le moment.{' '}
            <Link href="/events" className="text-brand">Voir la liste complète →</Link>
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="mt-8 rounded-2xl bg-white p-6 text-center font-bold text-slate-500 shadow">
            Aucun événement publié pour le moment. Revenez bientôt !
          </p>
        )}

        {data && data.items.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {data.items.map((event) => (
              <article key={event.id} className="soft-card rounded-[2rem] border border-white bg-white p-6 shadow-xl transition hover:-translate-y-2 hover:shadow-2xl">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-brand">{event.category?.name}</span>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  {new Date(event.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {event.city?.name}
                </p>
                <h3 className="mt-3 text-2xl font-black">{event.title}</h3>
                <p className="mt-4 text-sm text-slate-600">À partir de {event.price.toLocaleString('fr-FR')} HTG</p>
                <Link href={`/events/${event.slug || event.id}`} className="mt-6 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-black hover:bg-brand hover:text-white">Voir détail</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
