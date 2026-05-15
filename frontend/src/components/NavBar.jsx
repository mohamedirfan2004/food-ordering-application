import React, { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { 
  Home, 
  ShoppingCart, 
  Clock, 
  Sun, 
  Moon, 
  MapPin,
  LayoutDashboard
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NavBar() {
  const { items } = useCart()
  const location = useLocation()
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <>
      {/* 1. Mobile Top Header (Sticky) */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md transition-colors duration-500">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Nanban Restaurant
            </span>
            <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              <MapPin size={10} className="text-orange-500" />
              <span>Thuvarancaud, Boothapandi, Nagercoil</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Desktop Nav Items */}
            <nav className="hidden md:flex items-center gap-6 mr-6">
              <NavOption to="/" icon={<Home size={20} />} label="Home" />
              <NavOption to="/cart" icon={<ShoppingCart size={20} />} label="Cart" badge={cartCount} />
              <NavOption to="/history" icon={<Clock size={20} />} label="History" />
              <NavOption to="/admin" icon={<LayoutDashboard size={20} />} label="Admin" />
            </nav>

            {/* Dark Mode Toggle with Micro-interaction */}
            <motion.button
              whileTap={{ scale: 0.9, rotate: 15 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-500"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ y: 10, opacity: 0, rotate: -45 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: -10, opacity: 0, rotate: 45 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-gray-900 dark:text-white" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </header>

      {/* 2. Mobile Bottom Navigation Bar (Fixed) */}
      {!isAdminRoute && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 px-6 pb-6 pt-3 transition-colors duration-500">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <MobileTab to="/" icon={<Home size={24} />} label="Home" />
            <MobileTab to="/cart" icon={<ShoppingCart size={24} />} label="Cart" badge={cartCount} />
            <MobileTab to="/history" icon={<Clock size={24} />} label="History" />
          </div>
        </nav>
      )}
    </>
  )
}

function NavOption({ to, icon, label, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center gap-2 text-sm font-medium transition-all duration-300
        ${isActive 
          ? 'text-orange-600 dark:text-orange-400' 
          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}
      `}
    >
      <span className="relative">
        {icon}
        {badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-950">
            {badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </NavLink>
  )
}

function MobileTab({ to, icon, label, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex flex-col items-center gap-1 transition-all duration-300
        ${isActive 
          ? 'text-orange-600 dark:text-orange-400 scale-110' 
          : 'text-gray-400 dark:text-gray-600'}
      `}
    >
      <div className="relative">
        {icon}
        {badge > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-950"
          >
            {badge}
          </motion.span>
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </NavLink>
  )
}
