import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'
import { getLocalImageSrc } from '../utils/imageHelper'

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

export default function Cart() {
  const { items, total, updateQty, removeFromCart, clearCart, addToCart } = useCart()
  const { addToast } = useToast()
  const [recommended, setRecommended] = useState([])

  useEffect(() => {
    if (items.length === 0 || recommended.length === 0) {
      api.get('/menu').then(res => {
        const picks = (res.data || []).slice(0, 6)
        setRecommended(picks)
      }).catch(()=>{})
    }
  }, [items.length, recommended.length])

  if (items.length === 0) {
    return (
      <div className="container px-4">
        <div className="mx-auto max-w-2xl mt-10">
          <div className="panel text-center dark:bg-gray-900 border-gray-100 dark:border-gray-800">
            <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-orange-50 dark:bg-orange-950/20 grid place-items-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M6 6h15l-1.5 9h-12L6 6Z" stroke="#f97316" strokeWidth="2" strokeLinejoin="round"/>
                <circle cx="9" cy="20" r="1.5" fill="#f97316"/>
                <circle cx="18" cy="20" r="1.5" fill="#f97316"/>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Your cart is empty</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Looks like you haven’t added anything yet. Discover tasty dishes and start your order.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link to="/" className="bg-orange-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-orange-700 transition">Browse Menu</Link>
              <Link to="/history" className="border-2 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-full font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition">History</Link>
            </div>
          </div>
        </div>
        {recommended.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recommended for you</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((item, i) => {
                const availableNow = isItemAvailableNow(item)
                return (
                  <div
                    key={item._id}
                    className="card flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 ease-out animate-fade-up"
                    style={{ animationDelay: (i * 60) + 'ms' }}
                  >
                      <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm shrink-0 relative bg-gray-50 dark:bg-gray-800">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover absolute inset-0"
                          onError={(e) => { 
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className={`font-medium truncate ${availableNow ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>{item.name}</div>
                        <div className={`${availableNow ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'} font-semibold whitespace-nowrap`}>₹{item.price}</div>
                      </div>
                      <button
                        disabled={!availableNow}
                        className={
                          'mt-2 text-xs sm:text-sm px-4 py-2 rounded-full w-full sm:w-auto shadow-sm transition ' +
                          (availableNow
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed')
                        }
                        onClick={()=>{
                          if (!availableNow) return
                          addToCart({ foodItem: item._id, name: item.name, price: item.price, image: item.image });
                          addToast('success', `${item.name} added to cart`)
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container px-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="min-w-[180px]">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Cart</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Review your selection before you checkout.</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {localStorage.getItem('activeOrderId') && (
            <button
              onClick={() => {
                localStorage.removeItem('activeOrderId');
                localStorage.removeItem('activeOrderNumber');
                addToast('success', 'Session cleared. You can start a new order.');
                // Force re-render if needed, though most likely they'll see it on checkout
                window.location.reload(); 
              }}
              className="text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 px-3 py-1.5 rounded-lg border border-orange-100 dark:border-orange-900/30 text-xs font-bold transition"
            >
              Clear Active Session
            </button>
          )}
          <button
            onClick={() => { clearCart(); addToast('success', 'Cart cleared') }}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 px-4 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 text-xs sm:text-sm font-medium transition"
          >Clear cart</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          {items.map((item, i) => (
            <div
              key={item.foodItem}
              className="card p-4 flex gap-3 sm:gap-4 items-start rounded-2xl bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 ease-out animate-fade-up"
              style={{ animationDelay: (i * 60) + 'ms' }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e)=>{e.currentTarget.style.display='none'}}
                  />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">₹{item.price} each</div>
                  </div>
                  <div className="text-right font-semibold text-sm sm:text-base text-gray-900 dark:text-white whitespace-nowrap">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-3 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                    <button
                      aria-label="Decrease"
                      className="w-8 h-8 grid place-items-center rounded-full border border-gray-200 dark:border-gray-800 text-lg leading-none text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition"
                      onClick={()=>updateQty(item.foodItem, item.quantity-1)}
                    >-</button>
                    <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                    <button
                      aria-label="Increase"
                      className="w-8 h-8 grid place-items-center rounded-full border border-gray-200 dark:border-gray-800 text-lg leading-none text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition"
                      onClick={()=>updateQty(item.foodItem, item.quantity+1)}
                    >+</button>
                  </div>
                  <button
                    className="text-xs sm:text-sm text-red-500 hover:text-red-600 transition font-medium"
                    onClick={()=>{ removeFromCart(item.foodItem); addToast('success', 'Item removed') }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="md:sticky md:top-20 h-fit mt-4 md:mt-0">
          <div className="card p-6 rounded-2xl bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-md">
            <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Order Summary</h2>
            <div className="flex justify-between mb-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Items count</span>
              <span>{items.reduce((s,i)=>s+i.quantity,0)}</span>
            </div>
            <div className="flex justify-between mb-6 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="font-bold text-gray-900 dark:text-white">Total Amount</span>
              <span className="font-bold text-xl text-orange-600 dark:text-orange-400">₹{total}</span>
            </div>
            <Link
              to="/checkout"
              className="block text-center bg-orange-600 text-white rounded-xl py-3.5 text-sm font-bold shadow-lg hover:bg-orange-700 hover:shadow-orange-200 transition"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>

      {recommended.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">You might also like</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((item, i) => {
              const availableNow = isItemAvailableNow(item)
              return (
              <div
                key={item._id}
                className="card flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 ease-out animate-fade-up"
                style={{ animationDelay: (i * 60) + 'ms' }}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover absolute inset-0"
                      onError={(e) => { 
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`font-medium truncate ${availableNow ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>{item.name}</div>
                    <div className={`${availableNow ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'} font-semibold whitespace-nowrap`}>₹{item.price}</div>
                  </div>
                  <button
                    disabled={!availableNow}
                    className={
                      'mt-2 text-xs sm:text-sm px-4 py-2 rounded-full transition ' +
                      (availableNow
                        ? 'border border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-800 cursor-not-allowed')
                    }
                    onClick={()=>{
                      if (!availableNow) return
                      addToCart({ foodItem: item._id, name: item.name, price: item.price, image: item.image });
                      addToast('success', `${item.name} added to cart`)
                    }}
                  >
                    Add to order
                  </button>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}
    </div>
  )
}
