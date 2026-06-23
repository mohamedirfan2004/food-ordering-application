import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MobileLogin from './components/auth/MobileLogin';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Track from './pages/Track';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import OrderPrint from './pages/admin/OrderPrint';
import TableOrder from './pages/TableOrder';
import { CartProvider } from './context/CartContext';
import NavBar from './components/NavBar';
import BottomNav from './components/BottomNav';
import Menu from './pages/Menu';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import GeofenceGuard from './components/GeofenceGuard';
import { useEffect } from 'react';

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