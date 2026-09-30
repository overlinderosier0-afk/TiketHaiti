import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <span className="kicker">404</span>
      <h1 className="mt-4 text-4xl font-black tracking-tight text-tike-ink sm:text-5xl">
        Paj sa <span className="tike-grad-text">pa egziste</span>
      </h1>
      <p className="mt-4 max-w-md text-tike-muted">
        Adrès ou tap chèche a pa mennen okenn kote. Petèt evènman an
        fini, oubyen lyen an gen yon erè.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/events" className="btn-tike">
          Wè evènman yo
        </Link>
        <Link href="/" className="btn-tike-ghost">
          Tounen dakèy
        </Link>
      </div>
    </main>
  );
}
