'use client';

import Link from 'next/link';

export default function Error({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <span className="kicker">Oups, yon pwoblèm</span>
      <h1 className="mt-4 text-4xl font-black tracking-tight text-tike-ink sm:text-5xl">
        Bagay la <span className="tike-grad-text">kraze</span>
      </h1>
      <p className="mt-4 max-w-md text-tike-muted">
        Yon erè inatandi rive. Eseye ankò, oubyen tounen sou paj
        dakèy la, n ap okipe rès la.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button onClick={reset} className="btn-tike">
          Eseye ankò
        </button>
        <Link href="/" className="btn-tike-ghost">
          Tounen dakèy
        </Link>
      </div>
    </main>
  );
}
