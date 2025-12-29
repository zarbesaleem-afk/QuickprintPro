
import { ShopSettings } from './types';

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  name: "QuickPrint Pro",
  phone: "0300-1234567",
  address: "Shop #12, Digital Plaza, Mall Road, Lahore",
  email: "contact@quickprintpk.com",
  invoicePrefix: "RT-2024-",
  taxRate: 0,
};

export const getActiveSettings = (): ShopSettings => {
  const saved = localStorage.getItem('shopSettings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_SHOP_SETTINGS;
    }
  }
  return DEFAULT_SHOP_SETTINGS;
};

export const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export const PRIORITY_COLORS = {
  normal: "bg-gray-100 text-gray-800",
  urgent: "bg-red-100 text-red-800 animate-pulse font-bold",
};
