import React, { useState } from 'react';
import { X, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CreateMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (mapId: string) => void;
}

export const CreateMapModal: React.FC<CreateMapModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [branches, setBranches] = useState<string[]>(['']);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddBranch = () => setBranches([...branches, '']);
  const handleRemoveBranch = (index: number) => setBranches(branches.filter((_, i) => i !== index));
  const handleBranchChange = (index: number, value: string) => {
    const newBranches = [...branches];
    newBranches[index] = value;
    setBranches(newBranches);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsCreating(true);
    try {
      // 1. Create the Map
      const mapRes = await fetch('/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      
      if (!mapRes.ok) throw new Error('Failed to create map');
      const mapData = await mapRes.json();
      const mapId = mapData.id;

      // 2. Create the Root Node
      const rootNodeRes = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          map_id: mapId,
          parent_id: null,
          title: title,
          notes: description,
          color: '#308ce8',
          x: 0,
          y: 0,
          shape: 'rounded'
        })
      });

      if (!rootNodeRes.ok) throw new Error('Failed to create root node');
      const rootNode = await rootNodeRes.json();

      // 3. Create Initial Branches
      const validBranches = branches.filter(b => b.trim() !== '');
      await Promise.all(validBranches.map((branchTitle, index) => {
        // Spread branches around the center
        const angle = (index / validBranches.length) * 2 * Math.PI;
        const radius = 250;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return fetch('/api/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            map_id: mapId,
            parent_id: rootNode.id,
            title: branchTitle,
            notes: '',
            color: '#4ade80',
            x,
            y,
            shape: 'rounded'
          })
        });
      }));

      onCreated(mapId);
      onClose();
    } catch (error) {
      console.error('Error creating map:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Study Map</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Central Topic</label>
                <input
                  autoFocus
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Cellular Biology, Ancient Rome..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this map about?"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all h-24 resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Initial Branches</label>
                  <button
                    type="button"
                    onClick={handleAddBranch}
                    className="text-xs font-bold text-primary hover:text-blue-600 flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Add Branch
                  </button>
                </div>
                <div className="space-y-2">
                  {branches.map((branch, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        value={branch}
                        onChange={(e) => handleBranchChange(index, e.target.value)}
                        placeholder={`Branch ${index + 1}`}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                      {branches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBranch(index)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isCreating || !title.trim()}
                  className="w-full py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Creating Map...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Create Map
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
