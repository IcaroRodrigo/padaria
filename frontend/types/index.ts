export interface User {
  id: number
  name: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR'
  empresaId: number | null
  empresaNome?: string | null
  active: boolean
  createdAt: string
}

export interface Category {
  id: number
  name: string
}

export interface Supplier {
  id: number
  companyName: string
  tradeName?: string
  cnpj?: string
  phone?: string
  email?: string
  address?: string
  deliveryDays?: number
  notes?: string
  createdAt: string
}

export interface Product {
  id: number
  name: string
  description?: string
  unit: string
  costPrice: string | number
  salePrice: string | number
  barcode?: string
  plu?: number
  expirationDate?: string
  active: boolean
  stockQty?: string | number
  minStockQty?: string | number
  createdAt: string
  category: Category
  supplier?: Pick<Supplier, 'id' | 'companyName' | 'tradeName'>
}

export interface Customer {
  id: number
  name: string
  cpf?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  createdAt: string
  totalSpent?: number
  avgTicket?: number
  totalSales?: number
}

export interface SaleItem {
  id: number
  productId: number
  product: { id: number; name: string; unit: string }
  quantity: string | number
  unitPrice: string | number
  discount: string | number
  subtotal: string | number
}

export interface SalePayment {
  id: number
  method: string
  amount: string | number
}

export type PaymentMethod = 'CASH' | 'PIX' | 'DEBIT' | 'CREDIT'

export interface Sale {
  id: number
  totalAmount: string | number
  discount: string | number
  finalAmount: string | number
  paymentMethod: string
  amountPaid?: string | number
  change?: string | number
  status: 'COMPLETED' | 'CANCELLED'
  cancelReason?: string
  createdAt: string
  customer?: Pick<Customer, 'id' | 'name' | 'cpf'>
  user: Pick<User, 'id' | 'name'>
  cashRegister: { id: number; openedAt: string }
  items: SaleItem[]
  payments: SalePayment[]
}

export interface CashRegister {
  id: number
  openedAt: string
  closedAt?: string
  openingBalance: string | number
  closingBalance?: string | number
  totalSales?: number
  salesCount?: number
}

export interface ExpenseCategory {
  id: number
  name: string
}

export interface Expense {
  id: number
  description: string
  amount: string | number
  type: 'FIXED' | 'VARIABLE'
  status: 'PENDING' | 'PAID'
  dueDate?: string
  paidAt?: string
  notes?: string
  recurrenceDay?: number | null
  generatedFromId?: number | null
  createdAt: string
  category: ExpenseCategory
}

// Cart item for PDV
export interface CartItem {
  productId: number
  name: string
  unit: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
}

export type FiscalNoteStatus = 'PROCESSING' | 'AUTHORIZED' | 'DENIED' | 'CANCELLED' | 'ERROR'

export interface FiscalNote {
  id: number
  saleId: number
  ref: string
  cpfDestinatario?: string
  status: FiscalNoteStatus
  chaveAcesso?: string
  nsu?: string
  numeroNota?: number
  serie?: string
  danfeUrl?: string
  qrcodeUrl?: string
  errorMessage?: string
  ambiente: string
  createdAt: string
  updatedAt: string
}
