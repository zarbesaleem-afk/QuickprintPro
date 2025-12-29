
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum Priority {
  NORMAL = 'normal',
  URGENT = 'urgent'
}

export enum PaymentMethod {
  CASH = 'Cash',
  BANK = 'Bank Transfer',
  EASYPAISA = 'Easypaisa',
  JAZZCASH = 'JazzCash',
  OTHER = 'Other'
}

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id?: string;
  invoiceNumber: string;
  createdAt: number; // timestamp
  updatedAt: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  due: number;
  paymentMethod: PaymentMethod;
  deliveryDate: number; // timestamp
  priority: Priority;
  notes: string;
  status: OrderStatus;
  completionDate?: number;
}

export interface ShopSettings {
  name: string;
  phone: string;
  address: string;
  email: string;
  logoUrl?: string;
  invoicePrefix: string;
  taxRate: number;
}
