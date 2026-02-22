import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Image, Sliders, Eye, Download, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Node } from '../types';

interface ExportMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'pdf' | 'png' | 'jpeg', quality: number, options: { includeNotes: boolean; masteryIcons: boolean; autoScale: boolean }) => void;
  mapTitle: string;
  nodes: Node[];
}

export const ExportMapModal: React.FC<ExportMapModalProps> = ({ isOpen, onClose, onExport, mapTitle, nodes }) => {
  const [format, setFormat] = useState<'pdf' | 'png' | 'jpeg'>('pdf');
  const [quality, setQuality] = useState(2); // 1: Standard, 2: High, 3: Ultra
  const [includeNotes, setIncludeNotes] = useState(true);
  const [masteryIcons, setMasteryIcons] = useState(false);
  const [autoScale, setAutoScale] = useState(true);

  const handleExport = () => {
    onExport(format, quality, { includeNotes, masteryIcons, autoScale });
    onClose();
  };

  // Calculate preview scaling and positioning
  const previewData = useMemo(() => {
    if (nodes.length === 0) return { scale: 1, offsetX: 0, offsetY: 0, width: 100, height: 100 };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + 200); // Approx width
      maxY = Math.max(maxY, node.y + 100); // Approx height
    });

    const padding = 50;
    const mapWidth = maxX - minX + padding * 2;
    const mapHeight = maxY - minY + padding * 2;
    
    // Preview container size (approximate based on UI)
    const containerWidth = 140; 
    const containerHeight = 180;

    const scaleX = containerWidth / mapWidth;
    const scaleY = containerHeight / mapHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% fill

    return {
      scale,
      offsetX: -minX + padding,
      offsetY: -minY + padding,
      width: mapWidth,
      height: mapHeight
    };
  }, [nodes]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] max-h-[90vh]"
          >
            {/* Handle */}
            <div className="flex h-6 w-full items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-2 pt-2">
              <h3 className="text-slate-900 dark:text-white tracking-tight text-2xl font-bold leading-tight">Export Mind Map</h3>
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-28 pt-2 space-y-6">
              
              {/* Section: File Format */}
              <div>
                <h2 className="text-slate-900 dark:text-white text-base font-bold leading-tight tracking-tight pb-3 pt-2 flex items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  File Format
                </h2>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                  {(['pdf', 'png', 'jpeg'] as const).map((fmt) => (
                    <label key={fmt} className="flex-1 cursor-pointer relative">
                      <input 
                        type="radio" 
                        name="format" 
                        value={fmt} 
                        checked={format === fmt} 
                        onChange={() => setFormat(fmt)}
                        className="peer sr-only" 
                      />
                      <div className={cn(
                        "flex items-center justify-center py-2.5 rounded-[10px] text-sm font-semibold transition-all uppercase",
                        format === fmt 
                          ? "bg-white dark:bg-slate-900 text-primary shadow-sm" 
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      )}>
                        {fmt}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section: Export Quality */}
              <div>
                <div className="flex justify-between items-center pb-3">
                  <h2 className="text-slate-900 dark:text-white text-base font-bold leading-tight tracking-tight flex items-center gap-2">
                    <Image className="text-primary" size={20} />
                    Quality
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {quality === 1 ? 'Standard' : quality === 2 ? 'High' : 'Ultra'}
                  </span>
                </div>
                <div className="px-2 pb-2">
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="1" 
                    value={quality} 
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-primary" 
                  />
                  <div className="flex justify-between text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 px-1">
                    <span>Standard</span>
                    <span>High</span>
                    <span>Ultra</span>
                  </div>
                </div>
              </div>

              {/* Section: Layout Options & Preview */}
              <div className="grid grid-cols-2 gap-4">
                {/* Options Column */}
                <div className="flex flex-col space-y-4">
                  <h2 className="text-slate-900 dark:text-white text-base font-bold leading-tight tracking-tight flex items-center gap-2">
                    <Sliders className="text-primary" size={20} />
                    Options
                  </h2>
                  
                  {/* Toggle: Notes */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Include Notes</span>
                    <button 
                      onClick={() => setIncludeNotes(!includeNotes)}
                      className={cn(
                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                        includeNotes ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        includeNotes ? "translate-x-4.5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>

                  {/* Toggle: Mastery Icons */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Mastery Icons</span>
                    <button 
                      onClick={() => setMasteryIcons(!masteryIcons)}
                      className={cn(
                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                        masteryIcons ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        masteryIcons ? "translate-x-4.5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>

                  {/* Toggle: Auto-scale */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Auto-scale</span>
                    <button 
                      onClick={() => setAutoScale(!autoScale)}
                      className={cn(
                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                        autoScale ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        autoScale ? "translate-x-4.5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>
                </div>

                {/* Preview Column */}
                <div className="flex flex-col">
                  <h2 className="text-slate-900 dark:text-white text-base font-bold leading-tight tracking-tight pb-3 flex items-center gap-2">
                    <Eye className="text-primary" size={20} />
                    Preview
                  </h2>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex items-center justify-center flex-1 min-h-[140px] border border-slate-200 dark:border-slate-700/50">
                    {/* A4 Paper Representation */}
                    <div className="bg-white relative w-36 h-48 shadow-md flex items-center justify-center overflow-hidden transition-all">
                      {/* Map Content Preview */}
                      <div 
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                          transform: `scale(${previewData.scale})`,
                          transformOrigin: 'center center'
                        }}
                      >
                        <div style={{ position: 'relative', width: previewData.width, height: previewData.height }}>
                          {/* Render simplified nodes */}
                          {nodes.map(node => (
                            <div
                              key={node.id}
                              style={{
                                position: 'absolute',
                                left: node.x + previewData.offsetX,
                                top: node.y + previewData.offsetY,
                                width: '160px', // Fixed width for preview consistency
                                padding: '8px',
                                borderRadius: node.shape === 'circle' ? '9999px' : '8px',
                                border: `2px solid ${node.mastery_level === 100 ? '#22c55e' : (node.color || '#e2e8f0')}`,
                                backgroundColor: '#fff',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}
                            >
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '2px' }}>
                                {node.title}
                              </div>
                              {includeNotes && node.notes && (
                                <div style={{ fontSize: '8px', color: '#64748b', lineHeight: '1.2' }}>
                                  {node.notes.substring(0, 30)}...
                                </div>
                              )}
                              {masteryIcons && node.mastery_level === 100 && (
                                <div style={{ fontSize: '8px', color: '#16a34a', fontWeight: 'bold', marginTop: '2px' }}>
                                  ✓
                                </div>
                              )}
                            </div>
                          ))}
                          {/* Render simplified connections */}
                          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
                            {nodes.map(node => {
                              if (!node.parent_id) return null;
                              const parent = nodes.find(n => n.id === node.parent_id);
                              if (!parent) return null;
                              
                              const startX = (parent.x + previewData.offsetX) + 80; // Center of parent
                              const startY = (parent.y + previewData.offsetY) + 40; // Center of parent
                              const endX = (node.x + previewData.offsetX) + 80;
                              const endY = (node.y + previewData.offsetY) + 40;

                              return (
                                <path
                                  key={`prev-conn-${node.id}`}
                                  d={`M ${startX} ${startY} C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}`}
                                  fill="none"
                                  stroke="#cbd5e1"
                                  strokeWidth="2"
                                />
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                      
                      {/* Page Number */}
                      <div className="absolute bottom-1 right-1 text-[8px] text-slate-400">1/1</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer Action */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 pb-8">
              <button 
                onClick={handleExport}
                className="w-full bg-primary hover:bg-blue-600 active:scale-[0.98] transition-all text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group"
              >
                <Download className="group-hover:animate-bounce" size={20} />
                Export {format.toUpperCase()}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
