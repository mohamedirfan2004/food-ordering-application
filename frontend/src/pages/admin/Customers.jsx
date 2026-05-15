import React, { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await api.get('/customers')
        if (!mounted) return
        setCustomers(res.data || [])
      } catch (e) {
        if (!mounted) return
        setError('Failed to load customers')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <div>Loading…</div>

  const normalizedSearch = search.trim().toLowerCase()
  const filteredCustomers = normalizedSearch
    ? customers.filter(c => {
        const name = (c.name || '').toLowerCase()
        const phone = (c.phone || '').toLowerCase()
        return name.includes(normalizedSearch) || phone.includes(normalizedSearch)
      })
    : customers

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Customers</h2>
          <p className="text-xs text-gray-500">View customers who have placed orders.</p>
        </div>
        <div className="w-full max-w-xs ml-auto">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone"
            className="w-full border rounded px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
      {filteredCustomers.length === 0 ? (
        <div className="text-sm text-gray-500">No customers yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-gray-500 uppercase">
                <th className="text-left py-2 pr-4">Name</th>
                <th className="text-left py-2 pr-4">Phone</th>
                <th className="text-left py-2 pr-4">Email</th>
                <th className="text-left py-2 pr-4">Verified</th>
                <th className="text-left py-2 pr-4">Orders</th>
                <th className="text-left py-2 pr-4">Last order</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => {
                const orders = c.orders || []
                const lastOrder = orders[0]
                return (
                  <tr
                    key={c._id}
                    className={
                      'border-b last:border-0 cursor-pointer hover:bg-gray-50 ' +
                      (selectedCustomer && selectedCustomer._id === c._id ? 'bg-brand-50/40' : '')
                    }
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <td className="py-2 pr-4 whitespace-nowrap">{c.name || '—'}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{c.phone}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{c.email || '—'}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{c.isVerified ? 'Yes' : 'No'}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{orders.length}</td>
                    <td className="py-2 pr-4 whitespace-nowrap text-xs text-gray-500">
                      {lastOrder?.createdAt ? new Date(lastOrder.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {selectedCustomer && (
            <div className="mt-4 card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm font-semibold">{selectedCustomer.name || 'Customer'} </div>
                  <div className="text-xs text-gray-500">{selectedCustomer.phone}</div>
                </div>
                <div className="text-xs text-gray-500">
                  Joined {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : ''}
                </div>
              </div>
              <div className="text-sm font-medium mb-2">Orders</div>
              {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) ? (
                <div className="text-xs text-gray-500">No orders for this customer.</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-auto pr-1 text-xs">
                  {selectedCustomer.orders.map(o => {
                    const status = o.status || ''
                    const statusColor =
                      status === 'completed' ? 'text-emerald-600' :
                      status === 'pending' ? 'text-yellow-600' :
                      status === 'preparing' ? 'text-sky-600' :
                      status === 'cancelled' ? 'text-red-600' : 'text-gray-600'
                    return (
                      <div key={o._id} className="border rounded-lg px-3 py-2 flex items-center justify-between gap-3 bg-white">
                        <div>
                          <div className="font-semibold">Order #{o.orderNumber || o._id?.slice(-6)}</div>
                          <div className="text-[11px] text-gray-500">
                            {o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ₹{o.totalAmount}
                          </div>
                          <div className={`capitalize text-[11px] ${statusColor}`}>
                            {status}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
