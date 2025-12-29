
import React, { useState, useRef } from 'react';
import { Save, Globe, MapPin, Phone, Mail, Image as ImageIcon, CheckCircle2, Upload } from 'lucide-react';
import { DEFAULT_SHOP_SETTINGS } from '../constants';
import { ShopSettings } from '../types';

const Settings: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem('shopSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SHOP_SETTINGS;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Explicitly update localStorage
    try {
      localStorage.setItem('shopSettings', JSON.stringify(settings));
      
      // Simulate network delay for UX feedback
      setTimeout(() => {
        setIsSaving(false);
        setShowSuccess(true);
        
        // Notify other components (like Layout) that settings have changed
        window.dispatchEvent(new Event('shopSettingsChanged'));
        
        setTimeout(() => setShowSuccess(false), 3000);
      }, 600);
    } catch (error) {
      console.error("Failed to save settings", error);
      setIsSaving(false);
      alert("Error saving settings. Please check if your browser allows local storage.");
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Shop Settings</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage your business profile and invoice branding.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`group flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
            showSuccess 
              ? 'bg-green-600 text-white shadow-green-500/20' 
              : 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700'
          } ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : showSuccess ? (
            <CheckCircle2 size={20} className="animate-in zoom-in duration-300" />
          ) : (
            <Save size={20} className="group-hover:scale-110 transition-transform" />
          )}
          {isSaving ? 'Saving...' : showSuccess ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
            <h3 className="font-bold border-b dark:border-gray-800 pb-4 dark:text-white uppercase text-xs tracking-widest text-gray-400">Business Profile</h3>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Shop Name</label>
                <div className="relative group">
                   <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none z-10">
                     <Globe size={18} />
                   </div>
                   <input 
                    type="text" 
                    value={settings.name}
                    onChange={(e) => setSettings({...settings, name: e.target.value})}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold text-sm"
                    placeholder="Enter shop name"
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none z-10">
                      <Phone size={18} />
                    </div>
                    <input 
                      type="text" 
                      value={settings.phone}
                      onChange={(e) => setSettings({...settings, phone: e.target.value})}
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold text-sm"
                      placeholder="0300-1234567"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none z-10">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      value={settings.email}
                      onChange={(e) => setSettings({...settings, email: e.target.value})}
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold text-sm"
                      placeholder="contact@shop.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Physical Address</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-4 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none z-10">
                    <MapPin size={18} />
                  </div>
                  <textarea 
                    value={settings.address}
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    rows={3}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none font-semibold text-sm"
                    placeholder="Shop address..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
            <h3 className="font-bold border-b dark:border-gray-800 pb-4 dark:text-white uppercase text-xs tracking-widest text-gray-400">Invoice Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Invoice Prefix</label>
                <input 
                  type="text" 
                  value={settings.invoicePrefix}
                  onChange={(e) => setSettings({...settings, invoicePrefix: e.target.value})}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                  placeholder="e.g. QP-2024-"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Tax Rate (%)</label>
                <input 
                  type="number" 
                  value={settings.taxRate}
                  onChange={(e) => setSettings({...settings, taxRate: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-center space-y-4">
              <h3 className="font-bold border-b dark:border-gray-800 pb-4 text-left dark:text-white uppercase text-xs tracking-widest text-gray-400">Shop Logo</h3>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              
              <div 
                onClick={handleLogoClick}
                className="w-full aspect-square max-w-[180px] bg-gray-50 dark:bg-gray-800/30 rounded-3xl mx-auto flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 group hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer overflow-hidden relative"
              >
                {settings.logoUrl ? (
                  <>
                    <img src={settings.logoUrl} alt="Shop Logo" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                       <Upload size={24} className="mb-1" />
                       <span className="text-[10px] font-black uppercase">Change Logo</span>
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon size={32} className="mb-2 group-hover:scale-110 transition-transform group-hover:text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Upload Logo</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight px-4">Recommended size: 512x512px. JPG, PNG or WebP supported.</p>
           </div>
           
           <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/20 space-y-4">
              <h3 className="font-black text-indigo-900 dark:text-indigo-100 uppercase text-xs tracking-widest">Need Help?</h3>
              <p className="text-[13px] text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed font-medium">If you want to add more users (staff) or change business currency, please contact technical support.</p>
              <button className="w-full py-3 bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-700 transition-all shadow-sm border border-indigo-100 dark:border-transparent">Contact Support</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
