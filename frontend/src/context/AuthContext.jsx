// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing user in localStorage
    const storedUser = localStorage.getItem('customer');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Sync admin token
    const token = localStorage.getItem('admin_token');
    if (token) {
      setAdminToken(token);
    }
    
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('customer', JSON.stringify(userData));
    setUser(userData);
    navigate('/');
  };

  const adminLogin = (token) => {
    localStorage.setItem('admin_token', token);
    setAdminToken(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    setUser(null);
    navigate('/login');
  };

  const adminLogout = () => {
    localStorage.removeItem('admin_token');
    setAdminToken(null);
    navigate('/admin/login', { replace: true });
  };

  const updateUser = (userData) => {
    localStorage.setItem('customer', JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    adminToken,
    loading,
    login,
    adminLogin,
    logout,
    adminLogout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};