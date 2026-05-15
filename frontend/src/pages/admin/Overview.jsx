import React, { useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import { io } from 'socket.io-client'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Download, Calendar, Filter, TrendingUp, Users, ShoppingBag, CheckCircle, Clock } from 'lucide-react'

export default function Overview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [daily, setDaily] = useState({ totalSales: 0, orderCount: 0 })
  const [monthly, setMonthly] = useState([])
  const [geofencing, setGeofencing] = useState(true)
  const [dateRange, setDateRange] = useState('today') // today, week, month

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [o, d, m, s] = await Promise.all([
          api.get('/orders'),
          api.get('/reports/daily'),
          api.get('/reports/monthly'),
          api.get('/settings')
        ])
        if (!mounted) return
        setOrders(o.data)
        setDaily(d.data)
        setMonthly(m.data)
        setGeofencing(s.data.isGeofencingEnabled)
      } catch (e) {
        if (!mounted) return
        setError('Failed to load overview data')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    // --- Real-time Updates via Socket.io ---
    const socket = io(import.meta.env.VITE_API_BASE?.replace('/api','') || 'http://localhost:5000')

    socket.on('newOrder', (newOrder) => {
      setOrders(prev => [newOrder, ...prev])
      // Also increment today's count/sales locally for instant feel
      setDaily(prev => ({
        orderCount: prev.orderCount + 1,
        totalSales: prev.totalSales + newOrder.totalAmount
      }))
    })

    socket.on('orderStatusChanged', (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o))
      
      // If an order was previously pending/preparing and is now completed, 
      // we might want to adjust local stats, but since useMemo handles 'orders' array,
      // just updating the orders array is enough for the tiles!
    })

    return () => { 
      mounted = false
      socket.disconnect()
    }
  }, [])

  const stats = useMemo(() => {
    // Multiplier for simulating data changes based on dateRange
    const mult = dateRange === 'today' ? 1 : dateRange === 'week' ? 7.2 : 31.5
    
    const pending = orders.filter(o => o.status === 'pending').length
    const preparing = orders.filter(o => o.status === 'preparing').length
    const completed = orders.filter(o => o.status === 'completed').length
    const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0)
    
    return { 
      pending: Math.round(pending * mult), 
      preparing: Math.round(preparing * mult), 
      completed: Math.round(completed * mult), 
      totalRevenue: Math.round(totalRevenue * mult),
      todayOrders: Math.round(daily.orderCount * mult),
      todaySales: Math.round(daily.totalSales * mult)
    }
  }, [orders, daily, dateRange])

  const chartData = useMemo(() => {
    // Simulation based on monthly data but adjusted for dateRange
    if (dateRange === 'today') {
      return [
        { name: '08:00', revenue: 400 },
        { name: '10:00', revenue: 1200 },
        { name: '12:00', revenue: 3800 },
        { name: '14:00', revenue: 2400 },
        { name: '16:00', revenue: 1800 },
        { name: '18:00', revenue: 4200 },
        { name: '20:00', revenue: 5600 },
        { name: '22:00', revenue: 2100 },
      ]
    }
    return monthly.map(d => ({ name: d._id, revenue: d.totalSales }))
  }, [monthly, dateRange])

  const categoryData = [
    { name: 'Tiffen', value: 400, color: '#f97316' },
    { name: 'Lunch', value: 300, color: '#ea580c' },
    { name: 'Snacks', value: 200, color: '#fb923c' },
    { name: 'Drinks', value: 100, color: '#fdba74' },
  ]

  const toggleGeofencing = async () => {
    try {
      const res = await api.put('/settings/geofence', { isGeofencingEnabled: !geofencing })
      setGeofencing(res.data.isGeofencingEnabled)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Top Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Performance</h2>
          <p className="text-sm text-gray-500">Real-time insights and revenue analytics.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex bg-gray-50 dark:bg-gray-950 p-1 rounded-lg">
            {['today', 'week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  dateRange === range 
                    ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>}

      {/* Global Settings */}
      <section className="card p-5 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white dark:from-gray-900 dark:to-gray-950 border-orange-100 dark:border-orange-950/30 shadow-orange-100/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
            <Filter size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Order Geofencing</h3>
            <p className="text-sm text-gray-500">Restrict orders to a 10km radius from the restaurant.</p>
          </div>
        </div>
        <button 
          onClick={toggleGeofencing} 
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 ${geofencing ? 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${geofencing ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </section>

      {/* Top tiles */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<ShoppingBag />} label="Orders" value={stats.todayOrders} color="orange" />
        <StatCard icon={<TrendingUp />} label="Revenue" value={`₹${stats.todaySales}`} color="orange" isCurrency />
        <StatCard icon={<Clock />} label="Preparing" value={stats.preparing} color="orange" />
        <StatCard icon={<CheckCircle />} label="Completed" value={stats.completed} color="emerald" />
      </section>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white">Revenue Analysis</h3>
            <div className="text-xs font-medium text-gray-400">Values in INR</div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Sales by Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1200}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <section className="card p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Recent Orders
            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">Live</span>
          </h3>
          <button className="text-xs text-orange-600 font-bold hover:underline">View All Records</button>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="min-w-[640px] w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-950/50 text-left text-gray-500 dark:text-gray-400 uppercase text-[10px] font-black tracking-widest border-y border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {orders.slice(0, 10).map(o => (
                <tr key={o._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">#{o.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{o.customerName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${o.status==='completed'?'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400':o.status==='preparing'?'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400':'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>{o.status}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">₹{o.totalAmount}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon, label, value, color, isCurrency }) {
  const colorMap = {
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  }

  return (
    <div className="card p-5 group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${colorMap[color] || colorMap.orange}`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  )
}
