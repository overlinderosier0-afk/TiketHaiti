'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Faq from '../components/Faq';
import { api, uploadUrl } from '../lib/api';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  city: { name: string };
  category: string | null;
  eventDate: string;
  price: number;
  bannerUrl: string | null;
}

interface PageResult {
  items: EventItem[];
  total: number;
}

/* ---------- Utilitaires ---------- */

const MONTHS_HT = ['Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen', 'Jiy', 'Out', 'Sep', 'Okt', 'Nov', 'Des'];

function dateBadge(iso: string): { day: number; mon: string } {
  const d = new Date(iso);
  return { day: d.getDate(), mon: MONTHS_HT[d.getMonth()] ?? '' };
}

function shortMeta(e: EventItem): string {
  const d = new Date(e.eventDate);
  return `${e.city?.name ?? ''} · ${d.getDate()} ${MONTHS_HT[d.getMonth()] ?? ''}`.trim();
}

function fmtPrice(p: number): React.ReactNode {
  if (p <= 0) return <>Gratis</>;
  return (
    <>
      {p.toLocaleString('fr-FR')} <small>HTG</small>
    </>
  );
}

const POSTER_GRADIENTS = [
  'linear-gradient(135deg,#2F5BFF,#1E3FAE)',
  'linear-gradient(135deg,#3B82F6,#2F5BFF)',
  'linear-gradient(135deg,#1E3FAE,#0B2B8F)',
  'linear-gradient(135deg,#5B8CFF,#2F5BFF)'
];

function Poster({ e, i, h }: { e: EventItem; i: number; h: string }) {
  const url = uploadUrl(e.bannerUrl);
  if (url) {
    return (
      <div className="poster" style={{ height: h }}>
        <img src={url} alt={e.title} className="h-full w-full object-cover" />
      </div>
    );
  }
  return <div className="poster" style={{ height: h, background: POSTER_GRADIENTS[i % POSTER_GRADIENTS.length] }} />;
}

/* ---------- Hero ---------- */

function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form
      className="searchbar"
      onSubmit={(ev) => {
        ev.preventDefault();
        const term = q.trim();
        router.push(term ? `/events?q=${encodeURIComponent(term)}` : '/events');
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" style={{ flex: 'none', opacity: 0.45 }}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Chèche yon evènman, yon atis, yon vil…"
        aria-label="Chèche yon evènman"
      />
      <button
        type="submit"
        className="rounded-full bg-tike-violet px-7 py-3 font-display text-[0.95rem] font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-tike-pink"
      >
        Chèche
      </button>
    </form>
  );
}

const TICKET_CLASSES = ['t1', 't2', 't3'];

function HeroTickets() {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  useEffect(() => {
    api<PageResult>('/events?limit=3')
      .then((r) => setEvents(r.items))
      .catch(() => setEvents([]));
  }, []);

  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[480px]">
      {(events ?? []).slice(0, 3).map((e, i) => (
        <Link key={e.id} href={`/events/${e.slug || e.id}`} className={`ticket ${TICKET_CLASSES[i]}`}>
          <Poster e={e} i={i} h="120px" />
          <h3 className="line-clamp-1">{e.title}</h3>
          <div className="meta">{shortMeta(e)}</div>
          <div className="row">
            <span className="price">{fmtPrice(e.price)}</span>
            <span className="qr">QR</span>
          </div>
        </Link>
      ))}
      {events !== null && events.length === 0 && (
        <div className="grid h-full place-items-center rounded-[28px] border border-dashed border-tike-violet/25 bg-white/60 p-8 text-center">
          <p className="font-bold text-tike-muted">
            Evènman k ap vini yo ap parèt isit la.
          </p>
        </div>
      )}
      <span className="float-badge fb-1">⚡ MonCash & NatCash</span>
      <span className="float-badge fb-2">✓ Tikè QR ou nan kont ou</span>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden">
      <div aria-hidden className="blob" style={{ width: 480, height: 480, background: '#D7E3FF', top: -140, left: -120 }} />
      <div aria-hidden className="blob" style={{ width: 420, height: 420, background: '#E4EBFF', top: 40, right: -120 }} />
      <div aria-hidden className="blob" style={{ width: 300, height: 300, background: '#DCE7FF', bottom: -120, left: '38%' }} />
      <div className="container relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="kicker">
            <i /> Billetterie 100% ayisyèn
          </span>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.9rem)] font-black leading-[1.06] tracking-tight text-tike-ink">
            Tikè ou,
            <br />
            <span className="tike-grad-text">nan poch ou.</span>
          </h1>
          <p className="mt-5 max-w-[480px] text-[1.12rem] leading-[1.65] text-tike-muted">
            Achte tikè pou pi bèl evènman Ayiti yo. Peye ak <b className="text-tike-ink">MonCash</b> oswa{' '}
            <b className="text-tike-ink">NatCash</b>, jwenn tikè QR ou nan <b className="text-tike-ink">kont ou</b>, antre
            san traka.
          </p>
          <div className="mt-7">
            <SearchBar />
          </div>
          <div className="trust">
            <div><span className="dot">✓</span> Peman sekirize</div>
            <div><span className="dot">✓</span> QR imedyat</div>
            <div><span className="dot">✓</span> San aplikasyon</div>
          </div>
        </div>
        <HeroTickets />
      </div>
    </header>
  );
}

