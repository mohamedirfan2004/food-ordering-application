import React, { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function Reports() {
  const [daily, setDaily] = useState({ totalSales: 0, orderCount: 0 })
  const [monthly, setMonthly] = useState([])
  const [topItems, setTopItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [d, m, t] = await Promise.all([
        api.get('/reports/daily'),
        api.get('/reports/monthly'),
        api.get('/reports/top-items?limit=5')
      ])
      setDaily(d.data)
      setMonthly(m.data)
      setTopItems(t.data)
    } catch (e) {
      setError('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [])

  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? 'Loading…' : (
        <>
          <section className="grid sm:grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="text-sm text-gray-600">Today's Orders</div>
              <div className="text-2xl font-semibold">{daily.orderCount}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-600">Today's Revenue</div>
              <div className="text-2xl font-semibold text-brand-600">₹{daily.totalSales}</div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Monthly Sales (by day)</h3>
            <div className="card p-3 overflow-x-auto">
              <table className="min-w-[480px] w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2">Date</th>
                    <th className="py-2">Orders</th>
                    <th className="py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((row) => (
                    <tr key={row._id} className="border-t">
                      <td className="py-2">{row._id}</td>
                      <td className="py-2">{row.orderCount}</td>
                      <td className="py-2">₹{row.totalSales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Top Selling Items</h3>
            <div className="card p-3 overflow-x-auto">
              <table className="min-w-[480px] w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2">Item</th>
                    <th className="py-2">Quantity</th>
                    <th className="py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map((row) => (
                    <tr key={row._id} className="border-t">
                      <td className="py-2">{row.name}</td>
                      <td className="py-2">{row.totalQuantity}</td>
                      <td className="py-2">₹{row.totalRevenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
