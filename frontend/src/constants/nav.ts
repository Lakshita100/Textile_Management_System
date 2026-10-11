export interface NavItem {
  id: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'features', label: 'Products' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'benefits', label: 'Sustainability' },
  { id: 'dashboard', label: 'Resources' },
  { id: 'contact', label: 'Contact' },
];

export const NAV_IDS: string[] = NAV_ITEMS.map((item) => item.id);
