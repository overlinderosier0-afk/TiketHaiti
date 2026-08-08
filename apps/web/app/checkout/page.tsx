'use client';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const paymentOptions = [
  { key: 'moncash', label: 'MonCash', detail: 'Mobile Money' },
  { key: 'natcash', label: 'NatCash', detail: 'Compte mobile' },
  { key: 'visa', label: 'Carte bancaire', detail: 'Carte en ligne' }
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const event = searchParams.get('event');
  const [selected, setSelected] = useState('moncash');

  const selectedProvider = useMemo(
    () => paymentOptions.find((payment) => payment.key === selected) ?? paymentOptions[0],
    [selected]
  );

  return (
    <section className="container py-14">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-[2rem] bg-white p-8 shadow-xl">
          <h1 className="text-4xl font-black">Finaliser l'achat</h1>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-brand">Événement</p>
            <p className="mt-1 text-xl font-black">#{event ?? 'HAI-2026'}</p>
          </div>
          <div className="mt-8 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <span className="font-bold">Entrée générale × 1</span>
              <b className="text-brand">1 500 HTG</b>
            </div>
            <div className="flex items-center justify-between p-5">
              <span className="text-sm font-bold text-slate-500">Total</span>
              <b className="text-2xl font-black">1 500 HTG</b>
            </div>
          </div>
        </section>

        <aside className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-amber-200">Paiement</p>
          <h2 className="mt-3 text-3xl font-black">Choisissez</h2>
          <div className="mt-5 grid gap-3">
            {paymentOptions.map((payment) => (
              <button
                key={payment.key}
                aria-pressed={selected === payment.key}
                onClick={() => setSelected(payment.key)}
                className={`rounded-2xl border px-4 py-4 text-left font-black transition ${selected === payment.key
                  ? 'border-amber-300 bg-brand text-white shadow-lg'
                  : 'border-white/20 bg-white/5 text-white hover:bg-white/10'}`}
              >
                <span className="block">{payment.label}</span>
                <small className="mt-1 block text-xs font-bold text-white/75">{payment.detail}</small>
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Méthode actif</span>
            <p className="mt-2 font-black text-white">{selectedProvider.label}</p>
          </div>
          <button className="mt-8 w-full rounded-full bg-brand px-6 py-3 font-black text-white transition hover:bg-[#ba5521]">
            Payer maintenant
          </button>
          <p className="mt-4 text-center text-xs text-slate-300">Paiement sécurisé et chèque d'identité</p>
        </aside>
      </div>
    </section>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={<section className="container py-14"><div className="animate-pulse rounded-3xl bg-white p-8 shadow">Chargement du paiement...</div></section>}>
      <CheckoutContent />
    </Suspense>
  );
}

