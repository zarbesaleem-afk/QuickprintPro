import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { format, addDays } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GoogleGenAI } from "@google/genai";

// --- ENUMS & CONSTANTS ---
const OrderStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const Priority = {
  NORMAL: 'normal',
  URGENT: 'urgent'
};

const PaymentMethod = {
  CASH: 'Cash',
  BANK: 'Bank Transfer',
  EASYPAISA: 'Easypaisa',
  JAZZCASH: 'JazzCash',
  OTHER: 'Other'
};

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const DEFAULT_SHOP_SETTINGS = {
  name: "QuickPrint Pro",
  phone: "0300-1234567",
  address: "Shop #12, Digital Plaza, Mall Road, Lahore",
  email: "contact@quickprintpk.com",
  invoicePrefix: "RT-2024-",
  taxRate: 0,
};

const getActiveSettings = () => {
  const saved = localStorage.getItem('shopSettings');
  return saved ? JSON.parse(saved) : DEFAULT_SHOP_SETTINGS;
};

// --- DATA SERVICES ---
const ORDERS_KEY = 'quickprint_orders_v2';
const MOCK_ORDERS = [
  {
    id: "1",
    invoiceNumber: "RT-2024-00001",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    customerName: "Imran Khan",
    customerPhone: "0300-1122334",
    items: [{ id: "i1", name: "Photo Printing 4x6", qty: 20, unitPrice: 25, lineTotal: 500 }],
    subtotal: 500, discount: 0, tax: 0, total: 500, paid: 500, due: 0,
    paymentMethod: PaymentMethod.CASH,
    deliveryDate: Date.now() + 86400000,
    priority: Priority.NORMAL,
    notes: "Urgent wedding photos",
    status: OrderStatus.COMPLETED
  }
];

const getOrders = async () => {
  const saved = localStorage.getItem(ORDERS_KEY);
  if (!saved) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(MOCK_ORDERS));
    return MOCK_ORDERS;
  }
  return JSON.parse(saved).sort((a, b) => b.createdAt - a.createdAt);
};

const saveOrder = async (order) => {
  const orders = await getOrders();
  const newOrder = { ...order, id: order.id || Math.random().toString(36).substr(2, 9) };
  localStorage.setItem(ORDERS_KEY, JSON.stringify([newOrder, ...orders]));
  window.dispatchEvent(new Event('ordersUpdated'));
};

const updateOrder = async (updatedOrder) => {
  const orders = await getOrders();
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)));
  window.dispatchEvent(new Event('ordersUpdated'));
};

const deleteOrder = async (id) => {
  const orders = await getOrders();
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.filter(o => o.id !== id)));
  window.dispatchEvent(new Event('ordersUpdated'));
};

// --- PDF SERVICE ---
const generateInvoicePDF = (order, shop, directPrint = false) => {
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(67, 56, 202);
  doc.text(shop.name, 20, 30);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${shop.address} | ${shop.phone}`, 20, 38);
  
  autoTable(doc, {
    startY: 60,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: order.items.map(i => [i.name, i.qty, i.unitPrice, i.lineTotal]),
    headStyles: { fillColor: [67, 56, 202] }
  });

  if (directPrint) {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`${order.invoiceNumber}.pdf`);
  }
};

// --- AI SERVICE ---
const getBusinessInsights = async (orders) => {
  if (!process.env.API_KEY) return "No API key configured in environment.";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analyze these ${orders.length} printing shop orders and give 3 short tips for growth: ${JSON.stringify(orders.slice(0, 5))}`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text;
  } catch (e) { return "AI Service currently unavailable."; }
};

