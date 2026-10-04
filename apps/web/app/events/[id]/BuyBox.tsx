'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { ErrorBox, PrimaryButton, StatusPill, inputCls } from '../../../components/ui';

interface BuyBoxProps {
  eventId: string;
  slug: string;
  price: number;
  ticketsAvailable: number;
  disabled: boolean;
  disabledReason?: string;
}

export default function BuyBox({
  eventId,
  slug,
  price,
  ticketsAvailable,
  disabled,
  disabledReason
}: BuyBoxProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function buy() {
    if (!user) {
      router.push(`/login?next=/events/${slug}`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await api<{ orderId: string; free?: boolean }>('/orders', {
        method: 'POST',
        body: JSON.stringify({ eventId, quantity: qty })
      });
      // Événement gratuit : les billets sont déjà émis, direction mes billets.
      router.push(res.free ? '/tickets' : `/checkout?order=${res.orderId}`);
    } catch (e: any) {
      setError(e?.message || 'Commande impossible');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mt-10 border-2 border-ed-ink bg-white p-7 md:flex md:items-center md:justify-between">
        <div>
          <p className="ed-kicker">
            {price > 0 ? 'Entrée générale' : 'Entrée gratuite'}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-ed-ink">
            {price > 0 ? `${price.toLocaleString('fr-FR')} HTG` : 'Gratuit'}
          </p>
          <p className="mt-1 text-sm font-bold text-ed-muted">Billet numérique · QR sécurisé</p>
          <div className="mt-2">
            {disabled ? (
              <StatusPill tone="red">{disabledReason ?? 'Indisponible'}</StatusPill>
            ) : ticketsAvailable > 0 ? (
              <StatusPill tone="green">{ticketsAvailable} billets restants</StatusPill>
            ) : (
              <StatusPill tone="red">Événement complet</StatusPill>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-0">
          <label className="text-sm font-extrabold uppercase tracking-widest text-ed-ink">
            Qté
            <input
              type="number"
              min={1}
              max={Math.min(10, ticketsAvailable)}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={disabled}
              className={`${inputCls} ml-2 !mt-0 w-20 text-center`}
            />
          </label>
          <PrimaryButton
            onClick={buy}
            disabled={busy || disabled || ticketsAvailable <= 0}
            className="w-full sm:w-auto"
          >
            {busy ? '…' : price > 0 ? 'Prendre mes billets →' : 'Obtenir mes billets gratuits →'}
          </PrimaryButton>
        </div>
      </div>
      {error && (
        <div className="mt-4 max-w-xl">
          <ErrorBox>{error}</ErrorBox>
        </div>
      )}
    </>
  );
}
