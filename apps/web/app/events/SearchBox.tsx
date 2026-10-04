'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(searchParams.toString());
    if (q.trim()) p.set('q', q.trim());
    else p.delete('q');
    p.set('page', '1');
    router.push(`/events?${p.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full gap-2 sm:w-auto sm:min-w-[260px]">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher… (titre, artiste, ville)"
        aria-label="Rechercher un événement"
        className="min-w-0 flex-1 border-2 border-ed-ink bg-white px-4 py-2 text-sm outline-none transition placeholder:text-ed-muted/60 focus:border-ed-red"
      />
      <button className="shrink-0 bg-ed-red px-5 py-2 text-sm font-extrabold uppercase tracking-widest text-white transition hover:bg-ed-ink">
        Chèche
      </button>
    </form>
  );
}