// --- COMPONENTS ---
const StatsCard = ({ label, value, icon, colorClass = "bg-white dark:bg-gray-800" }) => (
  <div className={`${colorClass} p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl font-black mt-2 dark:text-white">{value}</h3>
      </div>
      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">{icon}</div>
    </div>
  </div>
);

const Layout = ({ onLogout, isDarkMode, toggleDarkMode }) => {
  const [settings, setSettings] = useState(getActiveSettings());
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark' : ''} bg-gray-50 dark:bg-[#0d1117]`}>
      <aside className="w-64 bg-white dark:bg-[#161b22] border-r border-gray-200 dark:border-gray-800 hidden lg:flex flex-col">
        <div className="p-6 border-b dark:border-gray-800">
          <h1 className="text-xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">{settings.name}</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { path: '/', label: 'Dashboard', icon: <Lucide.LayoutDashboard size={20} /> },
            { path: '/orders', label: 'Orders', icon: <Lucide.ListOrdered size={20} /> },
            { path: '/orders/new', label: 'New Order', icon: <Lucide.PlusCircle size={20} /> },
            { path: '/reports', label: 'Reports', icon: <Lucide.BarChart3 size={20} /> },
            { path: '/settings', label: 'Settings', icon: <Lucide.Settings size={20} /> },
          ].map(item => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${location.pathname === item.path ? 'bg-indigo-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={onLogout} className="m-4 flex items-center gap-3 px-4 py-3 text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl">
          <Lucide.LogOut size={20} /> Logout
        </button>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8">
          <h2 className="font-bold dark:text-white uppercase tracking-widest text-xs">{location.pathname.split('/')[1] || 'Dashboard'}</h2>
          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className="p-2 text-gray-500">{isDarkMode ? <Lucide.Sun size={20}/> : <Lucide.Moon size={20}/>}</button>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black">AD</div>
          </div>
        </header>
        <div className="p-8 overflow-y-auto"><Routes>
          <Route path="/" element={<Dashboard isDarkMode={isDarkMode} />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/new" element={<NewOrder />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes></div>
      </main>
    </div>
  );
};

// --- PAGES ---
const Dashboard = ({ isDarkMode }) => {
  const [orders, setOrders] = useState([]);
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then(data => { setOrders(data); setLoading(false); });
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Total Orders" value={orders.length} icon={<Lucide.ShoppingCart size={24}/>} />
        <StatsCard label="Revenue" value={`Rs ${totalRevenue.toLocaleString()}`} icon={<Lucide.TrendingUp size={24}/>} />
        <StatsCard label="Active Tasks" value={orders.filter(o => o.status !== 'completed').length} icon={<Lucide.Clock size={24}/>} />
        <StatsCard label="Overdue" value="2" icon={<Lucide.AlertCircle size={24}/>} colorClass="bg-red-50 dark:bg-red-900/10" />
      </div>

      <div className="bg-white dark:bg-[#161b22] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="font-black mb-6 dark:text-white">Recent Activity</h3>
        <div className="space-y-4">
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0d1117] rounded-2xl">
              <div>
                <p className="font-bold dark:text-white">{order.customerName}</p>
                <p className="text-xs text-gray-500">{order.invoiceNumber}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[order.status]}`}>{order.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { getOrders().then(setOrders); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black dark:text-white">Orders List</h2>
        <button onClick={() => navigate('/orders/new')} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"><Lucide.PlusCircle size={18}/> New Order</button>
      </div>
      <div className="bg-white dark:bg-[#161b22] rounded-3xl border dark:border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-black text-gray-400 uppercase">
            <tr>
              <th className="p-4">Invoice</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {orders.map(order => (
              <tr key={order.id} className="text-sm dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                <td className="p-4 font-bold text-indigo-600">{order.invoiceNumber}</td>
                <td className="p-4">{order.customerName}</td>
                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[order.status]}`}>{order.status}</span></td>
                <td className="p-4 text-right font-black">Rs {order.total.toLocaleString()}</td>
                <td className="p-4 text-right"><Lucide.ChevronRight size={18}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const NewOrder = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', total: 0 });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveOrder({
      invoiceNumber: `RT-${Date.now().toString().slice(-5)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      customerName: form.name,
      customerPhone: form.phone,
      items: [{ name: 'Custom Printing', qty: 1, unitPrice: form.total, lineTotal: form.total }],
      total: form.total, paid: 0, due: form.total,
      status: OrderStatus.PENDING, deliveryDate: Date.now() + 86400000
    }).then(() => navigate('/orders'));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-[#161b22] p-8 rounded-3xl border dark:border-gray-800 shadow-sm">
      <h2 className="text-2xl font-black mb-6 dark:text-white">Book New Order</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="text-xs font-black text-gray-400 uppercase">Customer Name</label><input required className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mt-1 dark:text-white" onChange={e => setForm({...form, name: e.target.value})} /></div>
        <div><label className="text-xs font-black text-gray-400 uppercase">Phone</label><input required className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mt-1 dark:text-white" onChange={e => setForm({...form, phone: e.target.value})} /></div>
        <div><label className="text-xs font-black text-gray-400 uppercase">Amount (Rs)</label><input type="number" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mt-1 dark:text-white" onChange={e => setForm({...form, total: parseInt(e.target.value) || 0})} /></div>
        <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg">CREATE ORDER</button>
      </form>
    </div>
  );
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => { getOrders().then(data => setOrder(data.find(o => o.id === id))); }, [id]);

  if (!order) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-gray-800 rounded-lg"><Lucide.ArrowLeft size={20}/></button>
        <div className="flex gap-2">
          <button onClick={() => generateInvoicePDF(order, getActiveSettings(), true)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"><Lucide.Printer size={18}/> Print</button>
          <button onClick={() => deleteOrder(order.id).then(() => navigate('/orders'))} className="p-2 text-red-500"><Lucide.Trash2 size={20}/></button>
        </div>
      </div>
      <div className="bg-white dark:bg-[#161b22] p-10 rounded-3xl border dark:border-gray-800">
        <h2 className="text-3xl font-black dark:text-white">{order.invoiceNumber}</h2>
        <p className="text-gray-500 font-bold mt-1">{order.customerName} - {order.customerPhone}</p>
        <div className="mt-8 border-t dark:border-gray-800 pt-8 flex justify-between">
          <p className="text-sm font-bold text-gray-400">TOTAL BILL</p>
          <p className="text-2xl font-black dark:text-white">Rs {order.total.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

const Reports = () => (
  <div className="text-center py-20 bg-white dark:bg-[#161b22] rounded-3xl border dark:border-gray-800">
    <Lucide.BarChart size={48} className="mx-auto text-indigo-400 mb-4" />
    <h3 className="text-xl font-black dark:text-white">Business Intelligence</h3>
    <p className="text-gray-500 mt-2">Charts and data exports are available in the production version.</p>
  </div>
);

const Settings = () => {
  const [settings, setSettings] = useState(getActiveSettings());
  const handleSave = () => { localStorage.setItem('shopSettings', JSON.stringify(settings)); alert('Settings Saved!'); };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-[#161b22] p-8 rounded-3xl border dark:border-gray-800">
      <h2 className="text-2xl font-black mb-6 dark:text-white">Shop Settings</h2>
      <div className="space-y-4">
        <div><label className="text-xs font-black text-gray-400 uppercase">Shop Name</label><input className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mt-1 dark:text-white" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} /></div>
        <div><label className="text-xs font-black text-gray-400 uppercase">Phone</label><input className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mt-1 dark:text-white" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} /></div>
        <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg">SAVE SETTINGS</button>
      </div>
    </div>
  );
};

const Login = ({ onLogin }) => {
  const [pass, setPass] = useState('');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#161b22] p-10 rounded-3xl shadow-2xl text-center border dark:border-gray-800">
        <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6"><Lucide.Printer size={32}/></div>
        <h1 className="text-2xl font-black dark:text-white">QuickPrint PK</h1>
        <p className="text-gray-500 text-sm mt-2 mb-8 uppercase tracking-widest font-black">Admin Access Only</p>
        <input type="password" placeholder="Admin PIN" className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-4 text-center dark:text-white border border-transparent focus:border-indigo-500 outline-none" onChange={e => setPass(e.target.value)} />
        <button onClick={onLogin} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">SIGN IN</button>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const [isAuth, setIsAuth] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [isDark, setIsDark] = useState(localStorage.getItem('darkMode') === 'true');

  useEffect(() => { localStorage.setItem('darkMode', isDark); }, [isDark]);

  if (!isAuth) return <Login onLogin={() => { setIsAuth(true); localStorage.setItem('isLoggedIn', 'true'); }} />;

  return (
    <HashRouter>
      <Layout 
        onLogout={() => { setIsAuth(false); localStorage.removeItem('isLoggedIn'); }} 
        isDarkMode={isDark} 
        toggleDarkMode={() => setIsDark(!isDark)} 
      />
    </HashRouter>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
