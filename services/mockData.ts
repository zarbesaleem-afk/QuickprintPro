
import { Order, OrderStatus, Priority, PaymentMethod } from '../types';

const today = new Date();
const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    invoiceNumber: "RT-2024-00001",
    createdAt: startOfToday - 86400000, // Yesterday
    updatedAt: startOfToday - 3600000,
    customerName: "Imran Khan",
    customerPhone: "0300-1122334",
    items: [
      { id: "i1", name: "Photo Printing 4x6", qty: 20, unitPrice: 25, lineTotal: 500 }
    ],
    subtotal: 500,
    discount: 0,
    tax: 0,
    total: 500,
    paid: 500,
    due: 0,
    paymentMethod: PaymentMethod.CASH,
    deliveryDate: startOfToday + 86400000,
    priority: Priority.NORMAL,
    notes: "Urgent wedding photos",
    status: OrderStatus.COMPLETED
  },
  {
    id: "2",
    invoiceNumber: "RT-2024-00002",
    createdAt: startOfToday - 7200000, // 2 hours ago
    updatedAt: startOfToday - 7200000,
    customerName: "Sana Javed",
    customerPhone: "0321-4455667",
    items: [
      { id: "i2", name: "ID Passport Photos", qty: 2, unitPrice: 150, lineTotal: 300 }
    ],
    subtotal: 300,
    discount: 50,
    tax: 0,
    total: 250,
    paid: 100,
    due: 150,
    paymentMethod: PaymentMethod.EASYPAISA,
    deliveryDate: startOfToday,
    priority: Priority.URGENT,
    notes: "For visa application",
    status: OrderStatus.PROCESSING
  }
];

const ORDERS_KEY = 'quickprint_orders_v2';

const notifyOrdersChanged = () => {
  window.dispatchEvent(new CustomEvent('ordersUpdated'));
};

export const getOrders = async (): Promise<Order[]> => {
  return new Promise((resolve) => {
    const savedOrders = localStorage.getItem(ORDERS_KEY);
    
    // If nothing is in local storage, seed it with mock data
    if (!savedOrders) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(MOCK_ORDERS));
      resolve([...MOCK_ORDERS].sort((a, b) => b.createdAt - a.createdAt));
      return;
    }

    try {
      const orders: Order[] = JSON.parse(savedOrders);
      resolve(orders.sort((a, b) => b.createdAt - a.createdAt));
    } catch (e) {
      // Reset on corruption
      localStorage.setItem(ORDERS_KEY, JSON.stringify(MOCK_ORDERS));
      resolve([...MOCK_ORDERS].sort((a, b) => b.createdAt - a.createdAt));
    }
  });
};

export const saveOrder = async (order: Order): Promise<void> => {
    const orders = await getOrders();
    const newOrder = { ...order, id: order.id || Math.random().toString(36).substr(2, 9) };
    const updatedOrders = [newOrder, ...orders.filter(o => o.id !== order.id && o.invoiceNumber !== order.invoiceNumber)];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    notifyOrdersChanged();
};

export const updateOrder = async (updatedOrder: Order): Promise<void> => {
    const orders = await getOrders();
    const updatedOrders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    notifyOrdersChanged();
};

export const deleteOrder = async (id: string): Promise<void> => {
    const orders = await getOrders();
    const updatedOrders = orders.filter(o => o.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    notifyOrdersChanged();
};
