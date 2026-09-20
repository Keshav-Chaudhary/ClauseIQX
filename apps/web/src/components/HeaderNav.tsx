'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const HeaderNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Developer', href: '/developer' },
  ];

  return (
    <nav aria-label="Main navigation">
      <ul className="flex items-center gap-6 m-0 p-0 list-none">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`text-sm font-bold transition-colors pb-1 border-b-2 ${
                  isActive 
                    ? 'text-accent border-accent' 
                    : 'text-fg-muted border-transparent hover:text-fg hover:border-border-strong'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
