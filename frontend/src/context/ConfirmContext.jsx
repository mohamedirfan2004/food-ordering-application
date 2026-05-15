import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, title: '', message: '', confirmText: 'Confirm', cancelText: 'Cancel', resolve: null })

  const open = useCallback((opts) => new Promise((resolve) => {
    setState({ open: true, resolve, title: opts?.title || 'Are you sure?', message: opts?.message || '', confirmText: opts?.confirmText || 'Confirm', cancelText: opts?.cancelText || 'Cancel' })
  }), [])

  const close = useCallback(() => setState(s => ({ ...s, open: false })), [])

  const onConfirm = useCallback(() => {
    if (state.resolve) state.resolve(true)
    close()
  }, [state.resolve, close])

  const onCancel = useCallback(() => {
    if (state.resolve) state.resolve(false)
    close()
  }, [state.resolve, close])

  const value = useMemo(() => ({ confirm: open }), [open])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="panel w-full max-w-sm">
            <div className="text-lg font-semibold mb-1">{state.title}</div>
            {state.message && <div className="text-sm text-gray-600 mb-3">{state.message}</div>}
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={onCancel}>{state.cancelText}</button>
              <button className="btn-danger" onClick={onConfirm}>{state.confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
