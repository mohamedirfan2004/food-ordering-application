import React, { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'

export default function Items() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'main',
    image: null,
    isAvailable: true,
    availabilityType: 'always',
    scheduleStart: '',
    scheduleEnd: '',
  })
  const [editingId, setEditingId] = useState(null)
  const [categories, setCategories] = useState([
    { key: 'appetizer', name: 'Appetizer' },
    { key: 'main', name: 'Main' },
    { key: 'dessert', name: 'Dessert' },
    { key: 'beverage', name: 'Beverage' },
  ])
  const { addToast } = useToast()
  const confirm = useConfirm()

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/menu/all')
      setItems(res.data)
    } catch (e) {
      setError('Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [])

  useEffect(() => {
    let mounted = true
    api.get('/categories').then(res => {
      if (!mounted) return
      const actives = res.data.filter(c => c.active).map(c => ({ key: c.key, name: c.name }))
      if (actives.length) setCategories(actives)
    }).catch(()=>{})
    return () => { mounted = false }
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description)
      fd.append('price', form.price)
      fd.append('category', form.category)
      fd.append('isAvailable', form.isAvailable ? 'true' : 'false')
      fd.append('availabilityType', form.availabilityType)
      if (form.availabilityType === 'scheduled') {
        fd.append('scheduleStart', form.scheduleStart || '')
        fd.append('scheduleEnd', form.scheduleEnd || '')
      } else {
        fd.append('scheduleStart', '')
        fd.append('scheduleEnd', '')
      }
      if (form.image) fd.append('image', form.image)
      if (editingId) {
        await api.put(`/menu/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        addToast('success', 'Item updated')
      } else {
        await api.post('/menu', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        addToast('success', 'Item created')
      }
      setForm({ name: '', description: '', price: '', category: 'main', image: null, isAvailable: true, availabilityType: 'always', scheduleStart: '', scheduleEnd: '' })
      setEditingId(null)
      await load()
    } catch (e) {
      const msg = e?.response?.data?.message || 'Save failed'
      setError(msg)
      addToast('error', msg)
    }
  }

  const onEdit = (item) => {
    setEditingId(item._id)
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: null,
      isAvailable: item.isAvailable !== false,
      availabilityType: item.availabilityType || 'always',
      scheduleStart: item.scheduleStart || '',
      scheduleEnd: item.scheduleEnd || '',
    })
  }

  const onDelete = async (id) => {
    const ok = await confirm({ title: 'Delete this item?', message: 'This action cannot be undone.' })
    if (!ok) return
    try {
      await api.delete(`/menu/${id}`)
      addToast('success', 'Item deleted')
      await load()
    } catch {
      setError('Delete failed')
      addToast('error', 'Delete failed')
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h2 className="font-semibold mb-3">All Items</h2>
        {loading ? 'Loading…' : (
          <div className="grid gap-3">
            {items.map(i => (
              <div key={i._id} className="card p-3 flex items-center gap-3">
                <img src={`${import.meta.env.VITE_API_BASE?.replace('/api','') || 'https://nanban-backend.onrender.com'}/uploads/${i.image}`} className="w-16 h-16 object-cover rounded" onError={(e)=>{e.currentTarget.style.display='none'}} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{i.name} <span className="text-xs text-gray-500 dark:text-gray-400">({i.category})</span></div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{i.description}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                      {i.availabilityType === 'scheduled' ? 'Scheduled' : 'Always available'}
                    </span>
                    {i.availabilityType === 'scheduled' && (i.scheduleStart || i.scheduleEnd) && (
                      <span>
                        {i.scheduleStart || '--:--'} – {i.scheduleEnd || '--:--'}
                      </span>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${i.isAvailable !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {i.isAvailable !== false ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <div className="font-semibold mr-3">₹{i.price}</div>
                <button className="text-sm text-brand-600" onClick={()=>onEdit(i)}>Edit</button>
                <button className="text-sm text-red-600 ml-2" onClick={()=>onDelete(i._id)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="font-semibold mb-3">{editingId ? 'Edit Item' : 'Add Item'}</h2>
        {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={onSubmit} className="panel space-y-3">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e=>setForm({...form, description:e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Price</label>
              <input type="number" step="0.01" className="input" value={form.price} onChange={e=>setForm({...form, price: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Category</label>
              <select className="input" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}>
                {categories.map(c => (
                  <option key={c.key} value={c.key}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Image</label>
            <input type="file" accept="image/*" onChange={e=>setForm({...form, image: e.target.files?.[0] || null})} />
          </div>
          <div className="border-t border-gray-100 pt-3 mt-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">Item enabled</span>
              <label className="inline-flex items-center gap-2 text-xs">
                <span className="text-gray-500">Off</span>
                <input
                  type="checkbox"
                  className="rounded"
                  checked={form.isAvailable}
                  onChange={e=>setForm({...form, isAvailable: e.target.checked})}
                />
                <span className="text-gray-700">On</span>
              </label>
            </div>
            <div>
              <label className="block text-sm mb-1">Availability type</label>
              <select
                className="input text-sm"
                value={form.availabilityType}
                onChange={e=>setForm({...form, availabilityType: e.target.value})}
              >
                <option value="always">Always available</option>
                <option value="scheduled">Scheduled (time based)</option>
              </select>
            </div>
            {form.availabilityType === 'scheduled' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Start time</label>
                  <input
                    type="time"
                    className="input"
                    value={form.scheduleStart}
                    onChange={e=>setForm({...form, scheduleStart: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">End time</label>
                  <input
                    type="time"
                    className="input"
                    value={form.scheduleEnd}
                    onChange={e=>setForm({...form, scheduleEnd: e.target.value})}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button className="bg-brand-600 text-white rounded px-3 py-2 text-sm">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" className="border rounded px-3 py-2 text-sm" onClick={()=>{setEditingId(null); setForm({ name:'', description:'', price:'', category:'main', image:null, isAvailable: true, availabilityType: 'always', scheduleStart: '', scheduleEnd: '' })}}>Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  )
}
