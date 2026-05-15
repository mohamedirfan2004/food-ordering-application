import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import api from '../../lib/api'

export default function OrderPrint() {
  const { orderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [format, setFormat] = useState('both')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [orderRes, profileRes] = await Promise.all([
          api.get(`/orders/${orderId}`),
          api.get('/auth/profile').catch(() => null),
        ])
        if (!mounted) return
        setOrder(orderRes.data)
        if (profileRes) {
          setProfile(profileRes.data)
          const def = profileRes.data?.printSettings?.defaultFormat
          if (def === 'kot' || def === 'bill' || def === 'both') setFormat(def)
        }
      } catch (e) {
        setError('Failed to load order for printing')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [orderId])

  useEffect(() => {
    const auto = location.state && location.state.autoPrint
    if (!auto) return
    if (!order) return
    const id = setTimeout(() => {
      window.print()
    }, 400)
    return () => clearTimeout(id)
  }, [location.state, order])

  const handlePrint = () => {
    window.print()
  }

  const canPrint = profile ? (profile.canPrint !== false) : true

  const restaurantName = 'Nanban Restaurant'
  const restaurantAddress = 'Nagercoil, Tamil Nadu'
  const restaurantContact = '+91-00000 00000'
  const footerText = profile?.printSettings?.footerText || 'Thank you, visit again'

  if (loading) {
    return <div className="max-w-md mx-auto text-center text-sm text-gray-500">Loading order…</div>
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto text-center text-sm text-red-600">
        {error || 'Order not found'}
      </div>
    )
  }

  if (!canPrint) {
    return (
      <div className="max-w-md mx-auto text-center text-sm text-gray-600">
        You do not have permission to print orders.
      </div>
    )
  }

  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date()

  const kotVisible = format === 'kot' || format === 'both'
  const billVisible = format === 'bill' || format === 'both'

  return (
    <div className="max-w-xl mx-auto px-4 py-4 text-sm text-gray-900 print:text-black">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          className="btn-ghost text-xs sm:text-sm"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        <div className="flex items-center gap-2 text-xs">
          <select
            value={format}
            onChange={e => setFormat(e.target.value)}
            className="border rounded px-2 py-1 text-xs"
          >
            <option value="kot">Kitchen ticket only</option>
            <option value="bill">Customer bill only</option>
            <option value="both">Both (stacked)</option>
          </select>
          <button
            type="button"
            className="btn-primary px-3 py-1 h-8 text-xs"
            onClick={handlePrint}
          >
            Print
          </button>
        </div>
      </div>

      <div className="space-y-8 print:space-y-4">
        {kotVisible && (
          <section className="border border-dashed border-gray-400 rounded p-4">
            <div className="text-center mb-2">
              <div className="text-xs font-semibold tracking-wide">KITCHEN ORDER TICKET</div>
              <div className="text-base font-semibold">{restaurantName}</div>
            </div>
            <div className="flex justify-between text-xs mb-1">
              <div>
                <div>Order: {order.orderNumber || order._id}</div>
                <div>Table: {order.table || 'N/A'}</div>
              </div>
              <div className="text-right">
                <div>{createdAt.toLocaleDateString()}</div>
                <div>{createdAt.toLocaleTimeString()}</div>
              </div>
            </div>
            <div className="mt-2 border-t border-gray-400 pt-2" />
            <table className="w-full text-xs mt-1">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1">Item</th>
                  <th className="text-right py-1 w-12">Qty</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(order.items.reduce((acc, it) => {
                  const key = it.foodItem || it.name;
                  if (!acc[key]) acc[key] = { ...it };
                  else acc[key].quantity += it.quantity;
                  return acc;
                }, {})).map((it, idx) => (
                  <tr key={idx} className="border-b border-dotted border-gray-300 align-top">
                    <td className="py-1 pr-2">{it.name}</td>
                    <td className="py-1 text-right">{it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {order.specialInstructions && (
              <div className="mt-2 text-xs">
                <span className="font-semibold">Notes: </span>
                <span>{order.specialInstructions}</span>
              </div>
            )}
          </section>
        )}

        {billVisible && (
          <section className="border border-gray-400 rounded p-4">
            <div className="text-center mb-2">
              <div className="text-base font-semibold">{restaurantName}</div>
              <div className="text-xs">{restaurantAddress}</div>
              <div className="text-xs">Contact: {restaurantContact}</div>
            </div>
            <div className="flex justify-between text-xs mb-1">
              <div>
                <div>Order: {order.orderNumber || order._id}</div>
                <div>Table: {order.table || 'N/A'}</div>
              </div>
              <div className="text-right">
                <div>{createdAt.toLocaleDateString()}</div>
                <div>{createdAt.toLocaleTimeString()}</div>
              </div>
            </div>
            <div className="mt-2 border-t border-gray-400 pt-2" />
            <table className="w-full text-xs mt-1">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1">Item</th>
                  <th className="text-right py-1 w-12">Qty</th>
                  <th className="text-right py-1 w-16">Price</th>
                  <th className="text-right py-1 w-16">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(order.items.reduce((acc, it) => {
                  const key = it.foodItem || it.name;
                  if (!acc[key]) acc[key] = { ...it };
                  else acc[key].quantity += it.quantity;
                  return acc;
                }, {})).map((it, idx) => (
                  <tr key={idx} className="border-b border-dotted border-gray-300 align-top">
                    <td className="py-1 pr-2">{it.name}</td>
                    <td className="py-1 text-right">{it.quantity}</td>
                    <td className="py-1 text-right">₹{it.price}</td>
                    <td className="py-1 text-right">₹{it.price * it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 flex justify-between text-xs">
              <div>Total items</div>
              <div>{order.items.reduce((s, it) => s + (it.quantity || 0), 0)}</div>
            </div>
            <div className="mt-1 flex justify-between text-sm font-semibold">
              <div>Grand Total</div>
              <div>₹{order.totalAmount}</div>
            </div>
            <div className="mt-3 text-center text-xs">{footerText}</div>
          </section>
        )}
      </div>
    </div>
  )
}
