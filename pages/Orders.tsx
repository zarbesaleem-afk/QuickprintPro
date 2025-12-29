
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Printer, 
  MessageCircle, 
  Play, 
  Clock,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Calendar,
  PlusCircle,
  Trash2
} from 'lucide-react';
// Fix: Import date-fns functions correctly using subpath imports to resolve export issues
import { format } from 'date-fns';
import isToday from 'date-fns/isToday';
import isYesterday from 'date-fns/isYesterday';
import startOfDay from 'date-fns/startOfDay';
import { getOrders, updateOrder, deleteOrder } from '../services/mockData';
import { Order, OrderStatus } from '../types';
import { STATUS_COLORS, PRIORITY_COLORS, getActiveSettings } from '../constants';
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
    // Listen for global order updates (from details page or sidebar)
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
    await loadOrders(); // Instant refresh
  };

  const markAsPaid = async (orderId: string | undefined) => {
    if (!orderId) return;
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    const updated = { ...orderToUpdate, paid: orderToUpdate.total, due: 0, updatedAt: Date.now() };
    await updateOrder(updated);
    await loadOrders(); // Instant refresh
    alert(`Payment of Rs ${orderToUpdate.due.toLocaleString()} collected for ${orderToUpdate.invoiceNumber}`);
  };

  const handleDelete = async (e: React.MouseEvent, orderId: string | undefined) => {
    e.stopPropagation(); // Prevent row click navigation
    if (!orderId) return;
    
    if (confirm("Are you sure you want to remove this order permanently? This action cannot be undone.")) {
      await deleteOrder(orderId);
      await loadOrders(); // Refresh table immediately
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

  // Grouping logic: Create an object where keys are date strings
  const groupedOrders = filteredOrders.reduce((groups: { [key: string]: Order[] }, order) => {
    const dateKey = startOfDay(new Date(order.createdAt)).getTime().toString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(order);
    return groups;
  }, {});

  // Sort keys (dates) descending
  const sortedDateKeys = Object.keys(groupedOrders).sort((a, b) => parseInt(b) - parseInt(a));

  const getDateLabel = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    if (isToday(date)) return "TODAY";
    if (isYesterday(date)) return "YESTERDAY";
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
          <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">Total Orders Found: {filteredOrders.length}</p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-indigo-600/20 flex items-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 text-sm"
        >
          <PlusCircle size={20} /> BOOK NEW TASK
        </button>
      </div>

      {/* Filters Bar */}
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
          <div className="p-3 bg-gray-50 dark:bg-[#0d1117] border border-transparent dark:border-gray-800 rounded-2xl text-gray-400">
            <Filter size={20} />
          </div>
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

      {/* Date-grouped List Container */}
      <div className="space-y-10">
        {sortedDateKeys.map(dateKey => (
          <div key={dateKey} className="space-y-4">
            {/* Group Header */}
            <div className="flex items-center gap-4 px-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-indigo-500" />
                <h3 className="text-xs font-black tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  {getDateLabel(dateKey)} — {groupedOrders[dateKey].length} ORDERS
                </h3>
              </div>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800/50"></div>
            </div>

            {/* Table Section for this date */}
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
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase leading-none ${PRIORITY_COLORS[order.priority as keyof typeof PRIORITY_COLORS]}`}>
                              {order.priority}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-0.5 min-w-[180px]">
                            <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
                              {order.invoiceNumber}
                            </span>
                            <span className="font-black text-gray-900 dark:text-gray-100 text-base leading-tight">{order.customerName}</span>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">{order.customerPhone}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-bold whitespace-nowrap">
                            <Clock size={14} className="text-indigo-400" />
                            {format(order.createdAt, 'HH:mm')}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-gray-100 font-black whitespace-nowrap">
                            <div className={`w-2 h-2 rounded-full mr-1 ${order.status === OrderStatus.COMPLETED ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                            {format(order.deliveryDate, 'dd MMM yyyy')}
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
                             {/* Workflow Actions */}
                             {order.status === OrderStatus.PENDING && (
                               <button 
                                onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, OrderStatus.PROCESSING); }}
                                title="Start Processing"
                                className="p-2.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all active:scale-90"
                               >
                                 <Play size={20} fill="currentColor" />
                               </button>
                             )}
                             {order.status === OrderStatus.PROCESSING && (
                               <button 
                                onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, OrderStatus.COMPLETED); }}
                                title="Mark Completed"
                                className="p-2.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all active:scale-90"
                               >
                                 <CheckCircle2 size={20} />
                               </button>
                             )}

                             {/* Payment Action */}
                             {order.due > 0 && (
                               <button 
                                onClick={(e) => { e.stopPropagation(); markAsPaid(order.id); }}
                                title="Collect Full Payment"
                                className="p-2.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all active:scale-90"
                               >
                                 <DollarSign size={20} />
                               </button>
                             )}

                             <button 
                              onClick={(e) => { e.stopPropagation(); generateInvoicePDF(order, settings, true); }}
                              title="Direct Print"
                              className="p-2.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"
                             >
                               <Printer size={20} />
                             </button>

                             <button 
                              onClick={(e) => handleDelete(e, order.id)}
                              title="Delete Order"
                              className="p-2.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                             >
                               <Trash2 size={20} />
                             </button>

                             <button 
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="ml-2 flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-[#21262d] text-gray-700 dark:text-gray-300 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                             >
                               VIEW <ArrowRight size={14} strokeWidth={3} />
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

        {sortedDateKeys.length === 0 && (
          <div className="p-32 text-center text-gray-400 dark:bg-[#161b22] rounded-[2rem] border border-gray-100 dark:border-gray-800">
            <Search size={48} className="mx-auto mb-6 opacity-10" />
            <p className="text-xl font-black dark:text-gray-300">No Orders Found</p>
            <p className="text-sm font-bold opacity-60">Try changing your search keywords or status filter.</p>
            <button 
              onClick={() => {setSearch(''); setStatusFilter('all');}}
              className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:opacity-90 shadow-xl shadow-indigo-600/20"
            >
              CLEAR ALL FILTERS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
