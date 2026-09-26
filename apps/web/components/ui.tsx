'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

/* ---------- Boutons (palette "campy") ---------- */

const baseBtn =
  'inline-flex items-center justify-center rounded-full font-black transition disabled:opacity-60 disabled:hover:translate-y-0';

export function PrimaryButton({
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={`${baseBtn} bg-campy px-7 py-3 text-white shadow-lg shadow-blue-200 hover:-translate-y-0.5 hover:bg-campyDark ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PrimaryLink({
  href,
  children,
  className = ''
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${baseBtn} bg-campy px-7 py-3 text-white shadow-lg shadow-blue-200 hover:-translate-y-0.5 hover:bg-campyDark ${className}`}
    >
      {children}
    </Link>
  );
}

export function DarkLink({
  href,
  children,
  className = ''
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${baseBtn} bg-slate-900 px-5 py-2.5 text-sm text-white hover:bg-campy ${className}`}
    >
      {children}
    </Link>
  );
}

export function GhostButton({
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={`${baseBtn} border border-slate-200 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------- Champs ---------- */

export const inputCls =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition focus:border-campy focus:ring-2 focus:ring-blue-100';

export function Field({
  label,
  children,
  className = ''
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-bold text-slate-800 ${className}`}>
      {label}
      {children}
    </label>
  );
}

/* ---------- En-têtes de section ---------- */

export function PageHead({
  eyebrow,
  title,
  sub
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div>
      {eyebrow && (
        <p className="text-xs font-black uppercase tracking-[0.25em] text-campy">{eyebrow}</p>
      )}
      <h1 className="mt-3 text-4xl font-black text-slate-900 md:text-5xl">{title}</h1>
      {sub && <p className="mt-3 text-lg text-slate-500">{sub}</p>}
    </div>
  );
}

/* ---------- Boîtes ---------- */

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">{children}</p>
  );
}

export function EmptyState({
  title,
  text,
  actionHref,
  actionLabel
}: {
  title: string;
  text: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-8 text-center md:p-12">
      <p className="text-xl font-black text-slate-900">{title}</p>
      <p className="mt-2 text-slate-500">{text}</p>
      {actionHref && actionLabel && (
        <PrimaryLink href={actionHref} className="mt-6">
          {actionLabel}
        </PrimaryLink>
      )}
    </div>
  );
}

/* ---------- Pastilles ---------- */

export function CategoryPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-campy">
      {children}
    </span>
  );
}

export function StatusPill({
  tone,
  children
}: {
  tone: 'green' | 'amber' | 'red' | 'slate' | 'blue';
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    slate: 'bg-slate-200 text-slate-600',
    blue: 'bg-blue-50 text-campy'
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-black ${tones[tone]}`}>
      {children}
    </span>
  );
}
