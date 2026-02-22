import React, { useState, useEffect } from 'react';
import { X, Trash2, Loader2, Folder as FolderIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';
import type { Map, Folder } from '../types';

interface EditMapModalProps {
  isOpen: boolean;
  map: Map | null;
  onClose: () => void;
  onDelete: (mapId: string) => void;
  onSave: (updatedMap: { id: string; title: string; description: string; folder_id?: string }) => void;
  folders?: Folder[];
}

export const EditMapModal: React.FC<EditMapModalProps> = ({ isOpen, map, onClose, onDelete, onSave, folders = [] }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (map) {
      setTitle(map.title);
      setDescription(map.description || '');
      setFolderId(map.folder_id || '');
      setShowDeleteConfirm(false);
    }
  }, [map]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await apiFetch(`/api/maps/${map?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), folder_id: folderId || null })
      });
      onSave({ id: map!.id, title: title.trim(), description: description.trim(), folder_id: folderId || null });
      onClose();
    } catch (error) {
      console.error('Failed to update map:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiFetch(`/api/maps/${map?.id}`, { method: 'DELETE' });
      onDelete(map!.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete map:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && map && (
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
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Map</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Map title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Add a description..."
                />
              </div>
              {folders.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Folder</label>
                  <div className="relative">
                    <FolderIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={folderId}
                      onChange={(e) => setFolderId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
                    >
                      <option value="">No folder</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 space-y-3">
              <button
                onClick={handleSave}
                disabled={!title.trim() || isSaving}
                className="w-full py-3 bg-primary hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : null}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>

              {showDeleteConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  Delete Map
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
