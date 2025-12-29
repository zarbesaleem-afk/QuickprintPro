
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, ArrowLeft, Save } from 'lucide-react';
import { OrderItem, OrderStatus, Priority, PaymentMethod, Order } from '../types';
import { getActiveSettings } from '../constants';
import { saveOrder } from '../services/mockData';
import { addDays, format } from 'date-fns';

const NewOrder: React.FC = () => {
  const navigate = useNavigate();
  const settings = getActiveSettings();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [priority, setPriority] = useState<Priority>(Priority.NORMAL);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [notes, setNotes] = useState('');
  const [paid, setPaid] = useState<number>(0);
  const [items, setItems] = useState<OrderItem[]>([
    { id: Math.random().toString(), name: '', qty: 1, unitPrice: 0, lineTotal: 0 }
  ]);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-increment logic for invoice number
  useEffect(() => {
    const year = new Date().getFullYear();
    const storageKey = `last_invoice_sequence_${year}`;
    const lastSeq = localStorage.getItem(storageKey);
    const nextSeq = lastSeq ? parseInt(lastSeq) + 1 : 1;
    const paddedSeq = nextSeq.toString().padStart(5, '0');
    setNextInvoiceNumber(`${settings.invoicePrefix}${paddedSeq}`);
  }, [settings.invoicePrefix]);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), name: '', qty: 1, unitPrice: 0, lineTotal: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'unitPrice') {
          updated.lineTotal = updated.qty * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const discount = 0;
  const tax = 0;
  const total = subtotal - discount + tax;
  const due = total - paid;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || items[0].name === '') {
      alert("Please fill required fields");
      return;
    }

    setIsSaving(true);

    const newOrder: Order = {
      invoiceNumber: nextInvoiceNumber,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      discount,
      tax,
      total,
      paid,
      due,
      paymentMethod,
      deliveryDate: new Date(deliveryDate).getTime(),
      priority,
      notes,
      status: OrderStatus.PENDING
    };

    try {
      await saveOrder(newOrder);

      const year = new Date().getFullYear();
      const storageKey = `last_invoice_sequence_${year}`;
      const lastSeq = localStorage.getItem(storageKey);
      const nextSeq = lastSeq ? parseInt(lastSeq) + 1 : 1;
      localStorage.setItem(storageKey, nextSeq.toString());

      alert(`Order Saved Successfully! Invoice: ${nextInvoiceNumber}`);
      navigate('/orders');
    } catch (err) {
      alert("Failed to save order. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg dark:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Create New Order</h2>
            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">Invoice: {nextInvoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium"
          >
            Clear Form
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-50"
          >
            {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
            {isSaving ? 'Saving...' : 'Save & Print'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-white border-b dark:border-gray-800 pb-2">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Customer Name *</label>
                <input 
                  required
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="e.g. Ali Ahmed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Phone Number *</label>
                <input 
                  required
                  type="tel" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="03xx-xxxxxxx"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Address (Optional)</label>
                <input 
                  type="text" 
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="Street address for delivery"
                />
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-2">
              <h3 className="font-bold text-gray-800 dark:text-white">Order Items</h3>
              <button 
                type="button" 
                onClick={addItem}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
              >
                <Plus size={14} /> ADD ITEM
              </button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl relative group">
                   <div className="flex-1 min-w-[200px] space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Item / Service Name</label>
                      <input 
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg text-sm dark:text-white"
                        placeholder="e.g. Photo Print 4x6"
                      />
                   </div>
                   <div className="w-20 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Qty</label>
                      <input 
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg text-sm dark:text-white"
                      />
                   </div>
                   <div className="w-32 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Price</label>
                      <input 
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg text-sm dark:text-white"
                      />
                   </div>
                   <div className="w-32 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Total</label>
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-bold dark:text-white">
                        {item.lineTotal.toLocaleString()}
                      </div>
                   </div>
                   <button 
                     type="button" 
                     onClick={() => removeItem(item.id)}
                     className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Configuration */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-800 dark:text-white border-b dark:border-gray-800 pb-2">Order Options</h3>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Delivery Date</label>
                  <input 
                    type="date" 
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Priority</label>
                  <div className="flex gap-2">
                    {[Priority.NORMAL, Priority.URGENT].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-2 text-sm rounded-xl font-medium border transition-all ${
                          priority === p 
                          ? (p === Priority.URGENT ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-indigo-600 text-white border-indigo-600 shadow-md')
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Payment Method</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm outline-none"
                  >
                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm outline-none resize-none"
                    placeholder="Special instructions..."
                  />
                </div>
              </div>
           </div>

           {/* Summary Sidebar */}
           <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
              <h3 className="font-bold text-lg border-b border-white/20 pb-2">Billing Summary</h3>
              <div className="space-y-3">
                 <div className="flex justify-between text-indigo-200 text-sm">
                    <span>Subtotal</span>
                    <span>Rs {subtotal.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between font-bold text-xl pt-2 border-t border-white/20">
                    <span>Total</span>
                    <span>Rs {total.toLocaleString()}</span>
                 </div>
                 <div className="space-y-1 pt-4">
                    <label className="text-[10px] font-bold text-indigo-300 uppercase">Paid Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">Rs</span>
                      <input 
                        type="number"
                        value={paid}
                        onChange={(e) => setPaid(parseInt(e.target.value) || 0)}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:bg-white/20 transition-all font-bold text-lg"
                      />
                    </div>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-red-500/20 rounded-xl border border-red-500/30 mt-4">
                    <div className="text-xs uppercase font-bold text-red-200">Balance Due</div>
                    <div className="text-2xl font-black text-red-100">Rs {due.toLocaleString()}</div>
                 </div>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
};

export default NewOrder;
