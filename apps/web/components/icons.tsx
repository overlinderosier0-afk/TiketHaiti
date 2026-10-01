/* Icônes outline (style cartes pamevent.com) — stroke="currentColor",
   elles héritent de la couleur du texte parent. */

type IconProps = {
  className?: string;
  size?: number;
};

function base({ className = '', size = 20 }: IconProps) {
  return {
    className,
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true
  };
}

/** Date d'événement — « 16 Oct » */
export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M8 2.5v4M16 2.5v4M3 10h18" />
    </svg>
  );
}

/** Durée — « 3h 15m » */
export function HourglassIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3h12M6 21h12" />
      <path d="M7.5 3v5.4L12 12.5l4.5-4.1V3" />
      <path d="M7.5 21v-5.4L12 11.5l4.5 4.1V21" />
    </svg>
  );
}

/** Heure — « 08:00 PM » */
export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

/** Lieu — « Le Domaine » */
export function PinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21.5s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
      <circle cx="12" cy="10.5" r="2.6" />
    </svg>
  );
}

/** Sauvegarder / favori — coin de l'affiche */
export function BookmarkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Discussion — bouton « Chat » */
export function ChatIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1L3 20l1.1-4.3A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}
