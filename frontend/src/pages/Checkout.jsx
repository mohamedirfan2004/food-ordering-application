import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const [form, setForm] = useState({ customerName: '', phone: '', table: '', specialInstructions: '' })
  const [lockedTable, setLockedTable] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeOrderId, setActiveOrderId] = useState(null)
  const [activeOrderNumber, setActiveOrderNumber] = useState(null)
  const navigate = useNavigate()
  const { addToast } = useToast()

  useEffect(() => {
    // 1. Check State: On component mount, check if activeOrderId exists in localStorage
    const storedOrderId = localStorage.getItem('activeOrderId')
    const storedOrderNumber = localStorage.getItem('activeOrderNumber')
    
    if (storedOrderId) {
      setActiveOrderId(storedOrderId)
      if (storedOrderNumber) {
        setActiveOrderNumber(storedOrderNumber)
      }
    }

    // Pre-fill table from localStorage if user arrived via QR
    try {
      const storedTable = localStorage.getItem('currentTableId')
      if (storedTable) {
        setForm(prev => ({ ...prev, table: storedTable }))
        setLockedTable(true)
      }
    } catch (err) {
      console.error('LocalStorage error:', err)
    }
  }, [])

  // Validation logic
  const isFormValid = () => {
    if (activeOrderId) return true // No validation needed for existing order updates
    return (
      form.customerName.trim().length > 0 &&
      /^\+?[0-9\s-]{7,15}$/.test(form.phone.trim()) &&
      form.table !== ''
    )
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (items.length === 0) {
      setError('Your cart is empty')
      return
    }

    if (!isFormValid()) {
      setError('Please fill in all required fields correctly')
      return
    }

    setLoading(true)
    try {
      let res;
      if (activeOrderId) {
        // 3. Continue Order UI: PUT request to append new cart items
        const payload = {
          items: items.map(i => ({ foodItem: i.foodItem, quantity: i.quantity })),
          specialInstructions: form.specialInstructions
        }
        res = await api.put(`/orders/${activeOrderId}/merge`, payload)
      } else {
        // 2. First-Time Order UI: POST to create a new order
        const payload = {
          customerName: form.customerName,
          phone: form.phone,
          table: form.table,
          items: items.map(i => ({ foodItem: i.foodItem, quantity: i.quantity })),
          totalAmount: total,
          specialInstructions: form.specialInstructions
        }
        res = await api.post('/orders', payload)
      }

      const orderData = res.data
      if (orderData?._id) {
        localStorage.setItem('activeOrderId', orderData._id)
        setActiveOrderId(orderData._id)
        
        if (orderData.orderNumber) {
          localStorage.setItem('activeOrderNumber', orderData.orderNumber)
          setActiveOrderNumber(orderData.orderNumber)
        }
      }

      setSuccess(`Order ${activeOrderId ? 'updated' : 'placed'} successfully! Order #${orderData.orderNumber}`)
      addToast('success', `Order ${activeOrderId ? 'updated' : 'placed'}! #${orderData.orderNumber}`)
      clearCart()
      setForm(prev => ({ ...prev, specialInstructions: '' }))
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to process order'
      setError(msg)
      addToast('error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto w-full px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {activeOrderId 
            ? 'Add more delicious items to your active session.' 
            : 'Complete your details to start your dining experience.'}
        </p>
      </div>

      {activeOrderId && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => {
              localStorage.removeItem('activeOrderId')
              localStorage.removeItem('activeOrderNumber')
              setActiveOrderId(null)
              setActiveOrderNumber(null)
              setForm({ customerName: '', phone: '', table: '', specialInstructions: '' })
              addToast('success', 'Session cleared. You can start a new order.')
            }}
            className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 transition-colors"
          >
            Clear Active Session
          </button>
        </div>
      )}

      {activeOrderId && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-orange-600 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider">Active Session</p>
            <h2 className="text-orange-900 dark:text-orange-100 font-bold text-lg">Currently adding to Order #{activeOrderNumber || activeOrderId.slice(-5)}</h2>
          </div>
          <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            {/* 2. First-Time Order UI: Display input fields ONLY if NO activeOrderId */}
            {!activeOrderId && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Customer Name</label>
                  <input 
                    type="text"
                    placeholder="Enter your name" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition" 
                    value={form.customerName} 
                    onChange={e => setForm({...form, customerName: e.target.value})} 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Table Number</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition appearance-none"
                    value={form.table}
                    onChange={e => setForm({...form, table: e.target.value})}
                    required
                    disabled={lockedTable}
                  >
                    <option value="">Select table</option>
                    <option value="Table AC 1">Table AC 1</option>
                    <option value="Table AC 2">Table AC 2</option>
                    <option value="Table 1">Table 1</option>
                    <option value="Table 2">Table 2</option>
                  </select>
                  {lockedTable && (
                    <p className="mt-1.5 text-xs text-orange-500 font-medium px-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM7 7a3 3 0 016 0v2H7V7z"></path></svg>
                      Table locked from QR scan
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Special Instructions</label>
              <textarea 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none" 
                rows={2} 
                placeholder="Any special requests? (e.g. less spicy)"
                value={form.specialInstructions} 
                onChange={e => setForm({...form, specialInstructions: e.target.value})} 
              />
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Cart Total ({items.length} items)</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{total}</span>
              </div>
              
              <button 
                type="submit"
                disabled={loading || !isFormValid()} 
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transform transition active:scale-[0.98] ${
                  loading || !isFormValid() 
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none' 
                    : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-orange-200'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  activeOrderId ? 'Update Order' : 'Place Order'
                )}
              </button>
            </div>

            {success && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  onClick={() => navigate('/')}
                >
                  Continue Browsing
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-black dark:hover:gray-100 transition shadow-md"
                  onClick={() => {
                    localStorage.removeItem('activeOrderId')
                    localStorage.removeItem('activeOrderNumber')
                    setActiveOrderId(null)
                    setActiveOrderNumber(null)
                    navigate('/history')
                  }}
                >
                  View Bill & Exit
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
