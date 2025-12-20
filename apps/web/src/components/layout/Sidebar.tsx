'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Projects', href: '/projects', icon: '📁' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-500">Mobigen</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center px-4 py-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
            U
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-slate-900 dark:text-white">User</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Free Plan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
