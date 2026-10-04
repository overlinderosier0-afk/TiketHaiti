export default function DevWarningBanner() {
  return (
    <div
      role="alert"
      className="border-b-2 border-ed-ink bg-ed-red px-4 py-3 text-center text-sm font-extrabold uppercase tracking-widest text-white"
    >
      <p className="container">
        Site en d&eacute;veloppement&nbsp;: Tik&egrave; Ayiti est encore en
        phase de test. Merci de ne d&eacute;poser aucun argent pour le moment.
      </p>
    </div>
  );
}
