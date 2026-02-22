import { ArrowLeft, ChevronRight, Zap, CheckCircle2, Moon, Sun, Bolt, Edit, Bell, Save, MinusCircle, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface UserStats {
  user_id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
}

export const SettingsView = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = useSettings();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  
  // Gemini API Key state
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState('');

  useEffect(() => {
    apiFetch('/api/user/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setEditedName(data?.registeredName || data?.name || '');
      });
    
    apiFetch('/api/user/gemini-key')
      .then(res => res.json())
      .then(data => {
        setHasGeminiKey(data.hasKey);
      });
  }, []);

  const handleSaveGeminiKey = async () => {
    setIsSavingKey(true);
    setKeySaveMessage('');
    try {
      const res = await apiFetch('/api/user/gemini-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: geminiKeyInput })
      });
      const data = await res.json();
      if (data.success) {
        setHasGeminiKey(data.hasKey);
        setKeySaveMessage(data.hasKey ? 'API key saved!' : 'API key removed');
        setGeminiKeyInput('');
        setTimeout(() => setKeySaveMessage(''), 3000);
      }
    } catch (error) {
      setKeySaveMessage('Failed to save');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    const res = await apiFetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editedName.trim(), avatar: stats?.avatar })
    });
    const updated = await res.json();
    setStats(updated);
    setIsEditingName(false);
  };

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
        <section className="bg-surface rounded-xl p-4 shadow-sm border border-line flex items-center gap-4 hover:bg-app transition-colors">
          <div className="relative shrink-0">
            <div className="h-16 w-16 rounded-full bg-slate-200 overflow-hidden ring-2 ring-line">
              <img src={stats?.avatar || `https://picsum.photos/seed/${(stats?.registeredName || stats?.name || 'user').toLowerCase().replace(/\s/g, '')}/100/100`} alt="Profile" className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 bg-app border border-line rounded-lg px-2 py-1 text-lg font-bold truncate focus:ring-2 focus:ring-primary/20 outline-none"
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="text-primary p-1">
                    <Save size={20} />
                  </button>
                  <button onClick={() => setIsEditingName(false)} className="text-muted p-1">
                    <MinusCircle size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold truncate">{stats?.registeredName || stats?.name || 'Guest User'}</h2>
                  <button onClick={() => setIsEditingName(true)} className="text-muted hover:text-primary transition-colors">
                    <Edit size={16} />
                  </button>
                </>
              )}
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
            </div>
            <p className="text-muted text-sm truncate">{stats?.email || 'Sign in to sync'}</p>
          </div>
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

        {/* AI Section */}
        <section>
          <h3 className="text-muted text-xs font-bold uppercase tracking-wider mb-3 ml-1">AI Features</h3>
          <div className="bg-surface rounded-xl p-4 shadow-sm border border-line">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                <Zap size={20} />
              </div>
              <div>
                <p className="font-bold text-base">Gemini API Key</p>
                <p className="text-xs text-muted">Required for AI features</p>
              </div>
              {hasGeminiKey && (
                <div className="ml-auto flex items-center gap-1 text-emerald-500 text-xs font-medium">
                  <CheckCircle2 size={14} />
                  <span>Connected</span>
                </div>
              )}
            </div>
            
            <p className="text-xs text-slate-500 mb-3">
              Enter your own Gemini API key to enable AI features like smart suggestions, node generation, and study planning.
            </p>
            
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mb-3 inline-block"
            >
              Get a free API key from Google AI Studio →
            </a>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder={hasGeminiKey ? '••••••••••••••••' : 'Enter your API key'}
                  className="w-full bg-app border border-line rounded-lg px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                onClick={handleSaveGeminiKey}
                disabled={isSavingKey || (!geminiKeyInput && !hasGeminiKey)}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isSavingKey ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
              </button>
            </div>
            
            {keySaveMessage && (
              <p className={cn("text-xs mt-2", keySaveMessage.includes('Failed') ? "text-red-500" : "text-emerald-500")}>
                {keySaveMessage}
              </p>
            )}
          </div>
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

