import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// Hardcoded restaurant coordinates (update to your actual location)
const RESTAURANT_LAT = 8.1833
const RESTAURANT_LNG = 77.4119
const MAX_DISTANCE_KM = 0.1 // 100m

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function TableOrder() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | allowed | denied | far | error
  const [distanceKm, setDistanceKm] = useState(null)

  useEffect(() => {
    if (!tableId) {
      setStatus('error')
      return
    }

    if (!('geolocation' in navigator)) {
      setStatus('error')
      return
    }

    const checkLocation = () => {
      setStatus('loading')

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const distance = haversineDistanceKm(
            latitude,
            longitude,
            RESTAURANT_LAT,
            RESTAURANT_LNG
          )
          setDistanceKm(distance)

          if (distance <= MAX_DISTANCE_KM) {
            // Within allowed radius – save table and redirect
            let decoded = tableId
            try {
              decoded = decodeURIComponent(tableId)
            } catch {
              // ignore decode errors, fall back to raw
            }
            try {
              localStorage.setItem('currentTableId', decoded)
            } catch {
              // ignore storage errors
            }

            setStatus('allowed')
            // Small delay so user briefly sees success state
            setTimeout(() => {
              navigate('/', { replace: true })
            }, 800)
          } else {
            setStatus('far')
          }
        },
        (error) => {
          if (error && (error.code === 1)) {
            // PERMISSION_DENIED
            setStatus('denied')
          } else {
            setStatus('error')
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    }

    checkLocation()
  }, [tableId, navigate])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-xl px-8 py-10 flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Checking your location…</h2>
          <p className="text-sm text-gray-500 text-center max-w-xs">
            Please wait a moment while we verify you are at the restaurant.
          </p>
        </div>
      </div>
    )
  }

  // Location permission denied
  if (status === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-xl px-8 py-10 max-w-sm text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Location Access Required</h2>
          <p className="text-sm text-gray-600 mb-4">
            We need your location to confirm that you are at the restaurant. Please enable
            location access for this site in your browser settings and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full inline-flex justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Too far from restaurant
  if (status === 'far') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-xl px-8 py-10 max-w-sm text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">You are not at the restaurant</h2>
          <p className="text-sm text-gray-600 mb-3">
            Table ordering is only available when you are physically at the restaurant.
          </p>
          {typeof distanceKm === 'number' && (
            <p className="text-xs text-gray-500 mb-4">
              Your approximate distance: {distanceKm.toFixed(2)} km (limit {MAX_DISTANCE_KM.toFixed(2)} km)
            </p>
          )}
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="w-full inline-flex justify-center rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white shadow hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
          >
            Go to home page
          </button>
        </div>
      </div>
    )
  }

  // Generic error state (no geolocation support or unexpected error)
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-xl px-8 py-10 max-w-sm text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to verify location</h2>
          <p className="text-sm text-gray-600 mb-4">
            We could not determine your location. Please make sure location services are
            enabled and try scanning the table QR again.
          </p>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="w-full inline-flex justify-center rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white shadow hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  // Success state (briefly shown before redirect)
  if (status === 'allowed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-xl px-8 py-10 flex flex-col items-center text-center">
          <h2 className="text-xl font-semibold text-emerald-700 mb-2">Welcome!</h2>
          <p className="text-sm text-gray-600 mb-1">You are at the restaurant.</p>
          <p className="text-xs text-gray-500 mb-4">Redirecting you to the menu…</p>
        </div>
      </div>
    )
  }

  return null
}
