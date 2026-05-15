import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/api';

// Restaurant coordinates   8.27161934456965, 77.43950662698492 thittu
// nanban 8.266654100100181 , 77.43888585119556
const RESTAURANT_LAT = 8.266654100100181;
const RESTAURANT_LNG = 77.43888585119556;
const MAX_DISTANCE_RADIUS = 20000; // meters

// Haversine formula to calculate distance between two coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const toRadians = (deg) => (deg * Math.PI) / 180;
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function GeofenceGuard({ children }) {
  const [locationStatus, setLocationStatus] = useState('checking'); // 'checking', 'inside', 'outside', 'denied', 'error'
  const [distance, setDistance] = useState(null);
  const location = useLocation();

  // Routes that bypass the geofence check (Admin, Track, Login)
  const isExemptRoute = 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/history') || 
    location.pathname === '/login';

  useEffect(() => {
    if (isExemptRoute) {
      return;
    }

    let watchId;

    const initGeofence = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data && res.data.isGeofencingEnabled === false) {
          setLocationStatus('bypassed');
          return;
        }
      } catch (err) {
        console.error('Failed to fetch geofencing settings', err);
      }

      if (!navigator.geolocation) {
        setLocationStatus('error');
        return;
      }

      const checkLocation = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            const dist = calculateDistance(userLat, userLng, RESTAURANT_LAT, RESTAURANT_LNG);
            setDistance(Math.round(dist));

            if (dist <= MAX_DISTANCE_RADIUS) {
              setLocationStatus('inside');
            } else {
              setLocationStatus('outside');
            }
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setLocationStatus('denied');
            } else {
              setLocationStatus('error');
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      };

      checkLocation();

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const dist = calculateDistance(userLat, userLng, RESTAURANT_LAT, RESTAURANT_LNG);
          setDistance(Math.round(dist));

          if (dist <= MAX_DISTANCE_RADIUS) {
            setLocationStatus('inside');
          } else {
            setLocationStatus('outside');
          }
        },
        () => {}, // ignore watch errors, rely on getCurrentPosition
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    };

    initGeofence();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isExemptRoute]);

  if (isExemptRoute || locationStatus === 'bypassed') {
    return children;
  }

  if (locationStatus === 'checking') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Verifying Location</h2>
        <p className="text-sm text-gray-500 mt-2">Please wait while we confirm you are at the restaurant...</p>
      </div>
    );
  }

  if (locationStatus === 'denied' || locationStatus === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Location Access Required</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          You must allow location access to place an order. This ensures orders are only placed by customers physically at the restaurant.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 btn-primary px-6 py-2 rounded-full"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (locationStatus === 'outside') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Out of Range</h2>
        <p className="text-base text-gray-600 mt-3 max-w-md">
          You are currently <strong>{distance} meters</strong> away from the restaurant.
        </p>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          Orders can only be placed when you are within {MAX_DISTANCE_RADIUS} meters of our location. Please come inside to view the menu and order!
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 btn-outline px-6 py-2 rounded-full"
        >
          Recheck Location
        </button>
      </div>
    );
  }

  // User is inside the geofence
  return children;
}
