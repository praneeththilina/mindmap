import { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Flame, Loader2, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { cn } from '../lib/utils';
import type { UserStats } from '../types';

interface LeaderboardEntry extends UserStats {
  name: string;
  avatar: string;
}

export const Ranks = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, leaderboardRes] = await Promise.all([
          fetch('/api/user/stats'),
          fetch('/api/leaderboard')
        ]);
        const statsData = await statsRes.json();
        const leaderboardData = await leaderboardRes.json();
        setStats(statsData);
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-app">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const myRank = leaderboard.findIndex(u => u.user_id === 'user_1') + 1;
  const nextUser = myRank > 1 ? leaderboard[myRank - 2] : null;
  const xpToNext = nextUser ? nextUser.xp - (stats?.xp || 0) : 0;

  const weekDays = [
    { label: 'M', active: true },
    { label: 'T', active: true },
    { label: 'W', active: true },
    { label: 'T', active: true },
    { label: 'F', active: true },
    { label: 'S', active: true, today: true },
    { label: 'S', active: false },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-app text-main font-display antialiased">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 pt-14 pb-4 bg-app/95 backdrop-blur-sm border-b border-line">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
        >
          <ArrowLeft size={20} className="text-muted" />
        </button>
        <h1 className="text-lg font-bold">Leaderboard</h1>
        <button 
          onClick={() => navigate('/settings')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
        >
          <Settings size={20} className="text-muted" />
        </button>
      </header>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="px-4 space-y-6 pt-4">
          {/* Streak Section */}
          <section className="bg-surface rounded-2xl p-5 shadow-sm border border-line">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-streak-orange/10 text-streak-orange text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Daily Streak</span>
                </div>
                <h2 className="text-2xl font-bold leading-tight">You're on fire, {stats?.name || 'Alex'}! <br/><span className="text-streak-orange">{stats?.streak || 0} Days Strong 🔥</span></h2>
              </div>
              <div className="w-12 h-12 bg-streak-orange/10 rounded-full flex items-center justify-center">
                <Flame size={30} className="text-streak-orange" fill="currentColor" />
              </div>
            </div>
            {/* Calendar Row */}
            <div className="flex justify-between items-center pt-2">
              {weekDays.map((day, i) => (
                <div key={i} className={cn("flex flex-col items-center gap-2", !day.active && "opacity-50")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    day.active ? "bg-streak-orange/10 text-streak-orange" : "bg-app text-muted",
                    day.today && "ring-2 ring-streak-orange ring-offset-2 dark:ring-offset-slate-900"
                  )}>
                    <Flame size={16} fill={day.active ? "currentColor" : "none"} />
                  </div>
                  <span className={cn("text-[10px] font-bold", day.today ? "text-main" : "text-muted")}>{day.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Leaderboard Tabs */}
          <div className="bg-app p-1 rounded-xl flex gap-1 border border-line">
            <button 
              onClick={() => setActiveTab('global')}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200",
                activeTab === 'global' ? "bg-surface shadow-sm text-primary" : "text-muted hover:bg-surface/50"
              )}
            >
              Global
            </button>
            <button 
              onClick={() => setActiveTab('friends')}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200",
                activeTab === 'friends' ? "bg-surface shadow-sm text-primary" : "text-muted hover:bg-surface/50"
              )}
            >
              Friends
            </button>
          </div>

          {/* Leaderboard List */}
          <div className="space-y-3 pb-6">
            {leaderboard.map((user, index) => {
              const rank = index + 1;
              const isMe = user.user_id === 'user_1';
              const emoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank.toString();
              
              const roles: Record<string, string> = {
                'user_2': 'Mind Master',
                'user_3': 'Note Ninja',
                'user_4': 'Flashcard Pro'
              };

              return (
                <div key={user.user_id} className={cn(
                  "flex items-center p-3 rounded-xl border shadow-sm relative overflow-hidden transition-all",
                  rank === 1 ? "bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-900/10 dark:to-surface border-yellow-100 dark:border-yellow-900/20" : 
                  rank === 2 ? "bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/30 dark:to-surface border-line" :
                  rank === 3 ? "bg-gradient-to-r from-orange-50 to-white dark:from-orange-900/10 dark:to-surface border-orange-100 dark:border-orange-900/20" :
                  "bg-surface border-line",
                  isMe && "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-950"
                )}>
                  {rank <= 3 && (
                    <div className={cn(
                      "absolute right-0 top-0 w-16 h-16 bg-gradient-to-br rounded-bl-full pointer-events-none opacity-20",
                      rank === 1 ? "from-yellow-400" : rank === 2 ? "from-slate-400" : "from-orange-400"
                    )}></div>
                  )}
                  <div className="w-8 flex-shrink-0 flex justify-center font-bold text-muted">
                    {rank <= 3 ? <span className="text-2xl">{emoji}</span> : <span className="text-sm">{rank}</span>}
                  </div>
                  <div className="relative ml-2 mr-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full bg-app overflow-hidden border-2 shadow-sm",
                      rank === 1 ? "border-yellow-400" : rank === 2 ? "border-slate-300" : rank === 3 ? "border-orange-300" : "border-transparent"
                    )}>
                      <img src={user.avatar || `https://picsum.photos/seed/${user.user_id}/100/100`} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("font-bold truncate text-sm", isMe && "text-primary")}>{user.name} {isMe && "(You)"}</h3>
                    {roles[user.user_id] ? (
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        rank === 1 ? "text-yellow-600 dark:text-yellow-500" : 
                        rank === 3 ? "text-orange-600 dark:text-orange-500" : "text-muted"
                      )}>
                        {roles[user.user_id]}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted font-medium uppercase">Level {user.level}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-main tabular-nums">{user.xp.toLocaleString()}</p>
                    <p className="text-[10px] text-muted uppercase tracking-wide font-medium">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Floating Sticky User Rank Footer */}
      <div className="fixed bottom-[88px] left-0 right-0 px-4 z-20">
        <div className="bg-surface rounded-xl shadow-lg border border-line p-3 flex items-center relative overflow-hidden">
          {/* Progress Background Bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-app w-full">
            <div 
              className="h-full bg-primary rounded-r-full transition-all duration-1000" 
              style={{ width: `${(stats?.xp || 0) % 1000 / 10}%` }}
            ></div>
          </div>
          <div className="w-10 flex-shrink-0 flex justify-center items-center flex-col">
            <span className="text-[10px] text-muted font-semibold mb-0.5">Rank</span>
            <span className="text-lg font-bold text-primary">#{myRank}</span>
          </div>
          <div className="ml-3 mr-3 relative">
            <div className="w-10 h-10 rounded-full bg-app overflow-hidden ring-2 ring-primary ring-offset-2 ring-offset-surface">
              <img src={stats?.avatar || "https://picsum.photos/seed/alex/100/100"} alt="Me" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-surface"></div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex justify-between items-end">
              <h3 className="font-bold text-main truncate text-sm">You (Alex)</h3>
              <span className="text-xs font-semibold text-muted">{stats?.xp.toLocaleString()} XP</span>
            </div>
            {xpToNext > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-primary font-medium">{xpToNext.toLocaleString()} XP to rank #{myRank - 1}</span>
                <ArrowUp size={10} className="text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav active="ranks" />
    </div>
  );
};
