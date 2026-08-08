'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const events = [
  {
    id: '1',
    title: 'Festival de Jacmel',
    city: 'Jacmel',
    date: '12 août 2026',
    desc: 'Musique, art et culture au bord de la mer.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80'
  },
  {
    id: '2',
    title: 'Tech Summit Haïti',
    city: 'Port-au-Prince',
    date: '21 septembre 2026',
    desc: 'Les idées qui construisent demain.',
    image: 'https://images.unsplash.com/photo-1523374228107-6d1f0a85f5d3?auto=format&fit=crop&q=80'
  },
  {
    id: '3',
    title: 'Lumières de la culture',
    city: 'Cap-Haïtien',
    date: '04 octobre 2026',
    desc: 'Danse, patrimoine et célébration de nos racines.',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80'
  },
  {
    id: '4',
    title: 'Rendez-vous du Sud',
    city: 'Les Cayes',
    date: '18 octobre 2026',
    desc: 'Animation locale, gastronomie et concerts.',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80'
  }
];

export default function Events() {
  const [zone, setZone] = useState('');

  const filteredEvents = useMemo(() => {
    const normalized = zone.trim().toLowerCase();

    if (!normalized) {
      return events;
    }

    return events.filter((event) => {
      return (
        event.city.toLowerCase().includes(normalized) ||
        event.title.toLowerCase().includes(normalized) ||
        event.desc.toLowerCase().includes(normalized)
      );
    });
  }, [zone]);

  return (
    <section className="container py-14">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-black uppercase tracking-[0.2em] text-brand">Calendrier</p>
          <h1 className="mt-2 text-4xl font-black">Tous les événements</h1>
        </div>
        <Link href="/register" className="rounded-full border border-brand px-5 py-2 font-black text-brand transition hover:bg-brand hover:text-white">S’inscrire</Link>
      </div>

      <section className="mb-8 rounded-[2rem] border border-amber-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Recherche par région / zone</span>
            <input
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-brand"
              placeholder="Ex. Jacmel, Port-au-Prince, Sud..."
            />
          </label>
          <button onClick={() => setZone('')} className="rounded-full bg-slate-900 px-6 py-3 font-black text-white transition hover:bg-brand">
            Réinitialiser
          </button>
        </div>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {filteredEvents.map((e) => (
          <Link href={`/events/${e.id}`} key={e.id} className="overflow-hidden rounded-[2rem] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="h-44 bg-cover bg-center" style={{ backgroundImage: `url('${e.image}')` }} />
            <article className="p-7">
              <p className="font-black text-brand">{e.date} · {e.city}</p>
              <h2 className="mt-3 text-2xl font-black">{e.title}</h2>
              <p className="mt-2 text-slate-600">{e.desc}</p>
              <span className="mt-6 inline-block font-black text-brand">Voir l'événement →</span>
            </article>
          </Link>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="mt-8 rounded-3xl bg-amber-50 p-8 text-center font-black text-slate-700">
          Aucun événement trouvé pour cette zone.
        </div>
      )}
    </section>
  );
}