/* ---------- Catégories ---------- */

function CategoryPills() {
  const [cats, setCats] = useState<string[]>([]);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${base}/events/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => Array.isArray(list) && setCats(list))
      .catch(() => {});
  }, []);
  if (cats.length === 0) return null;
  return (
    <div className="container py-6">
      <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
        <Link href="/events" className="cat active">
          <span className="emoji-ic">✦</span> Tout
        </Link>
        {cats.map((c) => (
          <Link key={c} href={`/events?category=${encodeURIComponent(c)}`} className="cat">
            <span className="emoji-ic">✦</span> {c}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- Événements ---------- */

function EventsGrid() {
  const [data, setData] = useState<PageResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<PageResult>('/events?limit=4')
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  return (
    <section className="container py-14">
      <div className="mb-7 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[1.9rem] font-black tracking-tight text-tike-ink">
            Evènman k ap vini
          </h2>
          <p className="mt-1.5 text-tike-muted">Pi bèl sware yo, yon klik lwen.</p>
        </div>
        <Link href="/events" className="font-bold text-tike-violet">
          Wè tout →
        </Link>
      </div>

      {!data && !failed && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-[28px] bg-white p-5 shadow">
              <div className="h-40 rounded-2xl bg-tike-violet/10" />
              <div className="mt-4 h-4 w-3/4 rounded bg-slate-100" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {failed && (
        <p className="rounded-[28px] bg-white p-6 text-center font-bold text-tike-muted shadow">
          Nou pa ka chaje evènman yo pou kounye a.{' '}
          <Link href="/events" className="text-tike-violet">Wè lis konplè a →</Link>
        </p>
      )}

      {data && data.items.length === 0 && (
        <p className="rounded-[28px] bg-white p-6 text-center font-bold text-tike-muted shadow">
          Okenn evènman pibliye pou kounye a. Tounen byento !
        </p>
      )}

      {data && data.items.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.items.map((e, i) => {
            const b = dateBadge(e.eventDate);
            return (
              <article
                key={e.id}
                className="group overflow-hidden rounded-[28px] border border-tike-violet/10 bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] transition hover:-translate-y-1.5 hover:shadow-tike"
              >
                <div className="relative h-[170px] overflow-hidden">
                  {uploadUrl(e.bannerUrl) ? (
                    <img
                      src={uploadUrl(e.bannerUrl)!}
                      alt={e.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full" style={{ background: POSTER_GRADIENTS[i % POSTER_GRADIENTS.length] }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(15,23,42,0.45)]" />
                  <div className="absolute left-3.5 top-3.5 z-[2] rounded-[14px] bg-white/95 px-3 py-1.5 text-center shadow">
                    <b className="block font-display text-[1.05rem] font-black leading-none text-tike-ink">{b.day}</b>
                    <span className="text-[0.68rem] font-bold uppercase tracking-wider text-tike-violet">{b.mon}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-1.5 text-[0.8rem] font-semibold text-tike-muted">
                    {e.city?.name ?? ''}
                  </div>
                  <h3 className="line-clamp-2 font-display text-[1.04rem] font-extrabold leading-snug text-tike-ink">
                    {e.title}
                  </h3>
                  <div className="mt-3.5 flex items-center justify-between border-t-2 border-dashed border-tike-violet/15 pt-3.5">
                    <span className="font-display font-black text-tike-ink">{fmtPrice(e.price)}</span>
                    <Link
                      href={`/events/${e.slug || e.id}`}
                      className="rounded-full bg-tike-violet px-5 py-2 font-display text-[0.85rem] font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-tike-pink"
                    >
                      Achte
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------- Kijan li mache ---------- */

function How() {
  const steps = [
    {
      n: '1',
      title: 'Chwazi evènman ou',
      text: <>Chèche pa vil, pa dat oswa pa kategori. <b className="text-tike-ink">Chwazi plas ou</b> an kèk segonn.</>
    },
    {
      n: '2',
      title: 'Peye fasil',
      text: <><b className="text-tike-ink">MonCash</b> oswa <b className="text-tike-ink">NatCash</b>, dirèkteman sou telefòn ou. San kat labank.</>
    },
    {
      n: '3',
      title: 'Antre ak QR ou',
      text: <>Jwenn tikè QR ou nan <b className="text-tike-ink">kont ou</b> apre peman an konfime. Montre QR la nan pòt la.</>
    }
  ];
  return (
    <div className="container py-5">
      <div
        id="kijan-li-mache"
        className="scroll-mt-24 rounded-[36px] border border-tike-violet/10 bg-white px-6 py-14 shadow-[0_24px_50px_-30px_rgba(47,91,255,0.25)] sm:px-12"
      >
        <h2 className="text-center font-display text-[1.9rem] font-black text-tike-ink">Kijan li mache</h2>
        <p className="mb-10 mt-2 text-center text-tike-muted">Twa etap, epi w ap danse.</p>
        <div className="grid gap-7 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="p-2.5 text-center">
              <div className="mx-auto mb-[18px] grid h-16 w-16 place-items-center rounded-[22px] bg-tike-violet font-display text-[1.4rem] font-black text-white shadow-[0_14px_28px_-14px_rgba(47,91,255,0.6)]">
                {s.n}
              </div>
              <h3 className="mb-2 font-display text-[1.1rem] font-extrabold text-tike-ink">{s.title}</h3>
              <p className="text-[0.94rem] leading-[1.6] text-tike-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Organisateurs ---------- */

function Organizer() {
  return (
    <div className="container py-5">
      <div
        id="organizateur"
        className="relative scroll-mt-24 overflow-hidden rounded-[36px] bg-gradient-to-br from-tike-violet to-tike-pink p-10 text-white sm:p-14"
      >
        <div aria-hidden className="absolute -right-[100px] -top-[160px] h-[420px] w-[420px] rounded-full bg-white/15" />
        <div aria-hidden className="absolute -bottom-[120px] left-[20%] h-[260px] w-[260px] rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div>
            <span className="mb-[18px] inline-block rounded-full bg-white/20 px-[18px] py-2 text-[0.85rem] font-extrabold">
              Komisyon 3% sèlman
            </span>
            <h2 className="mb-2.5 font-display text-[2rem] font-black tracking-tight">Ou òganize evènman ?</h2>
            <p className="max-w-[520px] leading-[1.6] text-white/90">
              Kreye evènman ou gratis, vann tikè anliy, swiv lavant ou an dirèk epi resevwa lajan ou sou MonCash oswa
              NatCash.
            </p>
          </div>
          <Link
            href="/register"
            className="rounded-full bg-white px-8 py-4 font-display text-[1rem] font-extrabold text-tike-ink shadow-lg transition hover:-translate-y-0.5"
          >
            Kreye evènman gratis
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryPills />
      <EventsGrid />
      <How />
      <Faq />
      <div className="pb-14">
        <Organizer />
      </div>
    </>
  );
}
