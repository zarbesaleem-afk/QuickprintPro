
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  Ticket, 
  MessageCircle, 
  Trash2, 
  CheckCircle2, 
  Play, 
  CreditCard,
  Clock,
  User,
  FileText,
  AlertCircle,
  History,
  Download
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { getOrders, updateOrder, deleteOrder } from '../services/mockData';
import { format } from 'date-fns';
import { STATUS_COLORS, PRIORITY_COLORS, getActiveSettings } from '../constants';
import { generateInvoicePDF, generateReceiptToken } from '../services/pdfService';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const settings = getActiveSettings();

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    const data = await getOrders();
    const found = data.find(o => o.id === id);
    setOrder(found || null);
    setLoading(false);
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (order) {
      setIsUpdating(true);
      const updated = { 
        ...order, 
        status: newStatus,
        updatedAt: Date.now(),
        completionDate: newStatus === OrderStatus.COMPLETED ? Date.now() : order.completionDate
      };
      await updateOrder(updated);
      setOrder(updated);
      setIsUpdating(false);
    }
  };

  const handlePayment = async () => {
    if (order) {
      const updated = { ...order, paid: order.total, due: 0, updatedAt: Date.now() };
      await updateOrder(updated);
      setOrder(updated);
      alert("Payment fully collected!");
    }
  };

  const handleDelete = async () => {
    if (order && order.id) {
      if (confirm("Are you sure you want to remove this order permanently? This cannot be undone.")) {
        await deleteOrder(order.id);
        navigate('/orders');
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Fetching order details...</p>
    </div>
  );

  if (!order) return (
    <div className="p-12 text-center bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
      <h3 className="text-xl font-bold text-gray-900 dark:text-white text-sm">Order Not Found</h3>
      <p className="text-gray-500 dark:text-gray-400 mt-2 text-xs">The order you're looking for doesn't exist.</p>
      <button onClick={() => navigate('/orders')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">
        Back to Orders
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/orders')} 
            className="p-2.5 bg-white dark:bg-[#161b22] hover:bg-gray-50 dark:hover:bg-[#21262d] rounded-2xl transition-all shadow-sm border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-300 active:scale-95"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{order.invoiceNumber}</h2>
              {isUpdating && <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border shadow-sm ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
                {order.status}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${PRIORITY_COLORS[order.priority as keyof typeof PRIORITY_COLORS]}`}>
                {order.priority}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
            onClick={handleDelete}
            className="p-2.5 bg-white dark:bg-[#161b22] border border-red-200 dark:border-red-900/30 text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm active:scale-95"
            title="Delete Order"
           >
             <Trash2 size={20} />
           </button>
           <button 
            onClick={() => generateReceiptToken(order, settings, true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-50 dark:hover:bg-[#21262d] transition-all shadow-sm active:scale-95"
           >
             <Ticket size={18} /> Print Token
           </button>
           <button 
            onClick={() => generateInvoicePDF(order, settings, true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
           >
             <Printer size={18} /> Print Invoice
           </button>
           <button 
            onClick={() => generateInvoicePDF(order, settings, false)}
            className="p-2.5 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-[#21262d] hover:text-indigo-600 transition-all active:scale-95"
           >
             <Download size={18} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Status Workflow Selector */}
          <div className="bg-white dark:bg-[#0d1117] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative">
             <div className="flex items-center justify-between mb-8">
               <h3 className="font-black flex items-center gap-3 text-gray-800 dark:text-white text-base">
                 <History size={20} className="text-indigo-500" />
                 Order Status Workflow
               </h3>
               <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">
                 LAST UPDATED: {format(order.updatedAt, 'HH:mm, dd MMM').toUpperCase()}
               </span>
             </div>
             
             <div className="space-y-4">
               <div className="flex flex-wrap gap-3">
                 {[
                   { id: OrderStatus.PENDING, label: 'Pending', icon: <Clock size={18} />, activeColor: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/50' },
                   { id: OrderStatus.PROCESSING, label: 'Processing', icon: <Play size={18} />, activeColor: 'bg-indigo-600/10 text-indigo-500 border-indigo-500/50' },
                   { id: OrderStatus.COMPLETED, label: 'Completed', icon: <CheckCircle2 size={18} />, activeColor: 'bg-green-600/10 text-green-500 border-green-500/50' },
                 ].map((step) => {
                   const isActive = order.status === step.id;
                   return (
                     <button
                       key={step.id}
                       disabled={isActive || isUpdating}
                       onClick={() => handleUpdateStatus(step.id)}
                       className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border text-sm font-black transition-all ${
                         isActive 
                          ? `${step.activeColor} ring-1 ring-inset ring-transparent` 
                          : 'bg-transparent dark:bg-transparent text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-800 hover:border-indigo-500/30'
                       } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                     >
                       {step.icon}
                       {step.label}
                     </button>
                   );
                 })}
               </div>

               {/* Cancelled Button Prominent */}
               <div>
                  <button
                    disabled={order.status === OrderStatus.CANCELLED || isUpdating}
                    onClick={() => handleUpdateStatus(OrderStatus.CANCELLED)}
                    className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border text-sm font-black transition-all ${
                      order.status === OrderStatus.CANCELLED 
                       ? 'bg-red-500/10 text-red-500 border-red-500 shadow-lg shadow-red-500/10' 
                       : 'bg-transparent text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-800 hover:border-red-500/30'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                    <Trash2 size={18} />
                    Cancelled
                  </button>
               </div>
             </div>
          </div>

          {/* Items & Specifications */}
          <div className="bg-white dark:bg-[#0d1117] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <FileText className="text-indigo-600 dark:text-indigo-400" size={20} />
              <h3 className="font-black dark:text-white text-base">Items & Specifications</h3>
            </div>
            
            <div className="space-y-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest border-b border-gray-50 dark:border-gray-800">
                    <th className="pb-4">DESCRIPTION</th>
                    <th className="pb-4 text-center">QTY</th>
                    <th className="pb-4 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {order.items.map((item, i) => (
                    <tr key={item.id || i} className="text-sm font-bold">
                      <td className="py-6">
                        <p className="text-gray-900 dark:text-gray-100">{item.name}</p>
                      </td>
                      <td className="py-6 text-center text-gray-700 dark:text-gray-400">{item.qty}</td>
                      <td className="py-6 text-right text-gray-900 dark:text-white">Rs {item.lineTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="flex flex-col items-end gap-3 pt-6">
                <div className="flex gap-12 text-sm text-gray-500 dark:text-gray-400 font-bold">
                  <span>Subtotal:</span>
                  <span className="text-gray-900 dark:text-white">Rs {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex gap-12 text-xl font-black text-gray-900 dark:text-white">
                  <span>Total Bill:</span>
                  <span>Rs {order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
           {/* Customer Details Card */}
           <div className="bg-white dark:bg-[#0d1117] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
              <h3 className="font-black flex items-center gap-3 text-indigo-700 dark:text-indigo-400 text-base">
                <User size={18} /> Customer Details
              </h3>
              <div className="space-y-5">
                 <div className="p-4 bg-gray-50 dark:bg-[#161b22] rounded-2xl border border-transparent dark:border-gray-800">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">FULL NAME</p>
                    <p className="font-black text-gray-900 dark:text-gray-100 text-base">{order.customerName}</p>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#161b22] rounded-2xl border border-transparent dark:border-gray-800 group">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">PHONE NUMBER</p>
                      <p className="font-black text-gray-900 dark:text-gray-100 text-base">{order.customerPhone}</p>
                    </div>
                    <button 
                      onClick={() => window.open(`https://wa.me/${order.customerPhone.replace(/\D/g,'')}`, '_blank')}
                      className="p-2.5 bg-white dark:bg-[#21262d] text-green-500 dark:text-green-500 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-green-500 hover:text-white dark:hover:bg-green-500/20 transition-all active:scale-95"
                    >
                       <MessageCircle size={20} fill="currentColor" className="opacity-20 group-hover:opacity-100" />
                    </button>
                 </div>
              </div>
           </div>

           {/* Billing & Timeline Card */}
           <div className="bg-white dark:bg-[#0d1117] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
              <h3 className="font-black flex items-center gap-3 text-red-500 dark:text-red-400 text-base">
                <CreditCard size={18} /> Billing & Timeline
              </h3>
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-5 bg-indigo-50/50 dark:bg-[#161b22] rounded-2xl border border-indigo-100/50 dark:border-indigo-500/10">
                  <div className="p-3 bg-white dark:bg-[#21262d] text-indigo-600 dark:text-indigo-400 shadow-sm rounded-2xl">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest mb-0.5">DELIVERY DEADLINE</p>
                    <p className="font-black text-indigo-900 dark:text-gray-100 text-base">{format(order.deliveryDate, 'dd MMM yyyy')}</p>
                  </div>
                </div>

                <div className="p-5 bg-black dark:bg-black rounded-3xl text-white shadow-2xl">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">CURRENT BALANCE</p>
                   <div className="flex justify-between items-center">
                      <p className="text-2xl font-black tracking-tighter">Rs {order.due.toLocaleString()}</p>
                      {order.due > 0 && (
                        <button 
                          onClick={handlePayment}
                          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/30"
                        >
                          Mark Paid
                        </button>
                      )}
                   </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
