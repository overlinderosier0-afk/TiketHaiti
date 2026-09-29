'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function CategoryFilter({
  categories,
  initial
}: {
  categories: { id: number; name: string }[];
  initial: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(name: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (name) p.set('category', name);
    else p.delete('category');
    p.set('page', '1');
    router.push(`/events?${p.toString()}`);
  }

  const pill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-xs font-black transition ${
      active
        ? 'bg-campy text-white shadow-md shadow-blue-200'
        : 'border border-slate-200 bg-white text-slate-600 hover:border-campy hover:text-campy'
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => select('')} className={pill(!initial)}>
        Tous
      </button>
      {categories.map((c) => (
        <button key={c.id} onClick={() => select(c.name)} className={pill(initial === c.name)}>
          {c.name}
        </button>
      ))}
    </div>
  );
}
