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
  // Une fois la redirection vers /tickets déclenchée, on ne doit plus
  // rien faire : sinon le bouton « retour » du navigateur retombe sur
  // cette page qui repousse aussitôt vers /tickets (boucle).
  const redirectedRef = useRef(false);

  const load = useCallback(() => {
    if (!orderId || redirectedRef.current) return;
    api<OrderDetail>(`/orders/${orderId}`)
      .then((o) => {
        setOrder(o);
        if (o.paymentStatus === 'PAID' && !redirectedRef.current) {
          redirectedRef.current = true;
          if (pollRef.current) clearInterval(pollRef.current);
          // replace (pas push) : le checkout ne reste pas dans l'historique,
          // le bouton « retour » ramène à la page précédente.
          router.replace('/tickets');
        }
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
        <Link href="/events" className="mt-6 inline-block text-sm font-extrabold uppercase tracking-widest text-ed-red">Voir les événements →</Link>
      </section>
    );
  }

  const providerLabel = provider === 'moncash' ? 'MonCash' : 'NatCash';
  const expired = order?.paymentStatus === 'CANCELLED';

  return (
    <section className="container max-w-2xl py-16">
      <PageHead eyebrow="Checkout" title="Paiement" />

      {error && <div className="mt-6"><ErrorBox>{error}</ErrorBox></div>}

      {!order && !error && <p className="mt-8 text-ed-muted">Chargement de la commande…</p>}

      {order && (
        <div className="mt-8 border-2 border-ed-ink bg-white p-7 md:p-8">
          <p className="ed-kicker">Commande</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-ed-ink">{order.event.title}</h2>
          <p className="mt-1 text-sm font-bold text-ed-muted">
            {new Date(order.event.eventDate).toLocaleDateString('fr-FR')} · {order.event.city?.name} · {order.quantity} billet(s)
          </p>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-3xl font-black tracking-tight text-ed-red">{order.total.toLocaleString('fr-FR')} HTG</p>
            <StatusPill tone={statusTone(order.paymentStatus)}>{statusLabel(order.paymentStatus)}</StatusPill>
          </div>

          {expired && (
            <div className="mt-6 border-2 border-ed-red bg-white p-5">
              <p className="font-bold text-ed-red">Délai de paiement dépassé : cette commande a été annulée et les places libérées.</p>
              <Link href="/events" className="mt-2 inline-block text-sm font-extrabold uppercase tracking-widest text-ed-red underline">Choisir un autre événement</Link>
            </div>
          )}

          {!expired && order.paymentStatus === 'PENDING' && !manual && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {(['moncash', 'natcash'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`border-2 p-4 text-sm font-extrabold uppercase tracking-widest transition ${
                      provider === p
                        ? 'border-ed-red bg-ed-red text-white'
                        : 'border-ed-ink bg-white text-ed-ink hover:bg-ed-ink hover:text-ed-paper'
                    }`}
                  >
                    {p === 'moncash' ? 'MonCash' : 'NatCash'}
                  </button>
                ))}
              </div>
              <PrimaryButton onClick={initiate} disabled={busy} className="mt-5 w-full">
                {busy ? 'Initialisation…' : `Payer avec ${providerLabel}`}
              </PrimaryButton>
              <p className="mt-4 text-center text-xs font-bold text-ed-muted">
                Tu recevras le numéro marchand et ta référence de paiement à l'étape suivante.
              </p>
            </>
          )}

          {!expired && order.paymentStatus === 'PENDING' && manual && (
            <div className="mt-6 border-2 border-ed-ink bg-ed-paper p-5 md:p-6">
              {!manual.configured ? (
                <p className="font-bold text-ed-red">
                  Paiement manuel non configuré pour le moment. Contactez le support pour finaliser votre commande.
                </p>
              ) : (
                <>
                  <p className="text-lg font-black uppercase tracking-tight text-ed-ink">Payez avec {providerLabel}</p>
                  <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-6 text-ed-ink">
                    <li>
                      Envoyez <strong>{order.total.toLocaleString('fr-FR')} HTG</strong> au numéro{' '}
                      <button
                        onClick={() => copyText(manual.merchantNumber, () => setCopied('number'))}
                        className="border-[1.5px] border-ed-ink bg-white px-2 py-1 font-extrabold text-ed-red transition hover:bg-ed-ink hover:text-ed-paper"
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
                        className="border-[1.5px] border-ed-ink bg-white px-2 py-1 font-mono font-extrabold text-ed-red transition hover:bg-ed-ink hover:text-ed-paper"
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
                    <p className="mt-4 border border-ed-rule bg-white p-3 text-xs font-bold text-ed-muted">
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
