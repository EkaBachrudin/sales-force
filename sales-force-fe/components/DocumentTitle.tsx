'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pipeline': 'Pipeline',
  '/analytics': 'Analytics',
  '/leads': 'Leads',
  '/properties': 'Properties',
  '/users': 'Users',
  '/subscriptions': 'Subscriptions',
  '/settings': 'Settings',
  '/features': 'Features',
  '/login': 'Login',
};

export function DocumentTitle() {
  const pathname = usePathname();

  useEffect(() => {
    const title = pageTitles[pathname] || 'Sforce';
    document.title = `${title} | Sforce`;
  }, [pathname]);

  return null;
}
