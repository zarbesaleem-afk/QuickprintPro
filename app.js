import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate, useParams 
} from 'react-router-dom';
import { 
  LayoutDashboard, ListOrdered, PlusCircle, Settings as SettingsIcon, LogOut, Sun, Moon, 
  ShoppingCart, TrendingUp, Clock, AlertCircle, Sparkles, Printer, ArrowLeft, Trash2, 
  CheckCircle2, Printer as PrinterIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { format, addDays } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CONSTANTS ---
const OrderStatus = { PENDING: 'pending', PROCESSING: 'processing', COMPLETED: 'completed', CANCELLED: 'cancelled' };
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STORAGE_KEY = 'quickprint_v1_orders';
const SETTINGS_KEY = 'quickprint_v1_settings';

// --- UTILS ---
const getInitialSettings = () => {
  const saved = localStorage.getItem(SETTINGS_KEY);
  return saved ? JSON.parse(saved) : {
    name: "QuickPrint Pro",
    phone: "0300-1234567",
    address: "Lahore, Pakistan",
    invoicePrefix: "QP-2025-",
    taxRate: 0
  };
};

const getOrders = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

// --- LIGHTWEIGHT AI SERVICE (NO SDK REQUIRED) ---
const getAIInsights = async (orders) => {
  const apiKey = window.APP_CONFIG.API_KEY;
  if (!apiKey) return "API Key missing. Go to Settings to add your Gemini API Key.";

  const prompt = `Analyze these printing shop orders and give 3 short growth tips: ${JSON.stringify(orders.slice(0, 5))}`;
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    return "Insights unavailable. Check connection/API key.";
  }
};

