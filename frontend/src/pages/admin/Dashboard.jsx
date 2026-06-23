import React, { useEffect, useState } from 'react'
import Items from './Items'
import Orders from './Orders'
import Reports from './Reports'
import Overview from './Overview'
import Hero from './Hero'
import Categories from './Categories'
import Customers from './Customers'
import AdminFooter from './AdminFooter'
import LiveOrders from './LiveOrders'
import AdminSidebar from '../../components/admin/Sidebar'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import { getLocalImageSrc } from '../../utils/imageHelper'

export default function Dashboard() {
  const [tab, setTab] = useState('orders')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [quickStats, setQuickStats] = useState(null)
  const { adminLogout } = useAuth()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [ordersRes, dailyRes] = await Promise.all([
          api.get('/orders'),
          api.get('/reports/daily').catch(() => null),
        ])
        if (!mounted) return
        const orders = ordersRes.data || []
        const pending = orders.filter(o => o.status === 'pending').length
        const preparing = orders.filter(o => o.status === 'preparing').length
        const completed = orders.filter(o => o.status === 'completed').length
        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

        // Compute a simple "top dish" by quantity across all orders
        const itemMap = {}
        for (const o of orders) {
          ;(o.items || []).forEach(it => {
            if (!it || !it.name) return
            const key = it.name
            if (!itemMap[key]) {
              itemMap[key] = { name: it.name, quantity: 0, image: it.image }
            }
            itemMap[key].quantity += it.quantity || 0
            if (!itemMap[key].image && it.image) itemMap[key].image = it.image
          })
        }
        const topItem = Object.values(itemMap).sort((a, b) => (b.quantity || 0) - (a.quantity || 0))[0] || null

        const dailyData = dailyRes?.data || {}
        setQuickStats({
          pending,
          preparing,
          completed,
          todayOrders: dailyData.orderCount || 0,
          todaySales: dailyData.totalSales || 0,
          totalRevenue,
          topItem,
        })
      } catch (e) {
        if (!mounted) return
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 items-start">
      <div className="hidden lg:block lg:sticky lg:top-4 self-start">
        <AdminSidebar current={tab} onChange={setTab} />
        {quickStats && (
          <div className="mt-4 space-y-4 text-xs">
            {/* Today snapshot */}
            <div className="card p-4 bg-gradient-to-b from-brand-500 via-brand-600 to-brand-700 text-white border-none">
              <div className="text-[11px] uppercase tracking-wide text-white/80">Today snapshot</div>
              <div className="mt-2 text-2xl font-semibold">₹{quickStats.todaySales}</div>
              <div className="text-[12px] text-white/80">{quickStats.todayOrders} orders</div>
              <div className="mt-3 space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-300" />Pending</span>
                  <span className="font-semibold">{quickStats.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-300" />Preparing</span>
                  <span className="font-semibold">{quickStats.preparing}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-300" />Completed</span>
                  <span className="font-semibold">{quickStats.completed}</span>
                </div>
              </div>
            </div>

            {/* Top dish for owner insight */}
            {quickStats.topItem && (
              <div className="card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100">
                  {quickStats.topItem.image && (
                    <img
                      src={getLocalImageSrc(quickStats.topItem.name)}
                      alt={quickStats.topItem.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400">Top dish</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{quickStats.topItem.name}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">{quickStats.topItem.quantity} sold</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Manage your restaurant operations in real-time.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-100 dark:border-gray-700"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1m-16 0H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.071 16.071l.707.707M7.929 7.929l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border border-red-100 dark:border-red-900/30"
              onClick={adminLogout}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout
            </button>
          </div>
        </div>

        {/* Secondary nav for small screens */}
        <div className="lg:hidden mb-3">
          <select value={tab} onChange={e=>setTab(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="overview">Overview</option>
            <option value="items">Items</option>
            <option value="categories">Categories</option>
            <option value="live-orders">Live orders (real-time)</option>
            <option value="orders">Orders</option>
            <option value="reports">Reports</option>
            <option value="hero">Hero</option>
            <option value="customers">Customers</option>
            <option value="footer">Footer</option>
          </select>
        </div>

        {tab === 'overview' && <Overview />}
        {tab === 'items' && <Items />}
        {tab === 'categories' && <Categories />}
        {tab === 'live-orders' && <LiveOrders />}
        {tab === 'orders' && <Orders />}
        {tab === 'reports' && <Reports />}
        {tab === 'hero' && <Hero />}
        {tab === 'customers' && <Customers />}
        {tab === 'footer' && <AdminFooter />}
      </div>
    </div>
  )
}
