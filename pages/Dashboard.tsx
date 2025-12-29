
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import StatsCard from '../components/StatsCard';
import { getOrders } from '../services/mockData';
import { Order, OrderStatus } from '../types';
import { format, isToday, subDays, startOfDay } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
// Fix: Import getActiveSettings from constants
import { STATUS_COLORS, getActiveSettings } from '../constants';

interface DashboardProps {
  isDarkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isDarkMode }) => {
  // Fix: Define settings by calling getActiveSettings()
  const settings = getActiveSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('ordersUpdated', loadData);
    return () => window.removeEventListener('ordersUpdated', loadData);
  }, []);

  const todayOrders = orders.filter(o => isToday(new Date(o.createdAt)));
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PROCESSING);
  const overdueOrders = orders.filter(o => {
    const delivery = startOfDay(new Date(o.deliveryDate)).getTime();
    const todayStart = startOfDay(new Date()).getTime();
    return o.status !== OrderStatus.COMPLETED && delivery < todayStart;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalDue = orders.reduce((sum, o) => sum + o.due, 0);

  // Generate dynamic chart data for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(d).getTime();
    const dayEnd = dayStart + 86400000;
    
    const dayRevenue = orders
      .filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd)
      .reduce((sum, o) => sum + o.total, 0);
      
    return {
      name: format(d, 'EEE'),
      revenue: dayRevenue,
      date: format(d, 'dd MMM')
    };
  });

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight dark:text-white">Quick Statistics</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Monitoring {settings.name} performance</p>
        </div>
        <div className="text-right hidden sm:block">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CURRENT DATE</p>
           <p className="text-sm font-bold dark:text-gray-300">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          label="Today's Orders" 
          value={todayOrders.length} 
          icon={<ShoppingCart size={24} />} 
        />
        <StatsCard 
          label="Pending Tasks" 
          value={pendingOrders.length} 
          icon={<Clock size={24} />} 
          colorClass="bg-indigo-50 dark:bg-[#161b22]"
        />
        <StatsCard 
          label="Total Revenue" 
          value={`Rs ${totalRevenue.toLocaleString()}`} 
          icon={<TrendingUp size={24} />} 
        />
        <StatsCard 
          label="Outstanding Due" 
          value={`Rs ${totalDue.toLocaleString()}`} 
          icon={<AlertCircle size={24} />} 
          colorClass="bg-red-50 dark:bg-[#1c1111]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161b22] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-lg dark:text-white tracking-tight">Revenue Analysis (7 Days)</h3>
            <div className="px-3 py-1 bg-gray-50 dark:bg-[#0d1117] rounded-lg text-xs font-black text-gray-400 uppercase tracking-widest">Realtime Data</div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#21262d" : "#f1f5f9"} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: isDarkMode ? '#6b7280' : '#94a3b8', fontSize: 11, fontWeight: 700}} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: isDarkMode ? '#6b7280' : '#94a3b8', fontSize: 11, fontWeight: 700}} 
                  tickFormatter={(val) => `Rs ${val >= 1000 ? val/1000 + 'k' : val}`}
                />
                <Tooltip 
                  cursor={{fill: isDarkMode ? '#0d1117' : '#f8fafc', radius: 10}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-[#21262d] p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{payload[0].payload.date}</p>
                          <p className="text-lg font-black dark:text-white">Rs {payload[0].value.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" radius={[10, 10, 10, 10]} barSize={45}>
                  {last7Days.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#4f46e5' : isDarkMode ? '#30363d' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Required */}
        <div className="bg-white dark:bg-[#161b22] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <h3 className="font-black text-lg mb-6 flex items-center gap-3 dark:text-white tracking-tight">
            <AlertCircle className="text-red-500" size={22} />
            Immediate Action
          </h3>
          <div className="flex-1 space-y-4">
            {overdueOrders.length > 0 ? (
              overdueOrders.slice(0, 5).map(order => (
                <div key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="cursor-pointer block p-5 border rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 border-red-100 dark:border-red-900/30 bg-red-50/20 dark:bg-red-900/5 transition-all group active:scale-95">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-sm dark:text-white group-hover:text-red-600 transition-colors">{order.customerName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-bold">{order.invoiceNumber}</p>
                    </div>
                    <span className="text-[9px] uppercase font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-lg">Overdue</span>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">Delivery: {format(order.deliveryDate, 'dd MMM')}</span>
                    <span className="text-sm font-black text-red-600">Rs {order.due.toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-12">
                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-full mb-4">
                  <CheckCircle2 size={40} className="text-green-500" />
                </div>
                <p className="dark:text-white font-black text-lg">All Clear!</p>
                <p className="text-xs opacity-60">No overdue orders found.</p>
              </div>
            )}
          </div>
          <button onClick={() => navigate('/orders')} className="mt-6 w-full py-3 text-center text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
            VIEW ALL TASKS
          </button>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-[#161b22] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-black text-lg dark:text-white tracking-tight">Latest Bookings</h3>
          <button onClick={() => navigate('/orders')} className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline">VIEW FULL LIST</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-4">INVOICE</th>
                <th className="px-8 py-4">CUSTOMER</th>
                <th className="px-8 py-4">STATUS</th>
                <th className="px-8 py-4">DUE DATE</th>
                <th className="px-8 py-4 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {orders.slice(0, 5).map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-indigo-900/5 transition-all cursor-pointer group" onClick={() => navigate(`/orders/${order.id}`)}>
                  <td className="px-8 py-5 font-black text-indigo-600 dark:text-indigo-400 text-sm">{order.invoiceNumber}</td>
                  <td className="px-8 py-5">
                    <div className="text-sm">
                      <p className="font-black text-gray-900 dark:text-white">{order.customerName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-bold">{order.customerPhone}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border leading-none ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-gray-600 dark:text-gray-400">{format(order.deliveryDate, 'dd MMM yyyy')}</td>
                  <td className="px-8 py-5 text-sm font-black text-gray-900 dark:text-white text-right">Rs {order.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
