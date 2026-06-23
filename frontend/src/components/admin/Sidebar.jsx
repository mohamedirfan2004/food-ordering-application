import React from 'react'

export default function AdminSidebar({ current, onChange }) {
  const items = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'items', label: 'Items', icon: '🍽️' },
    { key: 'categories', label: 'Categories', icon: '🗂️' },
    { key: 'live-orders', label: 'Live orders', icon: '🔔' },
    { key: 'orders', label: 'Orders', icon: '🧾' },
    { key: 'reports', label: 'Reports', icon: '📈' },
    { key: 'hero', label: 'Hero', icon: '🎨' },
    { key: 'customers', label: 'Customers', icon: '👤' },
    { key: 'footer', label: 'Footer', icon: '⚙️' },
  ]
  return (
    <aside className="w-56 bg-black text-gray-200 rounded-lg p-3 h-full">
      <div className="px-2 py-2 text-sm text-gray-400">Admin</div>
      <nav className="flex flex-col gap-1">
        {items.map(it => (
          <button
            key={it.key}
            className={
              'flex items-center gap-2 text-left px-3 py-2 rounded ' +
              (current === it.key ? 'bg-brand-600 text-white' : 'hover:bg-white/10')
            }
            onClick={() => onChange(it.key)}
          >
            <span className="text-base leading-none">{it.icon}</span>
            <span className="text-sm font-medium">{it.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
