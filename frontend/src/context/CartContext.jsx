import React, { createContext, useContext, useMemo, useReducer } from 'react'

const CartContext = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const existing = state.items.find(i => i.foodItem === action.item.foodItem)
      let items
      if (existing) {
        items = state.items.map(i => i.foodItem === action.item.foodItem ? { ...i, quantity: i.quantity + (action.item.quantity || 1) } : i)
      } else {
        items = [...state.items, { ...action.item, quantity: action.item.quantity || 1 }]
      }
      const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
      return { items, total }
    }
    case 'remove': {
      const items = state.items.filter(i => i.foodItem !== action.foodItem)
      const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
      return { items, total }
    }
    case 'updateQty': {
      const items = state.items.map(i => i.foodItem === action.foodItem ? { ...i, quantity: Math.max(1, action.quantity) } : i)
      const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
      return { items, total }
    }
    case 'clear':
      return { items: [], total: 0 }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { items: [], total: 0 })

  const value = useMemo(() => ({
    items: state.items,
    total: state.total,
    addToCart: (item) => dispatch({ type: 'add', item }),
    removeFromCart: (foodItem) => dispatch({ type: 'remove', foodItem }),
    updateQty: (foodItem, quantity) => dispatch({ type: 'updateQty', foodItem, quantity }),
    clearCart: () => dispatch({ type: 'clear' })
  }), [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
