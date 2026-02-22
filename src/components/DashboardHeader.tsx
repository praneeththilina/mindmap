import { Flame, RefreshCw } from 'lucide-react';
import type { UserStats } from '../types';
import { cn } from '../lib/utils';

interface DashboardHeaderProps {
  stats: UserStats | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const DashboardHeader = ({ stats, onRefresh, isRefreshing }: DashboardHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning,";
    if (hour >= 12 && hour < 17) return "Good Afternoon,";
    if (hour >= 17 && hour < 22) return "Good Evening,";
    return "Good Night,";
  };

  return (
    <header className="flex items-center justify-between px-6 pt-12 pb-6 bg-app sticky top-0 z-30">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-muted text-sm font-medium">{getGreeting()}</span>
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400 hover:text-primary",
              isRefreshing && "animate-spin text-primary"
            )}
            title="Refresh Stats"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-main tracking-tight">{stats?.registeredName || stats?.name || 'Guest'}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-800/30">
          <Flame size={18} className="text-orange-500" fill="currentColor" />
          <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">{stats?.streak || 0}</span>
        </div>
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-surface shadow-sm">
            <img src={stats?.avatar || `https://picsum.photos/seed/${(stats?.registeredName || stats?.name || 'user').toLowerCase().replace(/\s/g, '')}/100/100`} alt="Profile" className="h-full w-full object-cover" />
          </div>
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-surface"></div>
        </div>
      </div>
    </header>
  );
};
