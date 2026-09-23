'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { ErrorBox, PageHead, PrimaryButton, StatusPill } from '../../components/ui';

interface OrderDetail {
  id: string;
  total: number;
  quantity: number;
  paymentStatus: string;
  paymentReference: string | null;
  expiresAt: string | null;
  event: { title: string; eventDate: string; price: number; city: { name: string } };
  payments: { id: string; provider: string; status: string }[];
}

interface ManualPayment {
  configured: boolean;
  merchantNumber: string;
  referenceNote: string | null;
  instructions: string;
}

interface InitiateResponse {
  provider: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  expiresAt: string | null;
  manualPayment: ManualPayment;
}

function copyText(text: string, done: () => void) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(done).catch(done);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    done();
  }
}

function statusTone(status: string): 'green' | 'amber' | 'red' | 'slate' {
  if (status === 'PAID') return 'green';
  if (status === 'PENDING') return 'amber';
  if (status === 'CANCELLED') return 'red';
  return 'slate';
}

function statusLabel(status: string): string {
  if (status === 'PAID') return 'Payée';
  if (status === 'PENDING') return 'En attente de paiement';
  if (status === 'CANCELLED') return 'Annulée';
  return status;
}

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<'moncash' | 'natcash'>('moncash');
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState<ManualPayment | null>(null);
  const [copied, setCopied] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => {
    if (!orderId) return;
    api<OrderDetail>(`/orders/${orderId}`)
      .then((o) => {
        setOrder(o);
        if (o.paymentStatus === 'PAID') router.push('/tickets');
      })
      .catch((e: any) => setError(e?.message || 'Commande introuvable'));
  }, [orderId, router]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  async function initiate() {
    if (!orderId) return;
    setBusy(true);
    setError('');
    try {
      const res = await api<InitiateResponse>(
        `/payments/${provider}/initiate`,
        { method: 'POST', body: JSON.stringify({ orderId }) }
      );
      setManual(res.manualPayment);
      // Rafraîchit l'expiration affichée.
      load();
    } catch (e: any) {
      setError(e?.message || 'Paiement impossible');
    } finally {
      setBusy(false);
    }
  }

  if (!orderId) {
    return (
      <section className="container max-w-2xl py-16">
        <PageHead eyebrow="Checkout" title="Paiement" sub="Aucune commande sélectionnée." />
        <Link href="/events" className="mt-6 inline-block font-black text-campy">Voir les événements →</Link>
      </section>
    );
  }

  const providerLabel = provider === 'moncash' ? 'MonCash' : 'NatCash';
  const expired = order?.paymentStatus === 'CANCELLED';

  return (
    <section className="container max-w-2xl py-16">
      <PageHead eyebrow="Checkout" title="Paiement" />

      {error && <div className="mt-6"><ErrorBox>{error}</ErrorBox></div>}

      {!order && !error && <p className="mt-8 text-slate-400">Chargement de la commande…</p>}

      {order && (
        <div className="mt-8 rounded-[1.8rem] border border-slate-100 bg-white p-7 shadow-sm md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Commande</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">{order.event.title}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {new Date(order.event.eventDate).toLocaleDateString('fr-FR')} · {order.event.city?.name} · {order.quantity} billet(s)
          </p>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-3xl font-black text-campy">{order.total.toLocaleString('fr-FR')} HTG</p>
            <StatusPill tone={statusTone(order.paymentStatus)}>{statusLabel(order.paymentStatus)}</StatusPill>
          </div>

          {expired && (
            <div className="mt-6 rounded-2xl bg-red-50 p-5">
              <p className="font-bold text-red-700">Délai de paiement dépassé : cette commande a été annulée et les places libérées.</p>
              <Link href="/events" className="mt-2 inline-block font-black text-campy underline">Choisir un autre événement</Link>
            </div>
          )}

          {!expired && order.paymentStatus === 'PENDING' && !manual && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {(['moncash', 'natcash'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`rounded-2xl border-2 p-4 font-black transition ${
                      provider === p
                        ? 'border-campy bg-blue-50 text-campy'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {p === 'moncash' ? 'MonCash' : 'NatCash'}
                  </button>
                ))}
              </div>
              <PrimaryButton onClick={initiate} disabled={busy} className="mt-5 w-full">
                {busy ? 'Initialisation…' : `Payer avec ${providerLabel}`}
              </PrimaryButton>
              <p className="mt-4 text-center text-xs font-bold text-slate-400">
                Tu recevras le numéro marchand et ta référence de paiement à l'étape suivante.
              </p>
            </>
          )}

          {!expired && order.paymentStatus === 'PENDING' && manual && (
            <div className="mt-6 rounded-2xl bg-blue-50 p-5 md:p-6">
              {!manual.configured ? (
                <p className="font-bold text-red-700">
                  Paiement manuel non configuré pour le moment. Contactez le support pour finaliser votre commande.
                </p>
              ) : (
                <>
                  <p className="text-lg font-black text-slate-900">Payez avec {providerLabel}</p>
                  <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-6 text-slate-700">
                    <li>
                      Envoyez <strong>{order.total.toLocaleString('fr-FR')} HTG</strong> au numéro{' '}
                      <button
                        onClick={() => copyText(manual.merchantNumber, () => setCopied('number'))}
                        className="rounded-lg bg-white px-2 py-1 font-black text-campy shadow-sm transition hover:bg-blue-100"
                        title="Copier le numéro"
                      >
                        {manual.merchantNumber} {copied === 'number' ? '✓' : '⧉'}
                      </button>{' '}
                      via {providerLabel}.
                    </li>
                    <li>
                      Dans la <strong>note du transfert</strong>, recopiez exactement la référence{' '}
                      <button
                        onClick={() => copyText(manual.referenceNote || '', () => setCopied('ref'))}
                        className="rounded-lg bg-white px-2 py-1 font-mono font-black text-campy shadow-sm transition hover:bg-blue-100"
                        title="Copier la référence"
                      >
                        {manual.referenceNote} {copied === 'ref' ? '✓' : '⧉'}
                      </button>
                    </li>
                    <li>
                      Notre équipe vérifie la réception : vos billets sont émis automatiquement.
                      Cette page se rafraîchit toute seule.
                    </li>
                  </ol>
                  {order.expiresAt && (
                    <p className="mt-4 rounded-xl bg-white/70 p-3 text-xs font-bold text-slate-500">
                      ⏳ Paiement attendu avant le {new Date(order.expiresAt).toLocaleString('fr-FR')}, sinon la commande est annulée.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<section className="container py-16">Chargement…</section>}>
      <CheckoutForm />
    </Suspense>
  );
}
