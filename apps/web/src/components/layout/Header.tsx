'use client';

export function Header() {
  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <input
          type="search"
          placeholder="Search projects..."
          className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-900"
        />
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg relative">
          🔔
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">⚙️</button>
      </div>
    </header>
  );
}
