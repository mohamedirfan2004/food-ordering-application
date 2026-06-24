import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MobileLogin from './components/auth/MobileLogin';
import Home from './pages/Home';
import Cart from './pages/Cart';
const Checkout = lazy(() => import('./pages/Checkout'));
const Track = lazy(() => import('./pages/Track'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const OrderPrint = lazy(() => import('./pages/admin/OrderPrint'));
const TableOrder = lazy(() => import('./pages/TableOrder'));
import { CartProvider } from './context/CartContext';
import NavBar from './components/NavBar';
import BottomNav from './components/BottomNav';
import Menu from './pages/Menu';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import GeofenceGuard from './components/GeofenceGuard';

function AdminProtectedRoute({ children }) {
  const { adminToken, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // Wait for AuthProvider to sync
  if (!adminToken) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  
  return children;
}

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdminLogin = location.pathname === '/admin/login';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-500 ease-in-out">
      {!isAdminLogin && <NavBar />}
      <main className={`${isAdminRoute ? (isAdminLogin ? 'flex-1' : 'px-4 lg:px-8 py-4 flex-1') : 'container py-6 flex-1 pb-24 md:pb-6'} transition-colors duration-500 ease-in-out`}>
        <GeofenceGuard>
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          }>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<MobileLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/history" element={<Track />} />
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/table/:tableId" element={<TableOrder />} />

          {/* Admin Protected Route */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <Dashboard />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/orders/:orderId/print"
            element={
              <AdminProtectedRoute>
                <OrderPrint />
              </AdminProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <div className="text-center text-gray-500">
                Page not found. <Link className="text-orange-600 hover:text-orange-800" to="/">Go Home</Link>
              </div>
            }
          />
          </Routes>
          </Suspense>
        </GeofenceGuard>
      </main>
      {!isAdminLogin && (
        <footer className="border-t bg-white dark:bg-gray-950 dark:border-gray-800 transition-colors duration-500 hidden md:block">
          <div className="container py-4 text-sm text-gray-500">
            © {new Date().getFullYear()} Nanban Restaurant
          </div>
        </footer>
      )}
      {!isAdminLogin && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AppContent />
          </ConfirmProvider>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}