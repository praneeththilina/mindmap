import { Link } from 'react-router-dom';
import { LayoutGrid, BookOpen, Trophy, Settings, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export const BottomNav = ({ active }: { active: string }) => (
  <nav className="fixed bottom-0 w-full bg-surface/95 backdrop-blur-xl border-t border-line z-50 pb-safe transition-colors duration-300">
    <div className="flex justify-around items-center h-16 px-2">
      <Link to="/" className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors", active === 'home' ? "text-primary" : "text-muted hover:text-main")}>
        <LayoutGrid size={24} />
        <span className="text-[10px] font-medium">Home</span>
      </Link>
      <Link to="/library" className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors", active === 'library' ? "text-primary" : "text-muted hover:text-main")}>
        <BookOpen size={24} />
        <span className="text-[10px] font-medium">Library</span>
      </Link>
      <Link to="/schedule" className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors", active === 'schedule' ? "text-primary" : "text-muted hover:text-main")}>
        <div className="relative">
          <Calendar size={24} className={active === 'schedule' ? "fill-primary/20" : ""} />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
        </div>
        <span className="text-[10px] font-medium">Schedule</span>
      </Link>
      <Link to="/ranks" className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors", active === 'ranks' ? "text-primary" : "text-muted hover:text-main")}>
        <Trophy size={24} />
        <span className="text-[10px] font-medium">Ranks</span>
      </Link>
      <Link to="/settings" className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors", active === 'settings' ? "text-primary" : "text-muted hover:text-main")}>
        <Settings size={24} />
        <span className="text-[10px] font-medium">Settings</span>
      </Link>
    </div>
  </nav>
);
