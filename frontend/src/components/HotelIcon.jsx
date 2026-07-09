const ICONS = {
  profile: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6" />
    </>
  ),
  room: (
    <>
      <path d="M4 11v8" />
      <path d="M20 11v8" />
      <path d="M4 16h16" />
      <path d="M6 11V7.5A2.5 2.5 0 0 1 8.5 5h7A2.5 2.5 0 0 1 18 7.5V11" />
      <path d="M7 11h10" />
    </>
  ),
  reservations: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
      <path d="m8 15 2 2 5-5" />
    </>
  ),
  services: (
    <>
      <path d="M6 18h12" />
      <path d="M7 18a5 5 0 0 1 10 0" />
      <path d="M12 6v2" />
      <circle cx="12" cy="4" r="1" />
    </>
  ),
  activities: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
      <path d="M8 14h3M13 14h3M8 17h3" />
    </>
  ),
  pass: (
    <>
      <path d="M5 5h14v5a2 2 0 0 0 0 4v5H5v-5a2 2 0 0 0 0-4Z" />
      <path d="M12 8v8" />
    </>
  ),

  qr: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2v2h-2zM18 14h2v3M14 18h3v2M19 19h1v1" />
    </>
  ),
  star: (
    <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9Z" />
  ),
  audit: (
    <><path d="M6 4h12v16H6z" /><path d="M9 8h6M9 12h6M9 16h4" /></>
  ),
  comments: (
    <><path d="M5 5h14v10H9l-4 4Z" /><path d="M8 9h8M8 12h5" /></>
  ),
  menu: (
    <><path d="M4 7h16M4 12h16M4 17h16" /></>
  ),
  close: (
    <><path d="m6 6 12 12M18 6 6 18" /></>
  ),
  logout: (
    <>
      <path d="M10 5H5v14h5" />
      <path d="m14 8 4 4-4 4M18 12H9" />
    </>
  ),
  hotel: (
    <>
      <path d="M5 20V7l7-3 7 3v13" />
      <path d="M9 9h1M14 9h1M9 13h1M14 13h1M11 20v-4h2v4" />
    </>
  ),
};

export default function HotelIcon({ name, size = 20, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name] || ICONS.hotel}
    </svg>
  );
}
