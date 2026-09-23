'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

interface OrderItem {
  id: string;
  totalAmount: number;
  quantity: number;
  paymentStatus: string;
  createdAt: string;
  event: { title: string; eventDate: string };
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    api<OrderItem[]>('/orders/my')
      .then(setOrders)
      .catch((e: any) => setError(e?.message || 'Chargement impossible'));
  }, [loading, user]);

  if (!loading && !user) {
    return (
      <section className="container py-14">
        <h1 className="text-4xl font-black">Mon profil</h1>
        <p className="mt-4 text-slate-600">Connectez-vous pour voir votre profil.</p>
        <Link href="/login?next=/profile" className="mt-4 inline-block rounded-full bg-brand px-6 py-3 font-black text-white">Se connecter</Link>
      </section>
    );
  }

  return (
    <section className="container py-14">
      <h1 className="text-4xl font-black">Mon profil</h1>

      {user && (
        <div className="mt-8 rounded-3xl bg-white p-7 shadow">
          <p className="text-sm text-slate-500">Compte connecté</p>
          <h2 className="mt-2 text-2xl font-bold">{user.firstName} {user.lastName}</h2>
          <p className="mt-1 text-slate-600">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
        </div>
      )}

      <h2 className="mt-10 text-2xl font-black">Mes commandes</h2>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}
      {orders.length === 0 && !error && (
        <p className="mt-4 text-slate-500">Aucune commande pour le moment.</p>
      )}
      <div className="mt-4 space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between rounded-2xl border border-amber-100 bg-white p-4">
            <div>
              <p className="font-bold">{o.event.title}</p>
              <p className="text-sm text-slate-500">
                {new Date(o.event.eventDate).toLocaleDateString('fr-FR')} · {o.quantity} billet(s) · {o.totalAmount.toLocaleString('fr-FR')} HTG
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${
              o.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
              o.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {o.paymentStatus}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
