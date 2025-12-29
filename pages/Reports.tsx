
import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  FileSpreadsheet, 
  Calendar, 
  TrendingUp, 
  Users, 
  Package,
  ArrowRight,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { getOrders } from '../services/mockData';
import { Order, OrderStatus } from '../types';
// Fix: Import date-fns functions correctly using subpath imports to resolve export issues
import { format, endOfMonth } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import isWithinInterval from 'date-fns/isWithinInterval';

const Reports: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await getOrders();
      setOrders(data);
      setLoading(false);
    };
    loadData();
  }, []);

  // Report calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const outstandingDues = orders.reduce((sum, o) => sum + o.due, 0);
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PROCESSING).length;
  
  const handleGenerateReport = (type: string) => {
    alert(`Generating ${type}... The report will be ready in a moment.`);
  };

  const handlePreviewReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const filtered = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return isWithinInterval(orderDate, { 
          start: new Date(startDate), 
          end: new Date(endDate) 
        });
      });
      alert(`Report generated for ${filtered.length} orders within the selected range.`);
    }, 1500);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black dark:text-white tracking-tighter">Business Reports</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Analyze performance and export business data.</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl font-black text-xs hover:bg-gray-50 dark:hover:bg-[#21262d] dark:text-white transition-all shadow-sm">
             <Printer size={18} /> PRINT ALL
           </button>
           <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
             <Download size={18} /> EXPORT CSV
           </button>
        </div>
      </div>

      {/* Main Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sales Summary */}
        <div className="bg-white dark:bg-[#161b22] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:border-indigo-500/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="w-14 h-14 bg-gray-50 dark:bg-[#0d1117] rounded-2xl flex items-center justify-center mb-6 border border-gray-100 dark:border-gray-800">
            <FileSpreadsheet className="text-indigo-600 dark:text-indigo-400" size={28} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Sales Summary</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Total orders and revenue trends per month</p>
          <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800/50">
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TOTAL REVENUE</p>
                   <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">Rs {totalRevenue.toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => handleGenerateReport('Sales Summary')}
                  className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform uppercase tracking-widest flex items-center gap-2"
                >
                  Generate Report <ArrowRight size={14} />
                </button>
             </div>
          </div>
        </div>

        {/* Outstanding Dues */}
        <div className="bg-white dark:bg-[#161b22] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:border-red-500/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="w-14 h-14 bg-gray-50 dark:bg-[#0d1117] rounded-2xl flex items-center justify-center mb-6 border border-gray-100 dark:border-gray-800">
            <Calendar className="text-red-600 dark:text-red-400" size={28} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Outstanding Dues</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">List of all customers with unpaid balances</p>
          <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800/50">
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TOTAL RECEIVABLE</p>
                   <p className="text-2xl font-black text-red-600 dark:text-red-400">Rs {outstandingDues.toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => handleGenerateReport('Dues Report')}
                  className="text-[11px] font-black text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform uppercase tracking-widest flex items-center gap-2"
                >
                  Generate Report <ArrowRight size={14} />
                </button>
             </div>
          </div>
        </div>

        {/* Inventory Usage */}
        <div className="bg-white dark:bg-[#161b22] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:border-green-500/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="w-14 h-14 bg-gray-50 dark:bg-[#0d1117] rounded-2xl flex items-center justify-center mb-6 border border-gray-100 dark:border-gray-800">
            <FileSpreadsheet className="text-green-600 dark:text-green-400" size={28} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Inventory Usage</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Most popular printing items and variants</p>
          <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800/50">
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ACTIVE TASKS</p>
                   <p className="text-2xl font-black text-green-600 dark:text-green-400">{pendingOrders} Orders</p>
                </div>
                <button 
                  onClick={() => handleGenerateReport('Inventory Report')}
                  className="text-[11px] font-black text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform uppercase tracking-widest flex items-center gap-2"
                >
                  Generate Report <ArrowRight size={14} />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Custom Report Generator Section */}
      <div className="bg-white dark:bg-[#161b22] p-12 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-500/5 pointer-events-none"></div>
         
         <div className="max-w-2xl mx-auto space-y-8 relative z-10 text-center">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-[#0d1117] rounded-[2rem] flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
              <FileText size={48} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-3xl font-black dark:text-white tracking-tight">Custom Report Generator</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Select a specific date range and filters to generate a deep-dive business intelligence report.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
               <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">START DATE</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#0d1117] border border-gray-100 dark:border-gray-800 rounded-2xl dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm" 
                    />
                  </div>
               </div>
               <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">END DATE</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#0d1117] border border-gray-100 dark:border-gray-800 rounded-2xl dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm" 
                    />
                  </div>
               </div>
            </div>

            <button 
              onClick={handlePreviewReport}
              disabled={isGenerating}
              className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Clock size={20} className="animate-spin" />
                  ANALYZING DATA...
                </>
              ) : (
                <>
                  <TrendingUp size={20} />
                  Preview Business Report
                </>
              )}
            </button>
            
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-50">
              Generated reports include PDF summaries and raw transaction data
            </p>
         </div>
      </div>
    </div>
  );
};

export default Reports;
