import React, { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useToast } from '../../context/ToastContext'

export default function Hero() {
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    badge1: '',
    badge2: '',
    badge3: '',
    imageUrl: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { addToast } = useToast()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.get('/hero')
        if (!mounted) return
        const h = res.data || {}
        setForm({
          title: h.title || 'Nanban Restaurant',
          subtitle: h.subtitle || "Taste Nagercoil's favourites, delivered to you.",
          badge1: h.badge1 || 'Curated South Indian Specials',
          badge2: h.badge2 || 'Live order tracking',
          badge3: h.badge3 || 'Dine-in & Takeaway',
          imageUrl: h.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop'
        })
      } catch (e) {
        if (!mounted) return
        setError('Failed to load hero settings')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.put('/hero', form)
      addToast('success', 'Hero updated')
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to save hero'
      setError(msg)
      addToast('error', msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Loading hero settings…</div>

  return (
    <div className="max-w-xl">
      <h2 className="font-semibold mb-3">Home Hero Settings</h2>
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
      <form onSubmit={onSubmit} className="panel space-y-3">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            className="input"
            value={form.title}
            onChange={e=>setForm({...form, title:e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Subtitle</label>
          <textarea
            className="input"
            rows={2}
            value={form.subtitle}
            onChange={e=>setForm({...form, subtitle:e.target.value})}
            required
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Badge 1</label>
            <input className="input" value={form.badge1} onChange={e=>setForm({...form, badge1:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">Badge 2</label>
            <input className="input" value={form.badge2} onChange={e=>setForm({...form, badge2:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">Badge 3</label>
            <input className="input" value={form.badge3} onChange={e=>setForm({...form, badge3:e.target.value})} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Background Image URL</label>
          <input
            className="input"
            value={form.imageUrl}
            onChange={e=>setForm({...form, imageUrl:e.target.value})}
          />
          <p className="mt-1 text-xs text-gray-500">Paste a full image URL (e.g. from Unsplash) that will be used as the hero background.</p>
        </div>
        <div className="pt-2 flex justify-end">
          <button disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save Hero'}
          </button>
        </div>
      </form>
    </div>
  )
}
