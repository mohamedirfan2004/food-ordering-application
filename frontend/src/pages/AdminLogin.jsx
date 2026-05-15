import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Lock, User, LogIn } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { addToast } = useToast()
  const { adminLogin } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      adminLogin(res.data.token)
      addToast('success', 'Signed in successfully')
      navigate(location.state?.from?.pathname || '/admin', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid username or password'
      setError(msg)
      addToast('error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 bg-white dark:bg-gray-950 p-4">
      <div className="w-full max-w-[400px]">
        <h1 className="text-[32px] font-bold text-gray-900 dark:text-white mb-6 ml-2">Admin Login</h1>
        
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-10 shadow-sm">
          {error && (
            <div className="mb-6 text-red-600 text-sm font-medium px-1">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[17px] font-medium text-gray-900 dark:text-gray-100 ml-1">Username</label>
              <input 
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:border-orange-500 outline-none transition-all placeholder:text-gray-300" 
                placeholder="nanban_admin"
                value={form.username} 
                onChange={e=>setForm({...form, username:e.target.value})} 
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[17px] font-medium text-gray-900 dark:text-gray-100 ml-1">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:border-orange-500 outline-none transition-all placeholder:text-gray-300" 
                placeholder="••••••••••••••••"
                value={form.password} 
                onChange={e=>setForm({...form, password:e.target.value})} 
                required 
              />
            </div>

            <button 
              disabled={loading} 
              className={`w-full py-3.5 rounded-xl font-bold text-[19px] flex items-center justify-center transition-all active:scale-[0.98] ${
                loading 
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                : 'bg-[#f05a1a] text-white hover:bg-[#d94a12]'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
