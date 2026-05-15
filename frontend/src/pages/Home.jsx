import React, { useEffect, useMemo, useRef, useState } from 'react'
import api from '../lib/api'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'

const isItemAvailableNow = (item) => {
  if (!item) return false

  if (item.isAvailable === false) return false

  if (!item.availabilityType || item.availabilityType === 'always') return true

  const start = item.scheduleStart
  const end = item.scheduleEnd
  if (!start || !end) return false

  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if ([sh, sm, eh, em].some(v => Number.isNaN(v))) return false

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em

  if (startMinutes <= endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes
  }
  return nowMinutes >= startMinutes || nowMinutes < endMinutes
}

export default function Home() {
  const [items, setItems] = useState([])
  const [hero, setHero] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortKey, setSortKey] = useState('relevance')
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const { addToCart, items: cartItems, updateQty, removeFromCart } = useCart()
  const { addToast } = useToast()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [menuRes, heroRes, catRes] = await Promise.all([
          api.get('/menu'),
          api.get('/hero/public').catch(() => null),
          api.get('/categories').catch(() => null),
        ])
        if (!mounted) return
        setItems(menuRes.data)
        if (heroRes) setHero(heroRes.data)
        if (catRes) setCategories(catRes.data)
      } catch (e) {
        if (!mounted) return
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div>
        <div className="rounded-xl overflow-hidden mb-6">
          <div className="h-44 sm:h-56 lg:h-64 w-full bg-gray-200 animate-pulse" />
        </div>
        <div className="h-12 bg-gray-100 rounded-full mb-6 animate-pulse" />
        <h1 className="text-2xl font-semibold mt-6 mb-4">Menu</h1>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-40 w-full bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 w-2/3 rounded" />
                <div className="h-3 bg-gray-200 w-full rounded" />
                <div className="h-9 bg-gray-200 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  let filtered = items.filter(it => {
    const matchesQuery = it.name.toLowerCase().includes(query.toLowerCase()) || 
                        it.description.toLowerCase().includes(query.toLowerCase())
    const availableNow = isItemAvailableNow(it)
    const matchesAvail = !availableOnly || availableNow
    const matchesCategory = activeCategory === 'all' || it.category === activeCategory
    return matchesQuery && matchesAvail && matchesCategory
  })

  if (sortKey === 'price-asc') filtered = [...filtered].sort((a,b)=>a.price-b.price)
  if (sortKey === 'price-desc') filtered = [...filtered].sort((a,b)=>b.price-a.price)

  const heroTitle = hero?.title || 'Nanban Restaurant'
  const heroSubtitle = hero?.subtitle || "Taste Nagercoil's favourites, delivered to you."
  const heroBadge1 = hero?.badge1 || 'Curated South Indian Specials'
  const heroBadge2 = hero?.badge2 || 'Live order tracking'
  const heroBadge3 = hero?.badge3 || 'Dine-in & Takeaway'
  const heroImage = hero?.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop'

  return (
    <div>
      {/* Hero */}
      <div className="rounded-2xl overflow-hidden mb-6 shadow-sm">
        <div className="relative h-48 sm:h-64 lg:h-72 w-full">
          <img
            src={heroImage}
            alt="Hero"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />
          <div className="relative h-full flex items-center px-6 sm:px-10">
            <div className="text-white max-w-xl">
              <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur border border-white/20">
                Fresh • Fast • Local
              </p>
              <div className="mt-3 text-3xl sm:text-4xl font-semibold leading-tight drop-shadow">
                {heroTitle}
                <span className="block text-xl sm:text-2xl font-normal text-orange-200">{heroSubtitle}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs sm:text-sm text-gray-200">
                <span className="badge bg-black/40 text-orange-200 border border-white/10">{heroBadge1}</span>
                <span className="badge bg-black/40 text-gray-300 border border-white/10">{heroBadge2}</span>
                <span className="badge bg-black/40 text-orange-300 border border-white/10">{heroBadge3}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/></svg>
            </span>
            <input
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              placeholder="Search for food"
              className="input pl-9"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded px-3 py-2 shadow-sm">
          <input type="checkbox" checked={availableOnly} onChange={e=>setAvailableOnly(e.target.checked)} className="rounded text-orange-500 focus:ring-orange-500" />
          Available only
        </label>
        <div className="text-sm min-w-[180px]">
          <select
            value={sortKey}
            onChange={e=>setSortKey(e.target.value)}
            className="input"
          >
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar text-xs sm:text-sm">
          <button
            type="button"
            className={
              'px-3 py-1 rounded-full border whitespace-nowrap transition ' +
              (activeCategory === 'all'
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 hover:text-orange-700')
            }
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c.key}
              type="button"
              className={
                'px-3 py-1 rounded-full border whitespace-nowrap transition ' +
                (activeCategory === c.key
                  ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 hover:text-orange-700')
              }
              onClick={() => setActiveCategory(c.key)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}


      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Menu</h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item, i) => {
          const inCart = cartItems.find(ci => ci.foodItem === item._id)
          const qty = inCart?.quantity || 0
          const availableNow = isItemAvailableNow(item)

          return (
            <div
              key={item._id}
              className={
                'card flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl shadow-sm transition-all duration-300 ease-out transform animate-fade-up ' +
                (availableNow
                  ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:shadow-md hover:-translate-y-1 hover:scale-[1.01]'
                  : 'bg-gray-50 dark:bg-gray-950 opacity-70')
              }
              style={{ animationDelay: (i*60)+'ms' }}
            >
              <div className="shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800 shadow-md">
                  <img
                    src={`${import.meta.env.VITE_API_BASE?.replace('/api','') || 'https://nanban-backend.onrender.com'}/uploads/${item.image}`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e)=>{e.currentTarget.style.display='none'}}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-medium text-base sm:text-lg truncate ${availableNow ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>{item.name}</h3>
                  <span className={`${availableNow ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'} font-semibold text-sm sm:text-base whitespace-nowrap`}>₹{item.price}</span>
                </div>
                <p className={`text-xs sm:text-sm mt-1 ${availableNow ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'}`}>{item.description}</p>
                <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                  <span>Category: {item.category}</span>
                  {!availableNow && (
                    <span className="inline-flex items-center rounded-full bg-gray-800 text-white px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      Not available now
                    </span>
                  )}
                  {!availableNow && item.availabilityType === 'scheduled' && (item.scheduleStart || item.scheduleEnd) && (
                    <span className="text-gray-500">
                      Available {item.scheduleStart || '--:--'} – {item.scheduleEnd || '--:--'}
                    </span>
                  )}
                </div>
                {qty === 0 ? (
                  <div className="mt-2 flex justify-end">
                    <button
                      disabled={!availableNow}
                      className={
                        'text-xs sm:text-sm px-4 py-2 rounded-full shadow-sm transition-all duration-200 ' +
                        (availableNow
                          ? 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-orange-200 transform hover:-translate-y-0.5 active:scale-95'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed')
                      }
                      onClick={() => {
                        if (!availableNow) return
                        addToCart({ foodItem: item._id, name: item.name, price: item.price, image: item.image })
                        addToast('success', `${item.name} added to cart`)
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex justify-end">
                    <div className="inline-flex items-center gap-3 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                      <button
                        aria-label="Decrease"
                        className="w-8 h-8 grid place-items-center rounded-full border border-gray-200 dark:border-gray-800 text-lg leading-none text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition"
                        onClick={() => {
                          if (qty <= 1) {
                            removeFromCart(item._id)
                            addToast('success', `${item.name} removed from cart`)
                          } else {
                            updateQty(item._id, qty - 1)
                          }
                        }}
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">{qty}</span>
                      <button
                        aria-label="Increase"
                        className={
                          'w-8 h-8 grid place-items-center rounded-full border text-lg leading-none transition ' +
                          (availableNow
                            ? 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95'
                            : 'border-gray-200 dark:border-gray-800 text-gray-400 cursor-not-allowed bg-gray-50 dark:bg-gray-900')
                        }
                        disabled={!availableNow}
                        onClick={() => {
                          if (!availableNow) return
                          updateQty(item._id, qty + 1)
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-sm text-gray-500 dark:text-gray-400">No items match your search.</div>
        )}
      </div>
      {/* Floating Cart Button */}
      <Link to="/cart" className="fixed bottom-20 right-5 z-40 bg-orange-600 text-white shadow-lg rounded-full w-14 h-14 grid place-items-center hover:bg-orange-700 transition transform hover:scale-105 active:scale-95">
        <div className="relative">
          <ShoppingCart size={24} />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm">
              {cartItems.reduce((s,i)=>s+i.quantity,0)}
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
