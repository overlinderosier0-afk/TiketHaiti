'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

/* ---------- Boutons (direction éditoriale v2) ---------- */

const baseBtn =
  'inline-flex items-center justify-center font-extrabold uppercase tracking-widest transition disabled:opacity-60';

export function PrimaryButton({
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={`${baseBtn} bg-ed-red px-7 py-3.5 text-sm text-white hover:bg-ed-ink ${className}`}
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
      className={`${baseBtn} bg-ed-red px-7 py-3.5 text-sm text-white hover:bg-ed-ink ${className}`}
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
      className={`${baseBtn} bg-ed-ink px-5 py-2.5 text-xs text-ed-paper hover:bg-ed-red ${className}`}
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
      className={`${baseBtn} border-2 border-ed-ink px-5 py-2.5 text-xs text-ed-ink hover:bg-ed-ink hover:text-ed-paper ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------- Champs ---------- */

export const inputCls =
  'mt-2 w-full border-2 border-ed-ink bg-white p-3 outline-none transition placeholder:text-ed-muted/60 focus:border-ed-red';

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
    <label className={`block text-sm font-bold uppercase tracking-wide text-ed-ink ${className}`}>
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
      {eyebrow && <p className="ed-kicker">{eyebrow}</p>}
      <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-ed-ink md:text-5xl">{title}</h1>
      {sub && <p className="mt-3 text-lg text-ed-muted">{sub}</p>}
    </div>
  );
}

/* ---------- Boîtes ---------- */

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <p className="border-2 border-ed-red bg-white p-4 font-bold text-ed-red">{children}</p>
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
    <div className="border-2 border-dashed border-ed-rule bg-white/60 p-8 text-center md:p-12">
      <p className="text-xl font-black uppercase tracking-tight text-ed-ink">{title}</p>
      <p className="mt-2 text-ed-muted">{text}</p>
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
    <span className="inline-block border-[1.5px] border-ed-ink px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-ed-ink">
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
    green: 'bg-ed-ink text-ed-paper',
    amber: 'border-[1.5px] border-ed-ink text-ed-ink',
    red: 'bg-ed-red text-white',
    slate: 'bg-ed-rule/40 text-ed-muted',
    blue: 'border-[1.5px] border-ed-ink text-ed-ink'
  };
  return (
    <span className={`inline-block px-3 py-1 text-xs font-extrabold uppercase tracking-widest ${tones[tone]}`}>
      {children}
    </span>
  );
}