// --- COMPONENTS ---
const Sidebar = ({ settings, isDark, toggleDark, onLogout }) => {
  const loc = useLocation();
  const nav = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/orders', label: 'Orders', icon: ListOrdered },
    { path: '/new', label: 'New Order', icon: PlusCircle },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 h-screen flex flex-col p-4 transition-colors">
      <div className="mb-8 p-2">
        <h1 className="text-xl font-black text-indigo-600 dark:text-indigo-400">{settings.name}</h1>
        <p className="text-[10px] uppercase font-black text-gray-400">Admin Panel</p>
      </div>
      <nav className="flex-1 space-y-1">
        {nav.map(item => {
          const Icon = item.icon;
          const active = loc.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <Icon size={18} /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="pt-4 border-t dark:border-gray-800 space-y-2">
        <button onClick={toggleDark} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
          {isDark ? <Sun size={18}/> : <Moon size={18}/>} {isDark ? 'Light' : 'Dark'} Mode
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl">
          <LogOut size={18}/> Logout
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [orders, setOrders] = useState(getOrders());
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => ({
    rev: orders.reduce((s, o) => s + o.total, 0),
    active: orders.filter(o => o.status !== 'completed').length,
    total: orders.length
  }), [orders]);

  const loadInsights = async () => {
    setLoading(true);
    const text = await getAIInsights(orders);
    setInsights(text);
    setLoading(false);
  };

  return (
    <div className="space-y-8 p-2 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800">
          <p className="text-xs font-black text-gray-400 uppercase">Revenue</p>
          <h2 className="text-3xl font-black mt-1">Rs {stats.rev.toLocaleString()}</h2>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800">
          <p className="text-xs font-black text-gray-400 uppercase">Active</p>
          <h2 className="text-3xl font-black mt-1 text-indigo-600">{stats.active}</h2>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800">
          <p className="text-xs font-black text-gray-400 uppercase">Total Orders</p>
          <h2 className="text-3xl font-black mt-1">{stats.total}</h2>
        </div>
      </div>

      <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-xl flex items-center gap-2"><Sparkles /> AI Insights</h3>
          <button onClick={loadInsights} disabled={loading} className="px-4 py-2 bg-white/20 rounded-xl text-xs font-black hover:bg-white/30 disabled:opacity-50">
            {loading ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>
        <p className="text-indigo-100 text-sm whitespace-pre-line leading-relaxed">
          {insights || "Generate AI-powered growth tips based on your data."}
        </p>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState(getOrders());
  const nav = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black">History</h2>
        <Link to="/new" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black">New Order</Link>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase text-gray-400 tracking-widest">
            <tr><th className="px-6 py-4">Invoice</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Amount</th></tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => nav(`/orders/${o.id}`)}>
                <td className="px-6 py-4 font-bold text-indigo-600">{o.invoiceNumber}</td>
                <td className="px-6 py-4 font-medium">{o.customerName}</td>
                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[o.status]}`}>{o.status}</span></td>
                <td className="px-6 py-4 text-right font-black">Rs {o.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const NewOrder = () => {
  const [form, setForm] = useState({ name: '', phone: '', amount: 0 });
  const nav = useNavigate();
  const settings = getInitialSettings();

  const handleSave = (e) => {
    e.preventDefault();
    const orders = getOrders();
    const order = {
      id: Date.now().toString(),
      invoiceNumber: `${settings.invoicePrefix}${Math.floor(Math.random()*90000)+10000}`,
      createdAt: Date.now(),
      customerName: form.name,
      customerPhone: form.phone,
      total: parseInt(form.amount) || 0,
      status: 'pending'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...orders]));
    nav('/orders');
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] border dark:border-gray-800 shadow-xl">
      <h2 className="text-2xl font-black mb-8">New Order</h2>
      <form onSubmit={handleSave} className="space-y-6">
        <div><label className="text-[10px] font-black text-gray-400 uppercase">Customer</label><input required className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mt-1 outline-none focus:ring-2 focus:ring-indigo-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
        <div><label className="text-[10px] font-black text-gray-400 uppercase">Amount (Rs)</label><input type="number" required className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mt-1 outline-none focus:ring-2 focus:ring-indigo-500" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
        <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">CREATE INVOICE</button>
      </form>
    </div>
  );
};

const Settings = () => {
  const [s, setS] = useState(getInitialSettings());
  const [key, setKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');

  const save = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    localStorage.setItem('GEMINI_API_KEY', key);
    window.APP_CONFIG.API_KEY = key;
    alert('Saved successfully!');
    window.location.reload();
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] border dark:border-gray-800">
      <h2 className="text-2xl font-black mb-8">Shop Settings</h2>
      <div className="space-y-6">
        <div><label className="text-[10px] font-black text-gray-400 uppercase">Shop Name</label><input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mt-1 border dark:border-gray-700" value={s.name} onChange={e => setS({...s, name: e.target.value})} /></div>
        <div><label className="text-[10px] font-black text-red-500 uppercase">Gemini API Key</label><input type="password" className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mt-1 border dark:border-gray-700" value={key} onChange={e => setKey(e.target.value)} /></div>
        <button onClick={save} className="w-full py-4 bg-black text-white rounded-2xl font-black">SAVE CHANGES</button>
      </div>
    </div>
  );
};

const App = () => {
  const [isAuth, setIsAuth] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [isDark, setIsDark] = useState(localStorage.getItem('isDarkMode') === 'true');
  const settings = getInitialSettings();

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('isDarkMode', isDark);
  }, [isDark]);

  if (!isAuth) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-12 rounded-[3rem] shadow-2xl text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white"><PrinterIcon size={32}/></div>
        <h1 className="text-2xl font-black mb-2">QuickPrint Admin</h1>
        <button onClick={() => { setIsAuth(true); localStorage.setItem('isLoggedIn', 'true'); }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black mt-6">SIGN IN</button>
      </div>
    </div>
  );

  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-50 dark:bg-[#0d1117] dark:text-gray-100">
        <Sidebar 
          settings={settings} 
          isDark={isDark} 
          toggleDark={() => setIsDark(!isDark)} 
          onLogout={() => { setIsAuth(false); localStorage.removeItem('isLoggedIn'); }} 
        />
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/new" element={<NewOrder />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
