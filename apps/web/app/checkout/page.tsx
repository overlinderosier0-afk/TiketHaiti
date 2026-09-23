'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

interface OrderDetail {
  id: string;
  totalAmount: number;
  quantity: number;
  paymentStatus: string;
  paymentReference: string | null;
  event: { title: string; eventDate: string; price: number; city: { name: string } };
  payments: { id: string; provider: string; status: string }[];
}

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<'moncash' | 'natcash'>('moncash');
  const [busy, setBusy] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [notice, setNotice] = useState('');
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
    setNotice('');
    try {
      const res = await api<{ checkoutUrl: string; reference: string; transactionId: string }>(
        `/payments/${provider}/initiate/${orderId}`,
        { method: 'POST' }
      );
      setCheckoutUrl(res.checkoutUrl);
      setNotice(
        `Paiement initié via ${provider === 'moncash' ? 'MonCash' : 'NatCash'} (réf. ${res.reference}). ` +
        `Mode sandbox : le webhook simulé marque la commande payée. Cette page se rafraîchit automatiquement.`
      );
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
          <p className="mt-4 text-3xl font-black text-brand">{order.totalAmount.toLocaleString('fr-FR')} HTG</p>
          <p className="mt-2 text-sm font-bold">
            Statut : <span className={order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}>{order.paymentStatus}</span>
          </p>

          {order.paymentStatus !== 'PAID' && (
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
                {busy ? 'Initialisation…' : `Payer avec ${provider === 'moncash' ? 'MonCash' : 'NatCash'}`}
              </button>
              {notice && (
                <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm">
                  <p className="font-bold">{notice}</p>
                  {checkoutUrl && (
                    <a href={checkoutUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block font-black text-brand underline">
                      Ouvrir la page de paiement sandbox ↗
                    </a>
                  )}
                </div>
              )}
            </>
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
