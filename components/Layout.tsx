
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListOrdered, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  Printer,
  Moon,
  Sun
} from 'lucide-react';
import { getActiveSettings } from '../constants';
import { getOrders } from '../services/mockData';
import { OrderStatus } from '../types';
import { isToday } from 'date-fns';

interface LayoutProps {
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout, isDarkMode, toggleDarkMode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settings, setSettings] = useState(getActiveSettings());
  const [counts, setCounts] = useState({ total: 0, active: 0, todayCompleted: 0 });
  const location = useLocation();
  const navigate = useNavigate();

  const loadCounts = async () => {
    const orders = await getOrders();
    const active = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PROCESSING).length;
    const completedToday = orders.filter(o => o.status === OrderStatus.COMPLETED && isToday(new Date(o.updatedAt))).length;
    setCounts({ total: orders.length, active, todayCompleted: completedToday });
  };

  useEffect(() => {
    loadCounts();
    const handleSettingsChange = () => setSettings(getActiveSettings());
    const handleOrdersChange = () => loadCounts();

    window.addEventListener('shopSettingsChanged', handleSettingsChange);
    window.addEventListener('ordersUpdated', handleOrdersChange);
    
    return () => {
      window.removeEventListener('shopSettingsChanged', handleSettingsChange);
      window.removeEventListener('ordersUpdated', handleOrdersChange);
    };
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/orders/new', label: 'New Order', icon: <PlusCircle size={20} /> },
    { 
      path: '/orders', 
      label: 'All Orders', 
      icon: <ListOrdered size={20} />,
      badge: counts.active > 0 ? counts.active : null 
    },
    { path: '/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  const closeSidebar = () => setIsSidebarOpen(false);
  const shopInitials = settings.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#161b22] border-r border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer" onClick={() => navigate('/')}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-xl shadow-sm" />
            ) : (
              <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/20">
                <Printer size={22} />
              </div>
            )}
            <h1 className="text-lg font-black tracking-tighter text-gray-900 dark:text-white truncate">{settings.name || 'QuickPrint PK'}</h1>
          </div>

          <nav className="flex-1 p-4 space-y-1 mt-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`
                  relative flex items-center justify-between px-4 py-3 rounded-xl transition-all group
                  ${location.pathname === item.path 
                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'}
                `}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm tracking-tight">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${location.pathname === item.path ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all text-sm font-bold"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-3">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Today's Progress</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-green-500 transition-all duration-1000" 
                        style={{ width: `${counts.total > 0 ? (counts.todayCompleted / counts.total) * 100 : 0}%` }}
                       />
                    </div>
                    <span className="text-xs font-black dark:text-gray-300">{counts.todayCompleted}/{counts.total} Done</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button 
              onClick={toggleDarkMode}
              className="p-2.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
             >
                {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />}
             </button>

             <div className="hidden md:block text-right">
                <p className="text-sm font-black dark:text-gray-200">Shop Admin</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">Online</p>
             </div>
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black border-2 border-white dark:border-gray-800 shadow-lg cursor-pointer" onClick={() => navigate('/settings')}>
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  shopInitials
                )}
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
