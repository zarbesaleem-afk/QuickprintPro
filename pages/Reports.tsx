import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  FileSpreadsheet, 
  Calendar, 
  TrendingUp, 
  FileText
} from 'lucide-react';
import { getOrders } from '../services/mockData';
import { Order, OrderStatus } from '../types';
import { format } from 'date-fns';

const Reports: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
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

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const outstandingDues = orders.reduce((sum, o) => sum + o.due, 0);
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PROCESSING).length;
  
  const handlePreviewReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const filtered = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return orderDate >= start && orderDate <= end;
      });
      alert(`Report generated for ${filtered.length} orders.`);
    }, 1500);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black dark:text-white tracking-tighter">Business Reports</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Analyze performance and export data.</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl font-black text-xs">
             <Printer size={18} /> PRINT ALL
           </button>
           <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs">
             <Download size={18} /> EXPORT CSV
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-[#161b22] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <FileSpreadsheet className="text-indigo-600 dark:text-indigo-400 mb-6" size={28} />
          <h3 className="text-xl font-black dark:text-white">Sales Summary</h3>
          <p className="text-sm text-gray-500 mt-2">Revenue trends per month</p>
          <div className="mt-8 pt-6 border-t dark:border-gray-800">
             <p className="text-[10px] font-black text-gray-400 uppercase">TOTAL REVENUE</p>
             <p className="text-2xl font-black text-indigo-600">Rs {totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161b22] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <Calendar className="text-red-600 dark:text-red-400 mb-6" size={28} />
          <h3 className="text-xl font-black dark:text-white">Outstanding Dues</h3>
          <p className="text-sm text-gray-500 mt-2">Unpaid balances</p>
          <div className="mt-8 pt-6 border-t dark:border-gray-800">
             <p className="text-[10px] font-black text-gray-400 uppercase">RECEIVABLE</p>
             <p className="text-2xl font-black text-red-600">Rs {outstandingDues.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161b22] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <TrendingUp className="text-green-600 dark:text-green-400 mb-6" size={28} />
          <h3 className="text-xl font-black dark:text-white">Active Tasks</h3>
          <p className="text-sm text-gray-500 mt-2">Orders in progress</p>
          <div className="mt-8 pt-6 border-t dark:border-gray-800">
             <p className="text-[10px] font-black text-gray-400 uppercase">TOTAL JOBS</p>
             <p className="text-2xl font-black text-green-600">{pendingOrders} Orders</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#161b22] p-12 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl relative">
         <div className="max-w-2xl mx-auto space-y-8 text-center">
            <FileText size={48} className="text-indigo-600 mx-auto" />
            <h3 className="text-3xl font-black dark:text-white">Custom Report Generator</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
               <div className="text-left">
                  <label className="text-xs font-black text-gray-400 uppercase">START DATE</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-[#0d1117] border rounded-2xl dark:text-white outline-none" 
                  />
               </div>
               <div className="text-left">
                  <label className="text-xs font-black text-gray-400 uppercase">END DATE</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-[#0d1117] border rounded-2xl dark:text-white outline-none" 
                  />
               </div>
            </div>
            <button 
              onClick={handlePreviewReport}
              disabled={isGenerating}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-50"
            >
              {isGenerating ? 'ANALYZING DATA...' : 'Preview Business Report'}
            </button>
         </div>
      </div>
    </div>
  );
};

export default Reports;