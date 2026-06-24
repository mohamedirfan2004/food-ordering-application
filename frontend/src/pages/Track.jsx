import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../lib/api'
import { getLocalImageSrc } from '../utils/imageHelper'

const statusBadge = (status) => {
  const base = 'badge'
  if (status === 'pending') return `${base} bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400`
  if (status === 'preparing') return `${base} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400`
  if (status === 'completed') return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400`
  return `${base} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400`
}

const stepIndex = (status) => ({ pending: 1, preparing: 2, completed: 3 }[status] || 1)

function ProgressSteps({ status }) {
  const current = stepIndex(status)
  const steps = [
    { id: 1, label: 'Pending' },
    { id: 2, label: 'Preparing' },
    { id: 3, label: 'Completed' },
  ]
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        {steps.map(s => (
          <div key={s.id} className="flex-1 flex items-center">
            <div className={"h-2 w-full rounded-full " + (s.id < current ? 'bg-orange-600' : s.id === current ? 'bg-orange-400' : 'bg-gray-200 dark:bg-gray-800')}></div>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 text-xs">
        {steps.map(s => (
          <div key={s.id} className={"text-center font-medium " + (s.id === current ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500')}>{s.label}</div>
        ))}
      </div>
    </div>
  )
}

export default function Track() {
  const [phone, setPhone] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lastQueryRef = useRef(null)
  const [copiedId, setCopiedId] = useState(null)
  const location = useLocation()

  const runQuery = async (paramsObj) => {
    setLoading(true)
    try {
      const params = new URLSearchParams(paramsObj)
      const res = await api.get(`/orders/track?${params.toString()}`)
      setOrders(res.data)
    } catch (e) {
      setError('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const search = async (e) => {
    e?.preventDefault?.()
    setError('')
    setOrders([])
    if (!phone && !orderNumber) { setError('Enter phone or order number'); return }
    const q = {}
    if (phone) q.phone = phone
    if (orderNumber) q.orderNumber = orderNumber
    lastQueryRef.current = q
    await runQuery(q)
  }

  // If navigated from Checkout with an orderNumber/phone, prefill and search once
  useEffect(() => {
    const state = location.state || {}
    const initialOrder = state.orderNumber
    const initialPhone = state.phone
    if (!initialOrder && !initialPhone) return

    if (initialOrder) setOrderNumber(initialOrder)
    if (initialPhone) setPhone(initialPhone)

    const q = {}
    if (initialPhone) q.phone = initialPhone
    if (initialOrder) q.orderNumber = initialOrder

    lastQueryRef.current = q
    runQuery(q)
  }, [location.state])

  // Auto-refresh every 6s when a query is present
  useEffect(() => {
    const id = setInterval(() => {
      if (lastQueryRef.current) runQuery(lastQueryRef.current)
    }, 6000)
    return () => clearInterval(id)
  }, [])

  const headerSubtitle = useMemo(() => {
    if (orderNumber) return `Viewing History: ${orderNumber}`
    if (phone) return `Order history for ${phone}`
    return 'Enter phone or order number'
  }, [phone, orderNumber])

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order History</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">{headerSubtitle}</p>
      </div>

      <form onSubmit={search} className="panel bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 grid sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
          <input className="input" placeholder="e.g. 9876543210" value={phone} onChange={e=>setPhone(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Order Number</label>
          <input className="input" placeholder="e.g. ORD-12345" value={orderNumber} onChange={e=>setOrderNumber(e.target.value)} />
        </div>
        <div className="sm:col-span-2 flex gap-2 pt-2">
          <button className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-700 transition shadow-md flex-1 sm:flex-none disabled:opacity-50" disabled={loading}>
            {loading ? 'Searching…' : 'Search Status'}
          </button>
          {lastQueryRef.current && (
            <button
              type="button"
              className="border-2 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              onClick={()=>runQuery(lastQueryRef.current)}
            >
              Refresh
            </button>
          )}
        </div>
      </form>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/30">{error}</div>}

      <div className="space-y-6">
        {orders.map((o, i) => (
          <div key={o._id} className="card p-5 sm:p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition duration-300 ease-out animate-fade-up shadow-md" style={{ animationDelay: (i*60)+'ms' }}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="font-bold text-lg text-gray-900 dark:text-white">Order #{o.orderNumber}</div>
                <span className={statusBadge(o.status)}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <button
                  className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
                  onClick={() => { navigator.clipboard.writeText(o.orderNumber); setCopiedId(o._id); setTimeout(()=>setCopiedId(null), 1200) }}
                >{copiedId === o._id ? 'Copied!' : 'Copy ID'}</button>
                <span className="hidden sm:inline">•</span>
                <span>{new Date(o.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Animated progress bar */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-950/50 rounded-2xl">
              {(() => {
                const current = stepIndex(o.status)
                const percent = current === 1 ? 15 : current === 2 ? 60 : 100
                return (
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-orange-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(234,88,12,0.4)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )
              })()}
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                {['Pending','Preparing','Completed'].map((label, idx) => {
                  const sIdx = stepIndex(o.status)
                  const active = idx+1 <= sIdx
                  return (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <span className={(active? 'bg-orange-600 ring-4 ring-orange-100 dark:ring-orange-900/30':'bg-gray-300 dark:bg-gray-700') + ' w-2.5 h-2.5 rounded-full transition-all duration-500'} />
                      <span className={active? 'text-orange-600 dark:text-orange-400':'text-gray-400 dark:text-gray-600'}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 border-y border-gray-50 dark:border-gray-800 py-4">
              {Object.values(o.items.reduce((acc, it) => {
                const key = it.foodItem || it.name;
                if (!acc[key]) acc[key] = { ...it };
                else acc[key].quantity += it.quantity;
                return acc;
              }, {})).map((it, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={getLocalImageSrc(it.name)} alt={it.name} className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display='none'}} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{it.name}</div>
                    <div className="text-xs text-gray-500">Qty: {it.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">₹{(it.price * it.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Customer</div>
                <div className="font-semibold text-gray-900 dark:text-gray-200">{o.customerName}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Phone</div>
                <div className="font-semibold text-gray-900 dark:text-gray-200">{o.phone}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Table</div>
                <div className="font-semibold text-gray-900 dark:text-gray-200">{o.table || 'N/A'}</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400 italic">Order status updates automatically every 6s.</div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Grand Total</span>
                <span className="text-xl font-black text-orange-600 dark:text-orange-400">₹{Number(o.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
        {!loading && orders.length === 0 && lastQueryRef.current && (
          <div className="text-center py-12 panel bg-gray-50/50 dark:bg-gray-950/30">
            <p className="text-gray-500 dark:text-gray-400">No active orders found for this search. Try again.</p>
          </div>
        )}
      </div>
    </div>
  )
}
