'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../lib/auth';

function LogoMark() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-tike-violet shadow-lg">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-5z" />
        <path d="M13 5v2M13 11v2M13 17v2" />
      </svg>
    </span>
  );
}

export default function AdminAwareNav() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/events', label: 'Evènman' },
    { href: '/tickets', label: 'Tikè mwen' },
    { href: '/#kijan-li-mache', label: 'Kijan li mache' },
    { href: '/#organizateur', label: 'Pou òganizatè' },
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin' }] : [])
  ];

  return (
    <>
      <nav className="container flex h-[72px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-xl font-black tracking-tight text-tike-ink">
            Tikè <span className="tike-grad-text">Ayiti</span>
          </span>
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[0.95rem] font-semibold text-tike-muted transition hover:text-tike-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <span className="hidden text-sm font-bold text-tike-ink sm:block">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={logout}
                className="rounded-full border-[1.5px] border-tike-violet/20 bg-white px-5 py-2.5 font-display text-sm font-extrabold text-tike-ink transition hover:-translate-y-0.5"
              >
                Dekonekte
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full border-[1.5px] border-tike-violet/20 bg-white px-5 py-2.5 font-display text-sm font-extrabold text-tike-ink transition hover:-translate-y-0.5 sm:block"
              >
                Konekte
              </Link>
              <Link
                href="/register"
                className="hidden rounded-full bg-tike-violet px-6 py-3 font-display text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-tike-pink sm:block"
              >
                Kreye evènman
              </Link>
            </>
          )}
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Fèmen meni an' : 'Louvri meni an'}
            aria-expanded={open}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-tike-violet/20 text-tike-ink transition hover:bg-white md:hidden"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 4l12 12M16 4L4 16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </button>
        </div>
      </nav>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-t border-tike-violet/10 bg-white shadow-xl md:hidden">
          <div className="container flex flex-col py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base font-bold text-tike-ink transition hover:bg-tike-bg hover:text-tike-violet active:bg-slate-100"
              >
                {l.label}
              </Link>
            ))}
            {!loading && !user && (
              <div className="mt-2 flex gap-3 border-t border-tike-violet/10 px-4 pb-2 pt-4">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full border-[1.5px] border-tike-violet/20 bg-white px-4 py-3 text-center font-display text-sm font-extrabold text-tike-ink"
                >
                  Konekte
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full bg-tike-violet px-4 py-3 text-center font-display text-sm font-extrabold text-white shadow-md hover:bg-tike-pink"
                >
                  Kreye evènman
                </Link>
              </div>
            )}
            {!loading && user && (
              <div className="mt-2 border-t border-tike-violet/10 px-4 pb-2 pt-4">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-tike-violet px-4 py-3 text-center font-display text-sm font-extrabold text-white shadow-md hover:bg-tike-pink"
                >
                  Pwofil mwen
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
