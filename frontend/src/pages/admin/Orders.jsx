import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'

const STATUS = ['pending', 'preparing', 'completed']
const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
}
const LIVE_STATUSES = ['pending', 'preparing']
const HISTORY_STATUSES = ['completed', 'cancelled']

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [view, setView] = useState('live')
  const [error, setError] = useState('')
  const [adminProfile, setAdminProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const { addToast } = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const historyPromptedRef = useRef(new Set())

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/orders')
      setOrders(res.data)
    } catch (e) {
      setError('Failed to load orders')
      addToast('error', 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.get('/auth/profile')
        if (!mounted) return
        setAdminProfile(res.data)
      } catch (e) {
        // profile is optional; ignore error
      } finally {
        if (mounted) setProfileLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const advanceStatus = async (order) => {
    const idx = STATUS.indexOf(order.status)
    if (idx === -1 || idx === STATUS.length - 1) return
    const next = STATUS[idx+1]
    const ok = await confirm({ title: 'Update status?', message: `Change order #${order.orderNumber} to ${next}?` })
    if (!ok) return
    try {
      await api.put(`/orders/${order._id}/status`, { status: next })
      addToast('success', `Status updated to ${next}`)
      await load()
    } catch (e) {
      setError('Failed to update status')
      addToast('error', 'Failed to update status')
    }
  }

  const completeOrder = async (order) => {
    const ok = await confirm({ title: 'Complete order?', message: `Mark order #${order.orderNumber} as completed?` })
    if (!ok) return
    try {
      await api.put(`/orders/${order._id}/status`, { status: 'completed' })
      addToast('success', 'Order marked as completed')
      await load()
    } catch (e) {
      setError('Failed to complete order')
      addToast('error', 'Failed to complete order')
    }
  }

  const handleSavePrintSettings = async () => {
    setSavingSettings(true)
    try {
      await api.put('/auth/print-settings', {
        canPrint: adminProfile.canPrint,
        defaultFormat: adminProfile.printSettings?.defaultFormat,
        footerText: adminProfile.printSettings?.footerText,
      })
      addToast('success', 'Print settings saved')
    } catch (e) {
      setError('Failed to save print settings')
      addToast('error', 'Failed to save print settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const canPrint = adminProfile ? (adminProfile.canPrint !== false) : true

  const isLiveOrder = (o) => {
    if (o.status === 'cancelled') return false
    if (o.status === 'completed') {
      return !o.movedToHistoryAt
    }
    return LIVE_STATUSES.includes(o.status)
  }

  const isHistoryOrder = (o) => {
    if (o.status === 'cancelled') return true
    if (o.status === 'completed') {
      return !!o.movedToHistoryAt
    }
    return false
  }

  const filteredOrders = orders
    .filter(o => (view === 'live' ? isLiveOrder(o) : isHistoryOrder(o)))
    .filter(o => !filter || o.status === filter)


  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Orders</h2>
          <p className="text-xs text-gray-500">Monitor live orders and update their status in real time.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex items-center bg-white border rounded-full shadow-sm text-xs overflow-hidden">
            <button
              className={(view==='live' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50') + ' px-3 py-1 border-r border-gray-200'}
              onClick={() => { setView('live'); setFilter('') }}
            >Live orders</button>
            <button
              className={(view==='history' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50') + ' px-3 py-1'}
              onClick={() => { setView('history'); setFilter('') }}
            >Order history</button>
          </div>
          <div className="inline-flex items-center bg-white border rounded-full shadow-sm text-xs overflow-hidden">
            <button
              className={(filter==='' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50') + ' px-3 py-1 border-r border-gray-200'}
              onClick={()=>setFilter('')}
            >All</button>
            {view === 'live' && (
              <>
                <button
                  className={(filter==='pending' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50') + ' px-3 py-1 border-r border-gray-200'}
                  onClick={()=>setFilter('pending')}
                >Pending</button>
                <button
                  className={(filter==='preparing' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50') + ' px-3 py-1'}
                  onClick={()=>setFilter('preparing')}
                >Preparing</button>
              </>
            )}
            {view === 'history' && (
              <button
                className={(filter==='completed' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50') + ' px-3 py-1'}
                onClick={()=>setFilter('completed')}
              >Completed</button>
            )}
          </div>
        </div>
      </div>
      {view === 'live' && !profileLoading && adminProfile && (
        <div className="mb-4 card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div>
            <div className="font-medium">Print settings</div>
            <div className="text-[11px] text-gray-500">Control default print format and footer text for slips.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                className="rounded"
                checked={adminProfile.canPrint !== false}
                onChange={e => setAdminProfile(prev => ({ ...(prev || {}), canPrint: e.target.checked }))}
              />
              <span>Allow printing</span>
            </label>
            <select
              className="border rounded px-2 py-1 text-xs"
              value={adminProfile.printSettings?.defaultFormat || 'both'}
              onChange={e => setAdminProfile(prev => ({
                ...(prev || {}),
                printSettings: { ...(prev?.printSettings || {}), defaultFormat: e.target.value }
              }))}
            >
              <option value="kot">KOT</option>
              <option value="bill">Bill</option>
              <option value="both">Both</option>
            </select>
            <input
              className="input text-xs min-w-[180px]"
              placeholder="Footer text"
              value={adminProfile.printSettings?.footerText || ''}
              onChange={e => setAdminProfile(prev => ({
                ...(prev || {}),
                printSettings: { ...(prev?.printSettings || {}), footerText: e.target.value }
              }))}
            />
            <button
              type="button"
              className="btn-primary px-3 py-1 h-8 text-xs"
              onClick={handleSavePrintSettings}
              disabled={savingSettings}
            >
              {savingSettings ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
      {loading ? 'Loading…' : (
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-sm text-gray-500">No orders in this view.</div>
          ) : (
            filteredOrders.map((o, i) => {
              const itemCount = o.items.reduce((s, it) => s + (it.quantity || 0), 0)
              const firstItems = o.items.slice(0, 2)
              const remaining = itemCount - firstItems.reduce((s, it) => s + (it.quantity || 0), 0)

              if (view === 'history') {
                const printedLabel = o.printedAt ? 'Printed' : 'Saved without print'
                const printedClass = o.printedAt
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-gray-100 text-gray-700'

                return (
                  <div
                    key={o._id}
                    className="card p-4 animate-fade-up"
                    style={{ animationDelay: (i * 60) + 'ms' }}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base">Order #{o.orderNumber}</h3>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                          Table&nbsp;<span className="font-semibold">{o.table || 'N/A'}</span>
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-700'}`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 text-right whitespace-nowrap">
                        <div>{new Date(o.createdAt).toLocaleDateString()}</div>
                        <div>{new Date(o.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>

                    <div className="mt-1 text-sm text-gray-700">
                      {(o.customerName || 'Guest')} • {o.phone}
                    </div>
                    {o.address && <div className="text-xs text-gray-500 mt-0.5">{o.address}</div>}

                    <div className="mt-3 text-xs text-gray-600">
                      <span className="font-medium">Items:</span>{' '}
                      {firstItems.map((it, idx) => (
                        <span key={idx}>
                          {idx > 0 && ', '}
                          {it.name} × {it.quantity}
                          {it.isNewItem && <span className="text-[10px] ml-1 text-red-600 font-bold">(New)</span>}
                        </span>
                      ))}
                      {remaining > 0 && (
                        <span className="text-gray-500"> and {remaining} more</span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm">
                      <div className="flex flex-col gap-1 text-[11px] text-gray-500">
                        <span>Items: {itemCount}</span>
                        {o.movedToHistoryAt && (
                          <span>
                            Saved: {new Date(o.movedToHistoryAt).toLocaleDateString()} {new Date(o.movedToHistoryAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="font-semibold text-brand-700 text-sm sm:text-base">Total: ₹{o.totalAmount}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${printedClass}`}>
                          {printedLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }

              // Live orders layout (unchanged)
              return (
                <div
                  key={o._id}
                  className="card p-4 animate-fade-up"
                  style={{ animationDelay: (i * 60) + 'ms' }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-sm sm:text-base">Order #{o.orderNumber}</h3>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                        Table&nbsp;<span className="font-semibold">{o.table || 'N/A'}</span>
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-700'}`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 text-right whitespace-nowrap">
                      <div>{new Date(o.createdAt).toLocaleDateString()}</div>
                      <div>{new Date(o.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>

                  {/* Customer line */}
                  <div className="mt-1 text-sm text-gray-700">
                    {(o.customerName || 'Guest')} • {o.phone}
                  </div>
                  {o.address && <div className="text-xs text-gray-500 mt-0.5">{o.address}</div>}

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                      <span>Order progress</span>
                      <span className="font-medium text-gray-700 capitalize">{o.status}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-700"
                        style={{ width: o.status === 'completed' ? '100%' : o.status === 'preparing' ? '60%' : '30%' }}
                      />
                    </div>
                  </div>

                  {/* Items grid */}
                  <div className="mt-3 grid sm:grid-cols-2 gap-2">
                    {o.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <img
                          src={`${import.meta.env.VITE_API_BASE?.replace('/api','') || 'http://localhost:5000'}/uploads/${it.image}`}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e)=>{e.currentTarget.style.display='none'}}
                        />
                        <div className="text-sm flex-1">
                          {it.name} × {it.quantity}
                          {it.isNewItem && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="text-sm">₹{it.price * it.quantity}</div>
                      </div>
                    ))}
                  </div>

                  {/* Footer row */}
                  <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm">
                    <div className="text-gray-600">Special: {o.specialInstructions || '—'}</div>
                    <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                      <div className="text-[11px] text-gray-500">
                        Items: {itemCount}
                      </div>
                      <div className="font-semibold text-brand-700 text-sm sm:text-base">Total: ₹{o.totalAmount}</div>
                      {o.items.some(it => it.isNewItem) && (
                        <button
                          className="text-xs sm:text-sm btn-outline px-3 py-1 h-8 text-red-600 border-red-200 hover:bg-red-50"
                          type="button"
                          onClick={async () => {
                            try {
                              await api.put(`/orders/${o._id}/acknowledge`)
                              addToast('success', 'New items acknowledged')
                              await load()
                            } catch (e) {
                              addToast('error', 'Failed to acknowledge items')
                            }
                          }}
                        >
                          Acknowledge
                        </button>
                      )}
                      {canPrint && o.status === 'completed' && !o.movedToHistoryAt && (
                        <button
                          className="text-xs sm:text-sm btn-outline px-3 py-1 h-8"
                          type="button"
                          onClick={async () => {
                            try {
                              await api.put(`/orders/${o._id}/history`, { action: 'printed' })
                              await load()
                            } catch (e) {
                              addToast('error', 'Failed to mark order as printed')
                            }
                            navigate(`/admin/orders/${o._id}/print`, { state: { autoPrint: true } })
                          }}
                        >
                          Print
                        </button>
                      )}
                      {o.status !== 'completed' && (
                        <>
                          <button
                            className="text-xs sm:text-sm btn-primary px-3 py-1 h-8"
                            type="button"
                            onClick={()=>advanceStatus(o)}
                          >
                            Mark {STATUS[STATUS.indexOf(o.status)+1]}
                          </button>
                          <button
                            className="text-xs sm:text-sm btn-ghost px-3 py-1 h-8 text-green-700"
                            type="button"
                            onClick={()=>completeOrder(o)}
                          >
                            Complete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
