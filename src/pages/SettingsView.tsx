import { ArrowLeft, ChevronRight, Zap, CheckCircle2, Moon, Sun, Bolt, Edit, Bell, Save, MinusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export const SettingsView = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = useSettings();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-app text-main font-display">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-surface px-4 py-3 border-b border-line">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center text-primary active:opacity-70 transition-opacity p-2 -ml-2 rounded-full hover:bg-app"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-tight absolute left-1/2 -translate-x-1/2">Settings</h1>
        <button onClick={() => navigate(-1)} className="text-primary text-base font-semibold active:opacity-70 transition-opacity">Done</button>
      </header>

      <main className="flex-1 flex flex-col gap-6 p-4 pb-10 max-w-md mx-auto w-full">
        {/* Profile Section */}
        <section className="bg-surface rounded-xl p-4 shadow-sm border border-line flex items-center gap-4 cursor-pointer hover:bg-app transition-colors">
          <div className="relative shrink-0">
            <div className="h-16 w-16 rounded-full bg-slate-200 overflow-hidden ring-2 ring-line">
              <img src="https://picsum.photos/seed/alex/100/100" alt="Profile" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1 border-2 border-white dark:border-card-dark flex items-center justify-center">
              <Edit size={12} strokeWidth={3} />
            </div>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold truncate">{user?.name || 'Guest User'}</h2>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
            </div>
            <p className="text-muted text-sm truncate">{user?.email || 'Sign in to sync'}</p>
          </div>
          <button className="text-muted hover:text-primary transition-colors">
            <ChevronRight size={24} />
          </button>
        </section>

        {/* Appearance Section */}
        <section>
          <h3 className="text-muted text-xs font-bold uppercase tracking-wider mb-3 ml-1">Appearance</h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Theme: Calm Light */}
            <div 
              onClick={() => setTheme('calm')}
              className={cn(
                "group relative cursor-pointer flex flex-col gap-3 p-4 rounded-xl bg-surface border-2 transition-all shadow-sm ring-1 ring-line hover:ring-primary/50",
                theme === 'calm' ? "border-primary bg-primary/5" : "border-transparent"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-calm-blue flex items-center justify-center text-primary">
                    <Sun size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-base">Calm Light</p>
                    <p className="text-xs text-muted">Soft blue for daily study</p>
                  </div>
                </div>
                {theme === 'calm' && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
              {/* Theme Preview Strip */}
              <div className="h-8 w-full rounded-lg bg-app flex overflow-hidden border border-line">
                <div className="w-1/4 h-full bg-[#E3F2FD]"></div>
                <div className="w-1/4 h-full bg-white"></div>
                <div className="w-1/4 h-full bg-[#BBDEFB]"></div>
                <div className="w-1/4 h-full bg-[#308ce8]"></div>
              </div>
            </div>

            {/* Theme: Dark Focus */}
            <div 
              onClick={() => setTheme('dark')}
              className={cn(
                "group relative cursor-pointer flex flex-col gap-3 p-4 rounded-xl bg-surface border-2 transition-all shadow-sm ring-1 ring-line hover:ring-primary/50",
                theme === 'dark' ? "border-primary bg-primary/5" : "border-transparent"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-focus-dark flex items-center justify-center text-slate-200">
                    <Moon size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-base">Dark Focus</p>
                    <p className="text-xs text-muted">Deep charcoal for late nights</p>
                  </div>
                </div>
                {theme === 'dark' && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
              {/* Theme Preview Strip */}
              <div className="h-8 w-full rounded-lg bg-app flex overflow-hidden border border-line">
                <div className="w-1/4 h-full bg-[#263238]"></div>
                <div className="w-1/4 h-full bg-[#37474F]"></div>
                <div className="w-1/4 h-full bg-[#546E7A]"></div>
                <div className="w-1/4 h-full bg-[#78909C]"></div>
              </div>
            </div>

            {/* Theme: Exam Boost */}
            <div 
              onClick={() => setTheme('exam')}
              className={cn(
                "group relative cursor-pointer flex flex-col gap-3 p-4 rounded-xl bg-surface border-2 transition-all shadow-sm ring-1 ring-line hover:ring-primary/50",
                theme === 'exam' ? "border-primary bg-primary/5" : "border-transparent"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-exam-orange flex items-center justify-center text-orange-500">
                    <Bolt size={24} fill="currentColor" />
                  </div>
                  <div>
                    <p className="font-bold text-base">Exam Boost</p>
                    <p className="text-xs text-muted">High energy orange</p>
                  </div>
                </div>
                {theme === 'exam' && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
              {/* Theme Preview Strip */}
              <div className="h-8 w-full rounded-lg bg-app flex overflow-hidden border border-line">
                <div className="w-1/4 h-full bg-[#FFF3E0]"></div>
                <div className="w-1/4 h-full bg-[#FFE0B2]"></div>
                <div className="w-1/4 h-full bg-[#FFB74D]"></div>
                <div className="w-1/4 h-full bg-[#FF9800]"></div>
              </div>
            </div>
          </div>
        </section>

        {/* General Section */}
        <section>
          <h3 className="text-muted text-xs font-bold uppercase tracking-wider mb-3 ml-1">General</h3>
          <div className="bg-surface rounded-xl shadow-sm border border-line divide-y divide-line overflow-hidden">
            {/* Setting: Notifications */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Bell size={20} />
                </div>
                <span className="font-medium">Daily Reminders</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.notifications}
                  onChange={(e) => updateSetting('notifications', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Setting: Autosave */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Save size={20} />
                </div>
                <span className="font-medium">Auto-save Maps</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.autoSave}
                  onChange={(e) => updateSetting('autoSave', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Setting: Focus Mode */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <MinusCircle size={20} />
                </div>
                <span className="font-medium">Focus Mode</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.focusMode}
                  onChange={(e) => updateSetting('focusMode', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
          <p className="mt-2 ml-1 text-xs text-slate-400">Focus mode hides all UI elements except your map nodes.</p>
        </section>

        {/* Footer Actions */}
        <div className="mt-4 flex flex-col items-center gap-4">
          <button 
            onClick={handleLogout}
            className="w-full py-3 text-red-500 font-medium bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          >
            Log Out
          </button>
          <p className="text-xs text-slate-400 font-medium">Version 2.4.1 (Build 890)</p>
        </div>
      </main>
    </div>
  );
};

