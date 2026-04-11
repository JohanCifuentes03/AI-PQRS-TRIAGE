'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Bandeja', icon: 'inbox' },
  { href: '/analytics', label: 'Analytics', icon: 'bar_chart' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 z-50 bg-[#F8F9FA] border-r border-[#C3C6D0]/15 flex flex-col p-6">
      <div className="mb-8">
        <h1 className="text-xl font-black text-[#191C1D]">Civic Sentinel</h1>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-1">
          Government Administration
        </p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-3 text-sm transition-all ${
              pathname === item.href
                ? 'font-bold text-[#001834] bg-[#F3F4F5] border-r-4 border-[#BB0013]'
                : 'font-medium text-[#43474F] hover:bg-[#F3F4F5]'
            }`}
          >
            <span className="material-symbols-outlined mr-3">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
