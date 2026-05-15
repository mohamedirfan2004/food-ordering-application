import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'

export default function OtpModal({ open, onClose, initialPhone = '', onVerified }) {
  const { addToast } = useToast()
  const [step, setStep] = useState('phone') // phone | code
  const [phone, setPhone] = useState(initialPhone)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [devHint, setDevHint] = useState('')

  useEffect(() => {
    if (!open) return
    setStep('phone')
    setPhone(initialPhone || '')
    setCode('')
    setTimeLeft(0)
    setDevHint('')
  }, [open, initialPhone])

  useEffect(() => {
    if (timeLeft <= 0) return
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft])

  const request = async () => {
    if (!/^\+?[0-9\s-]{7,15}$/.test((phone || '').trim())) {
      addToast('error', 'Enter a valid phone number')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/otp/request', { phone: phone.trim() })
      setDevHint(res.data?.devHint || '')
      setStep('code')
      setTimeLeft(60)
      addToast('success', 'OTP sent')
    } catch (e) {
      addToast('error', e?.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verify = async () => {
    if (code.trim().length < 4) return
    setLoading(true)
    try {
      const res = await api.post('/otp/verify', { phone: phone.trim(), code: code.trim() })
      const token = res.data?.token
      if (token) {
        localStorage.setItem('customer_token', token)
        localStorage.setItem('customer_verified_phone', phone.trim())
      }
      addToast('success', 'Phone verified')
      onVerified?.(phone.trim())
      onClose?.()
    } catch (e) {
      addToast('error', e?.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="panel w-full max-w-sm">
        <div className="text-lg font-semibold">Verify your phone</div>
        {step === 'phone' && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm mb-1">Mobile number</label>
              <input className="input" placeholder="e.g. 9876543210" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={request} disabled={loading}>{loading ? 'Sending…' : 'Send OTP'}</button>
            </div>
          </div>
        )}
        {step === 'code' && (
          <div className="mt-3 space-y-3">
            <div className="text-sm text-gray-600">Enter the code sent to <span className="font-medium">{phone}</span></div>
            <div>
              <label className="block text-sm mb-1">OTP</label>
              <input className="input" placeholder="6-digit code" value={code} onChange={e=>setCode(e.target.value)} />
              {devHint && <div className="text-xs text-gray-500 mt-1">Dev hint: {devHint}</div>}
            </div>
            <div className="flex items-center justify-between">
              <button className="btn-outline" onClick={()=>setStep('phone')}>Change number</button>
              <div className="text-xs text-gray-500">{timeLeft > 0 ? `Resend in ${timeLeft}s` : 'You can resend now'}</div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={onClose}>Cancel</button>
              {timeLeft <= 0 && <button className="btn-ghost" onClick={request} disabled={loading}>{loading ? 'Sending…' : 'Resend'}</button>}
              <button className="btn-primary" onClick={verify} disabled={loading}>{loading ? 'Verifying…' : 'Verify'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
