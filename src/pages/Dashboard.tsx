import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Calendar, Network, TrendingUp, Plus, Users, Share2, Lock, CheckCircle, PieChart, GraduationCap } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import type { UserStats, Map } from '../types';
import { cn } from '../lib/utils';

import { DashboardHeader } from '../components/DashboardHeader';
import { CreateMapModal } from '../components/CreateMapModal';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentMaps, setRecentMaps] = useState<Map[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, mapsRes] = await Promise.all([
        fetch('/api/user/stats'),
        fetch('/api/maps')
      ]);
      const statsData = await statsRes.json();
      const mapsData = await mapsRes.json();
      setStats(statsData);
      setRecentMaps(mapsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMapCreated = (mapId: string) => {
    navigate(`/map/${mapId}`);
  };

  const overallMastery = recentMaps.length > 0 
    ? Math.round(recentMaps.reduce((acc, map) => acc + (map.mastery_percentage || 0), 0) / recentMaps.length)
    : 0;

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-app text-main font-display transition-colors duration-300">
      <DashboardHeader 
        stats={stats} 
        onRefresh={fetchData} 
        isRefreshing={isRefreshing} 
      />

      <main className="px-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
        {/* Mastery Overview Section */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-surface rounded-3xl p-5 border border-line shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            <div className="relative mb-3">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={213.6}
                  strokeDashoffset={213.6 - (213.6 * overallMastery) / 100}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-main">{overallMastery}%</span>
              </div>
            </div>
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Overall Mastery</h3>
          </div>

          <div className="bg-surface rounded-3xl p-5 border border-line shadow-sm flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <TrendingUp size={20} className="text-emerald-500" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">+12%</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-main tabular-nums">{stats?.xp.toLocaleString() || 0}</p>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Total XP</p>
            </div>
          </div>
        </section>

        {/* Study Plan Card */}
        {recentMaps.length > 0 ? (
          <section 
            onClick={() => navigate(`/map/${recentMaps[0].id}`)}
            className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-800/50 rounded-3xl p-6 border border-blue-100 dark:border-slate-700 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
          >
            <div className="absolute right-0 top-0 w-40 h-40 bg-blue-100 dark:bg-blue-500/10 rounded-full -mr-12 -mt-12 blur-3xl opacity-60"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">Today's Study Plan</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Continue where you left off</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/schedule'); }}
                  className="text-primary bg-white dark:bg-slate-700 p-2 rounded-xl shadow-sm hover:shadow border border-slate-100 dark:border-slate-600 transition-all"
                >
                  <Calendar size={20} />
                </button>
              </div>
              <div className="bg-white dark:bg-slate-700/50 rounded-xl p-3 mb-3 border border-slate-100 dark:border-slate-600 shadow-sm flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Network size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{recentMaps[0].title}</h3>
                  <div className="w-full bg-slate-100 dark:bg-slate-600 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${recentMaps[0].mastery_percentage || 0}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary whitespace-nowrap">{Math.round(recentMaps[0].mastery_percentage || 0)}%</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200 dark:shadow-none">
                  Resume Session
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/schedule'); }}
                  className="px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  Schedule
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
          >
            <div className="relative z-10 text-center py-4">
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2">No Study Maps Yet</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Create your first map to start your study plan!</p>
              <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-sm">
                <Plus size={18} />
                Create First Map
              </button>
            </div>
          </section>
        )}

        {/* Recent Maps */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-main">Recent Maps</h3>
            <Link to="/library" className="text-primary text-sm font-medium hover:text-blue-600">See All</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar snap-x">
            {recentMaps.map((map, i) => {
              const styles = [
                { bg: 'bg-slate-100 dark:bg-slate-700', icon: Users, color: 'text-primary', badge: 'bg-surface/90', iconColor: 'text-primary' },
                { bg: 'bg-amber-50 dark:bg-slate-700', icon: Share2, color: 'text-amber-600', badge: 'bg-surface/90', iconColor: 'text-amber-600' },
                { bg: 'bg-indigo-50 dark:bg-slate-700', icon: Lock, color: 'text-indigo-600', badge: 'bg-surface/90', iconColor: 'text-indigo-600' },
              ];
              const style = styles[i % styles.length];
              const Icon = style.icon;
              
              return (
                <Link key={map.id} to={`/map/${map.id}`} className="snap-center shrink-0 w-44 bg-surface rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-line overflow-hidden flex flex-col group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className={cn("h-28 relative overflow-hidden", style.bg)}>
                    <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity z-10", i % 3 === 0 ? "bg-primary/10" : i % 3 === 1 ? "bg-amber-500/10" : "bg-indigo-500/10")}></div>
                    <img className="w-full h-full object-cover mix-blend-overlay opacity-80" src={`https://picsum.photos/seed/${map.id}/200/150`} alt={map.title} />
                    <div className="absolute top-2 right-2 z-20">
                      <span className={cn("backdrop-blur-sm p-1 rounded-full shadow-sm block", style.badge)}>
                        <Icon size={14} className={style.iconColor} />
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col h-full justify-between">
                    <div className="mb-3">
                      <h4 className="font-bold text-main text-sm leading-snug mb-1 truncate">{map.title}</h4>
                      <div className="flex items-center gap-1">
                        {map.mastery_percentage && map.mastery_percentage > 50 ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <PieChart size={14} className="text-amber-500" />
                        )}
                        <span className={cn("text-xs font-semibold", map.mastery_percentage && map.mastery_percentage > 50 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400")}>
                          {Math.round(map.mastery_percentage || 0)}% Mastered
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted font-medium border-t border-line pt-2">
                      <span>{map.node_count || 0} nodes</span>
                      <span>{new Date(map.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
            {recentMaps.length === 0 && (
              <div className="w-full text-center py-8 text-muted text-sm">
                No maps yet. Tap + to create one!
              </div>
            )}
          </div>
        </section>

        {/* Activity Log */}
        <section className="mb-24">
          <div className="bg-surface rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-line p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-main">Activity Log</h3>
                <p className="text-xs text-muted mt-1">Goal: 2 hours/day</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-bold bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg">
                  <TrendingUp size={16} />
                  <span>+12%</span>
                </div>
                <span className="text-[10px] text-muted mt-1">vs last week</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end h-28 px-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                  const heights = [30, 45, 65, 85, 20, 0, 0];
                  const isToday = i === 3; // Thursday
                  const height = heights[i];
                  
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer w-full relative">
                      {isToday && (
                        <div className="absolute -top-8 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-1 z-10 whitespace-nowrap">2h 15m</div>
                      )}
                      <div className={cn(
                        "relative w-2 rounded-full h-full overflow-hidden",
                        isToday ? "bg-slate-100 dark:bg-slate-700 ring-4 ring-primary/10 dark:ring-primary/20" : "bg-slate-100 dark:bg-slate-700"
                      )}>
                        <div 
                          className={cn(
                            "absolute bottom-0 w-full rounded-full transition-all duration-300",
                            isToday 
                              ? "bg-primary shadow-[0_0_12px_rgba(19,127,236,0.5)]" 
                              : i === 2 ? "bg-teal-400 dark:bg-teal-600 group-hover:bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]"
                              : "bg-slate-300 dark:bg-slate-600 group-hover:bg-primary/50"
                          )}
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                      <span className={cn("text-[10px] font-semibold", isToday ? "text-primary font-bold" : "text-muted")}>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-primary hover:bg-blue-600 text-white shadow-[0_4px_14px_rgba(19,127,236,0.4)] transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={32} />
        </button>
      </div>

      <CreateMapModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreated={handleMapCreated} 
      />

      <BottomNav active="home" />
    </div>
  );
};
