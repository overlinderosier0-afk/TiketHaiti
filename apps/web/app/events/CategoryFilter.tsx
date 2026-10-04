'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function CategoryFilter({
  categories,
  initial
}: {
  categories: string[];
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
    `px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest transition ${
      active
        ? 'bg-ed-ink text-ed-paper'
        : 'border-[1.5px] border-ed-ink bg-white text-ed-ink hover:bg-ed-ink hover:text-ed-paper'
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => select('')} className={pill(!initial)}>
        Tous
      </button>
      {categories.map((c) => (
        <button key={c} onClick={() => select(c)} className={pill(initial === c)}>
          {c}
        </button>
      ))}
    </div>
  );
}
