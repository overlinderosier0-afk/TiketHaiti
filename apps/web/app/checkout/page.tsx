'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

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
      <section className="container py-16">
        <p className="font-bold text-slate-600">Aucune commande sélectionnée.</p>
        <Link href="/events" className="mt-4 inline-block font-black text-brand">Voir les événements</Link>
      </section>
    );
  }

  const providerLabel = provider === 'moncash' ? 'MonCash' : 'NatCash';
  const expired = order?.paymentStatus === 'CANCELLED';

  return (
    <section className="container max-w-2xl py-16">
      <h1 className="text-3xl font-black">Paiement</h1>

      {error && <p className="mt-6 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}

      {!order && !error && <p className="mt-8 text-slate-400">Chargement de la commande…</p>}

      {order && (
        <div className="mt-8 rounded-3xl border border-amber-100 bg-white p-7 shadow">
          <p className="text-sm text-slate-500">Commande</p>
          <h2 className="mt-1 text-xl font-black">{order.event.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {new Date(order.event.eventDate).toLocaleDateString('fr-FR')} · {order.event.city?.name} · {order.quantity} billet(s)
          </p>
          <p className="mt-4 text-3xl font-black text-brand">{order.total.toLocaleString('fr-FR')} HTG</p>
          <p className="mt-2 text-sm font-bold">
            Statut : <span className={order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}>{order.paymentStatus}</span>
          </p>

          {expired && (
            <div className="mt-6 rounded-2xl bg-red-50 p-4">
              <p className="font-bold text-red-700">Délai de paiement dépassé : cette commande a été annulée et les places libérées.</p>
              <Link href="/events" className="mt-2 inline-block font-black text-brand underline">Choisir un autre événement</Link>
            </div>
          )}

          {!expired && order.paymentStatus === 'PENDING' && !manual && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setProvider('moncash')}
                  className={`rounded-2xl border-2 p-4 font-black transition ${provider === 'moncash' ? 'border-brand bg-amber-50' : 'border-slate-200'}`}
                >
                  MonCash
                </button>
                <button
                  onClick={() => setProvider('natcash')}
                  className={`rounded-2xl border-2 p-4 font-black transition ${provider === 'natcash' ? 'border-brand bg-amber-50' : 'border-slate-200'}`}
                >
                  NatCash
                </button>
              </div>
              <button
                onClick={initiate}
                disabled={busy}
                className="mt-5 w-full rounded-full bg-brand p-3 font-black text-white transition hover:bg-[#ba5521] disabled:opacity-60"
              >
                {busy ? 'Initialisation…' : `Payer avec ${providerLabel}`}
              </button>
            </>
          )}

          {!expired && order.paymentStatus === 'PENDING' && manual && (
            <div className="mt-6 rounded-2xl bg-amber-50 p-5">
              {!manual.configured ? (
                <p className="font-bold text-red-700">
                  Paiement manuel non configuré pour le moment. Contactez le support pour finaliser votre commande.
                </p>
              ) : (
                <>
                  <p className="font-black text-lg">Payez avec {providerLabel}</p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
                    <li>
                      Envoyez <strong>{order.total.toLocaleString('fr-FR')} HTG</strong> au numéro{' '}
                      <button
                        onClick={() => copyText(manual.merchantNumber, () => setCopied('number'))}
                        className="rounded-lg bg-white px-2 py-1 font-black text-brand shadow-sm"
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
                        className="rounded-lg bg-white px-2 py-1 font-black text-brand shadow-sm"
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
                    <p className="mt-3 text-xs font-bold text-slate-500">
                      Paiement attendu avant le {new Date(order.expiresAt).toLocaleString('fr-FR')}, sinon la commande est annulée.
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
