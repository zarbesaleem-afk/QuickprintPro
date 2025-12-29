import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Printer, 
  Play, 
  Clock,
  ArrowRight,
  Calendar,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { getOrders, updateOrder, deleteOrder } from '../services/mockData';
import { Order, OrderStatus } from '../types';
import { STATUS_COLORS, getActiveSettings } from '../constants';
import { generateInvoicePDF } from '../services/pdfService';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const settings = getActiveSettings();
  const navigate = useNavigate();

  const loadOrders = async () => {
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
    window.addEventListener('ordersUpdated', loadOrders);
    return () => window.removeEventListener('ordersUpdated', loadOrders);
  }, []);

  const updateOrderStatus = async (orderId: string | undefined, newStatus: OrderStatus) => {
    if (!orderId) return;
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    const updated = { 
      ...orderToUpdate, 
      status: newStatus, 
      updatedAt: Date.now(),
      completionDate: newStatus === OrderStatus.COMPLETED ? Date.now() : orderToUpdate.completionDate
    };

    await updateOrder(updated);
    await loadOrders();
  };

  const handleDelete = async (e: React.MouseEvent, orderId: string | undefined) => {
    e.stopPropagation();
    if (!orderId) return;
    
    if (confirm("Are you sure you want to remove this order permanently?")) {
      await deleteOrder(orderId);
      await loadOrders();
    }
  };

  const filteredOrders = orders.filter(o => {
    const searchLower = search.toLowerCase();
    const matchesSearch = o.customerName.toLowerCase().includes(searchLower) || 
                          o.invoiceNumber.toLowerCase().includes(searchLower) ||
                          o.customerPhone.includes(search);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const groupedOrders = filteredOrders.reduce((groups: { [key: string]: Order[] }, order) => {
    const d = new Date(order.createdAt);
    d.setHours(0, 0, 0, 0);
    const dateKey = d.getTime().toString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(order);
    return groups;
  }, {});

  const sortedDateKeys = Object.keys(groupedOrders).sort((a, b) => parseInt(b) - parseInt(a));

  const getDateLabel = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateStr = format(date, 'yyyy-MM-dd');
    if (dateStr === format(today, 'yyyy-MM-dd')) return "TODAY";
    if (dateStr === format(yesterday, 'yyyy-MM-dd')) return "YESTERDAY";
    return format(date, 'dd MMM yyyy').toUpperCase();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in slide-in-from-bottom-2 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black dark:text-white tracking-tight">Orders Management</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">Total Orders: {filteredOrders.length}</p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-indigo-600/20 flex items-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 text-sm"
        >
          <PlusCircle size={20} /> BOOK NEW TASK
        </button>
      </div>

      <div className="bg-white dark:bg-[#161b22] p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search customer, invoice or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#0d1117] border border-transparent dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none dark:text-white text-sm font-bold"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 dark:bg-[#0d1117] border border-transparent dark:border-gray-800 rounded-2xl px-6 py-3.5 outline-none text-sm dark:text-white font-black min-w-[160px] appearance-none cursor-pointer"
          >
            <option value="all">ALL STATUSES</option>
            <option value={OrderStatus.PENDING}>PENDING</option>
            <option value={OrderStatus.PROCESSING}>PROCESSING</option>
            <option value={OrderStatus.COMPLETED}>COMPLETED</option>
            <option value={OrderStatus.CANCELLED}>CANCELLED</option>
          </select>
        </div>
      </div>

      <div className="space-y-10">
        {sortedDateKeys.map(dateKey => (
          <div key={dateKey} className="space-y-4">
            <div className="flex items-center gap-4 px-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-indigo-500" />
                <h3 className="text-xs font-black tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  {getDateLabel(dateKey)} — {groupedOrders[dateKey].length} ORDERS
                </h3>
              </div>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800/50"></div>
            </div>

            <div className="bg-white dark:bg-[#161b22] rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 dark:bg-gray-800/10 border-b border-gray-100 dark:border-gray-800">
                    <tr className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-8 py-5">STATUS</th>
                      <th className="px-8 py-5">CUSTOMER / INVOICE</th>
                      <th className="px-8 py-5">TIME BOOKED</th>
                      <th className="px-8 py-5">DEADLINE</th>
                      <th className="px-8 py-5">PAYMENT</th>
                      <th className="px-8 py-5 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {groupedOrders[dateKey].map(order => (
                      <tr 
                        key={order.id} 
                        className="hover:bg-indigo-50/10 dark:hover:bg-indigo-900/5 transition-all group cursor-pointer"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-2 items-start">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border leading-none tracking-tight ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
                              {order.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-0.5 min-w-[180px]">
                            <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">{order.invoiceNumber}</span>
                            <span className="font-black text-gray-900 dark:text-gray-100 text-base">{order.customerName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-bold">
                            {format(new Date(order.createdAt), 'HH:mm')}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-gray-100 font-black">
                            {format(new Date(order.deliveryDate), 'dd MMM yyyy')}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col min-w-[120px]">
                            <span className="font-black text-gray-900 dark:text-white text-lg leading-tight">Rs {order.total.toLocaleString()}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${order.due > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {order.due > 0 ? `DUE: ${order.due.toLocaleString()}` : 'PAID FULL'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-end gap-1">
                             {order.status === OrderStatus.PENDING && (
                               <button 
                                onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, OrderStatus.PROCESSING); }}
                                className="p-2.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl"
                               >
                                 <Play size={20} fill="currentColor" />
                               </button>
                             )}
                             <button 
                              onClick={(e) => { e.stopPropagation(); generateInvoicePDF(order, settings, true); }}
                              className="p-2.5 text-gray-400 hover:text-indigo-600 rounded-xl"
                             >
                               <Printer size={20} />
                             </button>
                             <button 
                              onClick={(e) => handleDelete(e, order.id)}
                              className="p-2.5 text-gray-400 hover:text-red-500 rounded-xl"
                             >
                               <Trash2 size={20} />
                             </button>
                             <button 
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="ml-2 px-5 py-2.5 bg-gray-100 dark:bg-[#21262d] text-gray-700 dark:text-gray-300 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all"
                             >
                               VIEW <ArrowRight size={14} className="inline ml-1" />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;