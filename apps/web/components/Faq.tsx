// FAQ statique — contenu 100 % statique (rendu côté serveur dans le HTML initial)
// + JSON-LD FAQPage : format Q/R que les moteurs IA citent facilement (GEO).

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Kijan pou m achte yon tikè sou Tikè Ayiti ?',
    a: 'Kreye yon kont gratis (oswa konekte), chwazi evènman ou an, klike sou « Achte », peye ak MonCash oswa NatCash, epi tikè QR ou ap parèt nan « Tikè mwen ».'
  },
  {
    q: 'Kijan peman MonCash oswa NatCash la fèt ?',
    a: 'Se yon peman manyèl : apre ou fin fè kòmand lan, voye montan an sou nimewo machann lan epi mete referans kòmand ou a (TH-XXXXXX) kòm motif. Yon administratè konfime peman an, epi tikè ou yo debloke.'
  },
  {
    q: 'Kilè mwen resevwa tikè mwen yo ?',
    a: 'Pou evènman gratis : imedyatman apre kòmand lan. Pou evènman peye : depi administratè a konfime peman ou an. Tikè yo rete disponib nan kont ou, nan « Tikè mwen », ak yon kòd QR pou chak tikè.'
  },
  {
    q: 'Èske m bezwen yon aplikasyon ?',
    a: 'Non. Tikè Ayiti mache dirèkteman nan navigatè telefòn ou. Pa bezwen telechaje anyen.'
  },
  {
    q: 'Konbyen tikè gratis mwen ka pran ?',
    a: 'Ou ka pran jiska 4 tikè gratis pa evènman. Se yon mezi kont abi.'
  },
  {
    q: 'Èske m ka anile yon kòmand ?',
    a: 'Wi. Si kòmand ou an poko peye (oswa li gratis), ou ka anile li depi nan kont ou. Plas yo ap libere otomatikman.'
  },
  {
    q: 'Kijan antre nan evènman an fèt ?',
    a: 'Montre kòd QR tikè ou a nan pòt la. Chak QR ka itilize yon sèl fwa sèlman.'
  }
];

export default function Faq() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };

  return (
    <section className="container py-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="rounded-[36px] border border-tike-violet/10 bg-white px-6 py-14 shadow-[0_24px_50px_-30px_rgba(47,91,255,0.25)] sm:px-12">
        <h2 className="text-center font-display text-[1.9rem] font-black text-tike-ink">
          Kesyon yo poze souvan
        </h2>
        <p className="mb-10 mt-2 text-center text-tike-muted">
          Tout sa ou bezwen konnen anvan ou achte.
        </p>
        <div className="mx-auto grid max-w-[860px] gap-4">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-[22px] border border-tike-violet/10 bg-tike-violet/[0.03] px-6 py-4 open:bg-white open:shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)]"
            >
              <summary className="cursor-pointer list-none font-display text-[1.02rem] font-extrabold text-tike-ink marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="mr-3 inline-block transition group-open:rotate-90">›</span>
                {f.q}
              </summary>
              <p className="mt-3 pl-6 text-[0.95rem] leading-[1.65] text-tike-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
