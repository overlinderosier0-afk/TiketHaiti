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
        placeholder="Chèche… (titre, atis, vil)"
        aria-label="Chèche yon evènman"
        className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-campy focus:ring-2 focus:ring-blue-100"
      />
      <button className="shrink-0 rounded-full bg-campy px-5 py-2 text-sm font-black text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-campyDark">
        Chèche
      </button>
    </form>
  );
}
