import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoreHorizontal, Search, BookOpen, History as HistoryIcon, Star, Clock, Plus, Edit, Trash2, Folder as FolderIcon, X, ChevronRight } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { CreateMapModal } from '../components/CreateMapModal';
import { EditMapModal } from '../components/EditMapModal';
import { apiFetch } from '../lib/api';
import type { Map, Folder } from '../types';

const FOLDER_COLORS = [
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  { name: 'Green', value: '#22c55e', bg: 'bg-green-50 dark:bg-green-900/30' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  { name: 'Red', value: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/30' },
  { name: 'Yellow', value: '#eab308', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
];

export const Library = () => {
  const navigate = useNavigate();
  const [maps, setMaps] = useState<Map[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMap, setEditingMap] = useState<Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState(FOLDER_COLORS[0].value);

  useEffect(() => {
    fetchFolders();
    fetchMaps();
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await apiFetch('/api/folders');
      const data = await res.json();
      setFolders(data);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const fetchMaps = async () => {
    try {
      const res = await apiFetch('/api/maps');
      const data = await res.json();
      setMaps(data);
    } catch (error) {
      console.error('Failed to fetch maps:', error);
    }
  };

  useEffect(() => {
    fetchFolders();
    fetchMaps();
  }, []);

  useEffect(() => {
    if (!isCreateFolderOpen) {
      setFolderName('');
      setFolderColor(FOLDER_COLORS[0].value);
      setEditingFolder(null);
    }
  }, [isCreateFolderOpen]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      const res = await apiFetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, color: folderColor })
      });
      const newFolder = await res.json();
      setFolders(prev => [...prev, newFolder]);
      setFolderName('');
      setFolderColor(FOLDER_COLORS[0].value);
      setIsCreateFolderOpen(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !folderName.trim()) return;
    try {
      await apiFetch(`/api/folders/${editingFolder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, color: folderColor })
      });
      setFolders(prev => prev.map(f => f.id === editingFolder.id ? { ...f, name: folderName, color: folderColor } : f));
      setEditingFolder(null);
      setFolderName('');
      setIsCreateFolderOpen(false);
    } catch (error) {
      console.error('Failed to update folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Maps inside will not be deleted.')) return;
    try {
      await apiFetch(`/api/folders/${folderId}`, { method: 'DELETE' });
      setFolders(prev => prev.filter(f => f.id !== folderId));
      if (selectedFolder === folderId) setSelectedFolder(null);
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const openEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setIsCreateFolderOpen(true);
  };

  const filteredMaps = maps.filter(map => {
    const matchesSearch = map.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (map.description && map.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = selectedFolder ? map.folder_id === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });

  const handleMapCreated = (mapId: string) => {
    navigate(`/map/${mapId}`);
  };

  const handleMapDelete = (mapId: string) => {
    setMaps(prev => prev.filter(m => m.id !== mapId));
  };

  const handleMapUpdate = (updatedMap: { id: string; title: string; description: string; folder_id?: string }) => {
    setMaps(prev => prev.map(m => m.id === updatedMap.id ? { ...m, ...updatedMap } : m));
  };

  const getFolderIcon = (icon: string) => {
    switch (icon) {
      case 'history': return <HistoryIcon size={20} />;
      case 'star': return <Star size={20} />;
      case 'clock': return <Clock size={20} />;
      default: return <BookOpen size={20} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-app text-main font-display">
      <header className="bg-surface px-5 pb-4 pt-12 sticky top-0 z-10 shadow-sm border-b border-line">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {selectedFolder && (
              <button onClick={() => setSelectedFolder(null)} className="p-1 -ml-1 hover:bg-surface border border-line rounded">
                <ChevronRight className="rotate-180" size={20} />
              </button>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-main">
              {selectedFolder ? folders.find(f => f.id === selectedFolder)?.name || 'Folder' : 'Library'}
            </h1>
          </div>
          <button 
            onClick={() => { setFolderName(''); setFolderColor(FOLDER_COLORS[0].value); setEditingFolder(null); setIsCreateFolderOpen(true); }}
            className="p-2 rounded-full hover:bg-surface border border-line transition-colors text-primary"
          >
            <FolderIcon size={24} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-muted" />
            </div>
            <input 
              className="block w-full pl-10 pr-3 py-2.5 bg-surface border border-line rounded-xl text-sm text-main placeholder-muted focus:ring-2 focus:ring-primary/20 transition-all" 
              placeholder="Search topics..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="p-5 space-y-6">
        {!selectedFolder && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-main">Folders</h2>
              <span className="text-xs font-medium text-primary">{folders.length} folders</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {folders.map(folder => {
                const colorObj = FOLDER_COLORS.find(c => c.value === folder.color) || FOLDER_COLORS[0];
                return (
                  <div 
                    key={folder.id} 
                    onClick={() => setSelectedFolder(folder.id)}
                    className="bg-surface p-4 rounded-2xl border border-line shadow-sm flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 rounded-full ${colorObj.bg} flex items-center justify-center`} style={{ color: folder.color }}>
                        {getFolderIcon(folder.icon)}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditFolder(folder); }}
                          className="p-1 hover:bg-surface border border-line rounded"
                        >
                          <Edit size={14} className="text-muted" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-main">{folder.name}</h3>
                      <p className="text-xs text-muted">{folder.map_count || 0} items</p>
                    </div>
                  </div>
                );
              })}
              <button 
                onClick={() => { setFolderName(''); setFolderColor(FOLDER_COLORS[0].value); setEditingFolder(null); setIsCreateFolderOpen(true); }}
                className="bg-surface p-4 rounded-2xl border-2 border-dashed border-line flex flex-col gap-3 items-center justify-center text-muted hover:border-primary hover:text-primary transition-colors"
              >
                <Plus size={24} />
                <span className="text-sm font-medium">New Folder</span>
              </button>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-main mb-3">
            {selectedFolder ? 'Maps in Folder' : 'Recent Maps'}
          </h2>
          <div className="space-y-4">
            {filteredMaps.map(map => (
              <div key={map.id} className="bg-surface rounded-2xl p-3 border border-line shadow-sm flex gap-4 hover:shadow-md transition-shadow group">
                <Link to={`/map/${map.id}`} className="w-24 h-24 rounded-xl bg-app flex-shrink-0 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${map.id}/200/200`} alt={map.title} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start">
                      <Link to={`/map/${map.id}`} className="font-semibold leading-tight text-main hover:text-primary transition-colors">{map.title}</Link>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.preventDefault(); setEditingMap(map); }}
                          className="p-1.5 hover:bg-surface border border-line rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} className="text-muted" />
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); setEditingMap(map); }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted mt-1">
                      {map.folder_name ? `${map.folder_name} • ` : ''}{map.node_count || 0} nodes
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Clock size={14} />
                    <span>Edited {new Date(map.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredMaps.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted text-sm">
                No maps found for "{searchQuery}"
              </div>
            )}
            {filteredMaps.length === 0 && !searchQuery && (
              <div className="text-center py-8 text-muted text-sm">
                {selectedFolder ? 'No maps in this folder' : 'No maps yet. Create one to get started!'}
              </div>
            )}
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
        folders={folders}
      />

      <EditMapModal
        isOpen={!!editingMap}
        map={editingMap}
        onClose={() => setEditingMap(null)}
        onDelete={handleMapDelete}
        onSave={handleMapUpdate}
        folders={folders}
      />

      {isCreateFolderOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-main">{editingFolder ? 'Edit Folder' : 'New Folder'}</h3>
              <button onClick={() => setIsCreateFolderOpen(false)} className="p-1 hover:bg-surface border border-line rounded">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-main">Folder Name</label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g., Science, History"
                  className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-sm text-main focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-main">Color</label>
                <div className="flex gap-2">
                  {FOLDER_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setFolderColor(color.value)}
                      className={`w-8 h-8 rounded-full transition-transform ${folderColor === color.value ? 'scale-110 ring-2 ring-offset-2 ring-muted' : ''}`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                disabled={!folderName.trim()}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {editingFolder ? 'Save Changes' : 'Create Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="library" />
    </div>
  );
};
