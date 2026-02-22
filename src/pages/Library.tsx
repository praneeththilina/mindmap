import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoreHorizontal, Search, BookOpen, History as HistoryIcon, Star, Clock, Plus } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { CreateMapModal } from '../components/CreateMapModal';
import type { Map } from '../types';

export const Library = () => {
  const navigate = useNavigate();
  const [maps, setMaps] = useState<Map[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/maps').then(res => res.json()).then(setMaps);
  }, []);

  const handleMapCreated = (mapId: string) => {
    navigate(`/map/${mapId}`);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-app text-main font-display">
      <header className="bg-surface px-5 pb-4 pt-12 sticky top-0 z-10 shadow-sm border-b border-line">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Library</h1>
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-primary">
            <MoreHorizontal size={24} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input className="block w-full pl-10 pr-3 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm placeholder-slate-500 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Search topics..." type="text" />
          </div>
        </div>
      </header>

      <main className="p-5 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Folders</h2>
            <button className="text-xs font-medium text-primary">See All</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface p-4 rounded-2xl border border-line shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-primary">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-medium">Science</h3>
                <p className="text-xs text-muted">12 items</p>
              </div>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-line shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
                <HistoryIcon size={20} />
              </div>
              <div>
                <h3 className="font-medium">History</h3>
                <p className="text-xs text-muted">8 items</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Recent Maps</h2>
          <div className="space-y-4">
            {maps.map(map => (
              <Link key={map.id} to={`/map/${map.id}`} className="bg-surface rounded-2xl p-3 border border-line shadow-sm flex gap-4 hover:shadow-md transition-shadow">
                <div className="w-24 h-24 rounded-xl bg-app flex-shrink-0 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${map.id}/200/200`} alt={map.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold leading-tight">{map.title}</h3>
                      <Star size={18} className="text-line" />
                    </div>
                    <p className="text-sm text-muted mt-1">Biology • {map.node_count || 0} nodes</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Clock size={14} />
                    <span>Edited {new Date(map.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <button 
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-40"
      >
        <Plus size={32} />
      </button>

      <CreateMapModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreated={handleMapCreated} 
      />

      <BottomNav active="library" />
    </div>
  );
};
