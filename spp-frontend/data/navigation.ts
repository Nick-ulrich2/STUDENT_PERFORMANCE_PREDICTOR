// Marketing anchors, only meaningful on the homepage (app/page.tsx renders the
// sections these ids point to). Prefixed with "/" rather than bare "#..." so
// they resolve correctly from any route (e.g. /login, /register) instead of
// silently doing nothing when the current page has no matching id.
export const navigation = [
  { label: 'Produit', href: '/#product' },
  { label: 'Comment ça marche', href: '/#how-it-works' },
  { label: 'Confidentialité', href: '/#privacy' },
  { label: 'À propos', href: '/#audience' },
];
