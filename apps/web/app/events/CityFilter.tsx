'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function CityFilter({ initial }: { initial: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [city, setCity] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(searchParams.toString());
    if (city.trim()) p.set('city', city.trim());
    else p.delete('city');
    p.set('page', '1');
    router.push(`/events?${p.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full gap-2 sm:w-auto">
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
  );
}
