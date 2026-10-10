export interface NavItem {
  id: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'features', label: 'Features' },
  { id: 'contact', label: 'Contact' },
];

export const NAV_IDS: string[] = NAV_ITEMS.map((item) => item.id);
