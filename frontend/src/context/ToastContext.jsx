import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(1)

  const remove = useCallback((id) => setToasts(ts => ts.filter(t => t.id !== id)), [])

  const addToast = useCallback((type, message) => {
    const id = idRef.current++
    setToasts(ts => [...ts, { id, type, message }])
    setTimeout(() => remove(id), 3000)
  }, [remove])

  const value = useMemo(() => ({ addToast }), [addToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast viewport (bottom-center) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 space-y-2 flex flex-col items-center">
        {toasts.map(t => (
          <div key={t.id} className={
            'min-w-[240px] max-w-[320px] px-3 py-2 rounded shadow-md text-sm text-white transition transform ' +
            (t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-green-600' : 'bg-gray-800')
          }>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
