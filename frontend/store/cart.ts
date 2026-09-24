import { create } from 'zustand'
import { CartItem, PaymentMethod } from '@/types'

interface PaymentEntry {
  method: PaymentMethod
  amount: number
}

interface CartState {
  items: CartItem[]
  discount: number
  customerId?: number
  payments: PaymentEntry[]
  cashRegisterId?: number

  addItem: (item: Omit<CartItem, 'subtotal'>) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  updateItemDiscount: (productId: number, discount: number) => void
  setDiscount: (discount: number) => void
  setCustomer: (id?: number) => void
  setPayment: (payments: PaymentEntry[]) => void
  setCashRegister: (id: number | undefined) => void
  clearCart: () => void

  totalAmount: () => number
  finalAmount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  customerId: undefined,
  payments: [],
  cashRegisterId: undefined,

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? {
                  ...i,
                  quantity: i.quantity + item.quantity,
                  subtotal:
                    (i.quantity + item.quantity) * i.unitPrice - i.discount,
                }
              : i,
          ),
        }
      }
      return {
        items: [
          ...state.items,
          {
            ...item,
            subtotal: item.quantity * item.unitPrice - (item.discount || 0),
          },
        ],
      }
    })
  },

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, quantity, subtotal: quantity * i.unitPrice - i.discount }
          : i,
      ),
    })),

  updateItemDiscount: (productId, discount) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, discount, subtotal: i.quantity * i.unitPrice - discount }
          : i,
      ),
    })),

  setDiscount: (discount) => set({ discount }),
  setCustomer: (customerId) => set({ customerId }),
  setPayment: (payments) => set({ payments }),
  setCashRegister: (cashRegisterId) => set({ cashRegisterId }),

  clearCart: () =>
    set({ items: [], discount: 0, customerId: undefined, payments: [] }),

  totalAmount: () =>
    get().items.reduce((sum, item) => sum + item.subtotal, 0),

  finalAmount: () =>
    get().items.reduce((sum, item) => sum + item.subtotal, 0) - get().discount,
}))
