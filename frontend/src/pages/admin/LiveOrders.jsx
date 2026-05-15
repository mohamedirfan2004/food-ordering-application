import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import api from '../../lib/api'

const SOCKET_URL =
  (import.meta.env.VITE_API_BASE?.replace('/api', '')) || 'http://localhost:5000'

export default function LiveOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(false)

  const socketRef = useRef(null)
  const audioRef = useRef(null)

  // Load initial orders once
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/orders')
        if (!cancelled) {
          const list = Array.isArray(res.data)
            ? [...res.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            : []
          setOrders(list)
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load orders')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Prepare audio element once
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3')
  }, [])

  const playNotificationSound = () => {
    if (!soundEnabled || !audioRef.current) return
    try {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(err => {
        console.warn('Notification sound blocked by browser:', err)
      })
    } catch (err) {
      console.warn('Failed to play notification sound:', err)
    }
  }

  // Socket.io connection and real-time updates
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('LiveOrders connected to socket.io', socket.id)
    })

    socket.on('connect_error', (err) => {
      console.error('Socket.io connection error:', err)
    })

    const handleNewOrder = (newOrder) => {
      if (!newOrder) return
      setOrders(prev => {
        const exists = prev.some(
          o => (o._id && newOrder._id && o._id === newOrder._id) ||
               (o.orderNumber && newOrder.orderNumber && o.orderNumber === newOrder.orderNumber)
        )
        if (exists) return prev
        return [newOrder, ...prev]
      })
      playNotificationSound()
    }

    socket.on('new-order', handleNewOrder)

    return () => {
      socket.off('new-order', handleNewOrder)
      socket.disconnect()
      socketRef.current = null
    }
  }, [soundEnabled])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Live Orders</h1>
          <p className="text-xs text-gray-500">
            New orders will appear here in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled(v => !v)}
          className={
            'px-3 py-1.5 rounded-full text-xs border transition ' +
            (soundEnabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-50 text-gray-600 border-gray-200')
          }
        >
          {soundEnabled ? 'Sound: On' : 'Sound: Off'}
        </button>
      </div>

      {error && (
        <div className="text-xs sm:text-sm rounded-md border border-red-100 bg-red-50 px-3 py-2 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-gray-500">No orders yet.</div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <div
              key={order._id || order.orderNumber}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm shadow-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  Order #{order.orderNumber || '—'}
                </span>
                <span className="text-[11px] text-gray-500">
                  {order.customerName || 'Guest'} •{' '}
                  {order.table ? `Table ${order.table}` : 'No table'}
                </span>
              </div>
              <div className="text-right text-[11px] text-gray-500">
                <div>Total: ₹{order.totalAmount}</div>
                {order.createdAt && (
                  <div>
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
