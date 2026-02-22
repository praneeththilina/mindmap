import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Settings, 
  ChevronRight, 
  Play, 
  Plus, 
  CheckCircle2, 
  Brain, 
  FileText, 
  Sparkles,
  Clock,
  Loader2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { BottomNav } from '../components/BottomNav';
import { AddDeadlineModal } from '../components/AddDeadlineModal';
import { cn } from '../lib/utils';
import type { Map } from '../types';

interface Deadline {
  id: string;
  title: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  is_completed: boolean;
}

export const StudyPlan = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [maps, setMaps] = useState<Map[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [smartSuggestion, setSmartSuggestion] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'incomplete' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mapsRes, deadlinesRes] = await Promise.all([
          fetch('/api/maps'),
          fetch('/api/deadlines')
        ]);
        const mapsData = await mapsRes.json();
        const deadlinesData = await deadlinesRes.json();
        setMaps(mapsData);
        setDeadlines(deadlinesData);
      } catch (error) {
        console.error("Failed to fetch study plan data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ... (handlers remain the same: handleAddDeadline, handleToggleComplete, handleDeleteDeadline, handleSmartSchedule)

  const handleAddDeadline = async (newDeadline: { title: string; due_date: string; priority: 'high' | 'medium' | 'low' }) => {
    try {
      const res = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeadline)
      });
      if (res.ok) {
        const addedDeadline = await res.json();
        setDeadlines(prev => [...prev, addedDeadline]);
      }
    } catch (error) {
      console.error("Failed to add deadline:", error);
    }
  };

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, is_completed: !currentStatus } : d));

    try {
      await fetch(`/api/deadlines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !currentStatus })
      });
    } catch (error) {
      console.error("Failed to update deadline:", error);
      // Revert on failure
      setDeadlines(prev => prev.map(d => d.id === id ? { ...d, is_completed: currentStatus } : d));
    }
  };

  const handleDeleteDeadline = async (id: string) => {
    if (!window.confirm("Delete this deadline?")) return;
    
    // Optimistic update
    setDeadlines(prev => prev.filter(d => d.id !== id));

    try {
      await fetch(`/api/deadlines/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Failed to delete deadline:", error);
    }
  };

  const handleSmartSchedule = async () => {
    setIsGeneratingSchedule(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const pendingDeadlines = deadlines.filter(d => !d.is_completed).map(d => `${d.title} (Due: ${d.due_date}, Priority: ${d.priority})`).join(', ');
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Given these pending deadlines: [${pendingDeadlines}], suggest a concise 1-sentence study focus for today. Be encouraging.`,
      });

      setSmartSuggestion(response.text);
      
      // Auto-hide suggestion after 10 seconds
      setTimeout(() => setSmartSuggestion(null), 10000);
    } catch (error) {
      console.error("Smart schedule failed:", error);
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Generate calendar days
  const calendarDays = (() => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    if (viewMode === 'week') {
      const currentDayOfWeek = currentDate.getDay(); // 0 (Sun) - 6 (Sat)
      const mondayOffset = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - mondayOffset);

      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push({
          date: d,
          isCurrentMonth: true,
          isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
        });
      }
    } else {
      // Month View
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay(); // 0 Sun, 1 Mon...
      const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

      // Pad previous month
      for (let i = 0; i < adjustedStart; i++) {
        const d = new Date(year, month, 0 - (adjustedStart - 1) + i);
        days.push({ date: d, isCurrentMonth: false, isToday: false });
      }
      
      // Current month
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        days.push({ 
          date: d, 
          isCurrentMonth: true,
          isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
        });
      }

      // Pad next month
      while (days.length % 7 !== 0) {
        const d = new Date(year, month + 1, days.length - (daysInMonth + adjustedStart) + 1);
        days.push({ date: d, isCurrentMonth: false, isToday: false });
      }
    }
    return days;
  })();

  const highPriorityDeadline = deadlines.find(d => d.priority === 'high' && !d.is_completed);
  
  const totalTasks = deadlines.length;
  const completedTasks = deadlines.filter(d => d.is_completed).length;
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const filteredDeadlines = deadlines
    .filter(d => {
      // Filter by status
      if (filterStatus === 'incomplete' && d.is_completed) return false;
      if (filterStatus === 'completed' && !d.is_completed) return false;
      
      // Filter by priority
      if (filterPriority !== 'all' && d.priority !== filterPriority) return false;
      
      // Filter by selected date
      const dlDate = new Date(d.due_date);
      if (
        dlDate.getDate() !== selectedDate.getDate() || 
        dlDate.getMonth() !== selectedDate.getMonth() || 
        dlDate.getFullYear() !== selectedDate.getFullYear()
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  const calculateDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Overdue";
    if (days === 0) return "Today";
    return days;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-app">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-app text-main font-display pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-md border-b border-line px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-primary" size={28} />
            <h1 className="text-xl font-bold tracking-tight">Study Plan</h1>
          </div>
          <button 
            onClick={() => navigate('/settings')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-app text-muted transition hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 space-y-6 overflow-y-auto no-scrollbar">
        
        {/* Progress Overview */}
        <section className="bg-surface p-4 rounded-2xl shadow-sm border border-line">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-muted">Overall Progress</h3>
            <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
          </div>
          <div className="h-3 w-full bg-app rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full"
            />
          </div>
          <p className="text-xs text-muted mt-2">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </section>

        {/* Smart Suggestion Banner */}
        <AnimatePresence>
          {smartSuggestion && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl shadow-lg flex items-start gap-3"
            >
              <Sparkles className="shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-sm mb-1">AI Suggestion</h3>
                <p className="text-sm opacity-90">{smartSuggestion}</p>
              </div>
              <button onClick={() => setSmartSuggestion(null)} className="ml-auto text-white/70 hover:text-white">
                <span className="sr-only">Dismiss</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exam Countdown Card */}
        {highPriorityDeadline && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 shadow-sm ring-1 ring-red-200 dark:ring-red-900/50 p-6"
          >
            <div className="absolute right-0 top-0 h-48 w-48 -translate-y-12 translate-x-12 rounded-full bg-red-500/10 blur-3xl"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/40 px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-300 shadow-sm border border-red-200 dark:border-red-800/50">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    High Priority
                  </span>
                  <span className="text-xs font-medium text-red-600/80 dark:text-red-400/80 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-full">
                    Due {new Date(highPriorityDeadline.due_date).toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                </div>
                
                <h2 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white mb-2 tracking-tight">
                  {highPriorityDeadline.title}
                </h2>
                
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 bg-white/60 dark:bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <Clock size={16} className="text-red-500" />
                    <span className="font-medium">
                      {new Date(highPriorityDeadline.due_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/60 dark:bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <Calendar size={16} className="text-orange-500" />
                    <span className="font-medium">
                      {new Date(highPriorityDeadline.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Countdown Circle */}
              <div className="flex items-center gap-6 self-start sm:self-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-lg ring-4 ring-red-100 dark:ring-red-900/30">
                  <svg className="absolute h-full w-full rotate-[-90deg] p-1" viewBox="0 0 36 36">
                    <path 
                      className="text-slate-100 dark:text-slate-800" 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3"
                    ></path>
                    <path 
                      className="text-red-500 drop-shadow-sm transition-all duration-1000 ease-out" 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeDasharray={`${Math.max(0, Math.min(100, (100 - (typeof calculateDaysRemaining(highPriorityDeadline.due_date) === 'number' ? (calculateDaysRemaining(highPriorityDeadline.due_date) as number) * 10 : 100)))), 100}`}
                      strokeWidth="3"
                      strokeLinecap="round"
                    ></path>
                  </svg>
                  <div className="flex flex-col items-center leading-none z-10">
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {typeof calculateDaysRemaining(highPriorityDeadline.due_date) === 'number' 
                        ? calculateDaysRemaining(highPriorityDeadline.due_date) 
                        : '!'}
                    </span>
                    <span className="text-[0.65rem] uppercase font-bold text-slate-500 dark:text-slate-400 mt-0.5">Days Left</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-red-200/50 dark:border-red-900/30 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className={cn(
                    "h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold shadow-sm",
                    i === 0 ? "bg-blue-100 text-blue-700 z-30" : 
                    i === 1 ? "bg-purple-100 text-purple-700 z-20" : 
                    "bg-slate-100 text-slate-600 z-10"
                  )}>
                    {i === 0 ? 'You' : i === 1 ? 'AI' : '+2'}
                  </div>
                ))}
                <span className="ml-3 text-xs font-medium text-slate-600 dark:text-slate-400 self-center">Collaborators</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleToggleComplete(highPriorityDeadline.id, false)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm font-bold rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
                >
                  <CheckCircle2 size={16} />
                  Complete
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* Calendar Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={handlePrev} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <ChevronRight className="rotate-180" size={20} />
              </button>
              <h3 className="text-lg font-bold">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={handleNext} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex gap-1 bg-app p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('week')}
                className={cn("px-3 py-1 text-xs font-semibold rounded transition-all", viewMode === 'week' ? "bg-surface shadow-sm text-primary" : "text-muted hover:text-main")}
              >
                Week
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={cn("px-3 py-1 text-xs font-semibold rounded transition-all", viewMode === 'month' ? "bg-surface shadow-sm text-primary" : "text-muted hover:text-main")}
              >
                Month
              </button>
            </div>
          </div>
          
          <div className={cn(
            "bg-surface p-4 rounded-xl shadow-sm border border-line",
            viewMode === 'month' ? "grid grid-cols-7 gap-2" : "flex justify-between overflow-x-auto no-scrollbar gap-2"
          )}>
            {viewMode === 'month' && ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-muted mb-2">{day}</div>
            ))}
            
            {calendarDays.map((day, i) => {
              const isSelected = day.date.getDate() === selectedDate.getDate() && 
                               day.date.getMonth() === selectedDate.getMonth() && 
                               day.date.getFullYear() === selectedDate.getFullYear();
              
              const hasDeadline = deadlines.some(dl => {
                const dlDate = new Date(dl.due_date);
                return dlDate.getDate() === day.date.getDate() && 
                       dlDate.getMonth() === day.date.getMonth() && 
                       dlDate.getFullYear() === day.date.getFullYear() &&
                       !dl.is_completed;
              });

              return (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col items-center gap-1 group cursor-pointer relative",
                    viewMode === 'week' ? "min-w-[40px]" : "aspect-square justify-center rounded-lg hover:bg-app",
                    !day.isCurrentMonth && "opacity-30"
                  )}
                  onClick={() => setSelectedDate(day.date)}
                >
                  {viewMode === 'week' && (
                    <span className={cn("text-xs font-medium", day.isToday ? "text-primary font-bold" : "text-muted")}>
                      {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  )}
                  
                  <div className={cn(
                    "flex items-center justify-center transition-transform relative",
                    viewMode === 'week' ? "h-10 w-10 rounded-full" : "h-8 w-8 rounded-full",
                    isSelected 
                      ? "bg-primary text-white shadow-md shadow-primary/30 scale-105 font-bold" 
                      : day.isToday ? "bg-primary/10 text-primary font-bold" : "text-main"
                  )}>
                    <span className="text-sm">{day.date.getDate()}</span>
                    {hasDeadline && !isSelected && (
                      <span className={cn(
                        "absolute h-1 w-1 rounded-full", 
                        viewMode === 'week' ? "bottom-1" : "bottom-0.5",
                        "bg-red-500"
                      )}></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recommended Today */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Recommended Today</h3>
            <button 
              onClick={handleSmartSchedule}
              disabled={isGeneratingSchedule}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
            >
              {isGeneratingSchedule ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Smart Schedule
            </button>
          </div>
          <div className="space-y-3">
            {maps.slice(0, 2).map((map, i) => (
              <div key={map.id} className="group relative flex items-center gap-4 rounded-xl bg-surface p-4 shadow-sm transition-all hover:shadow-md border border-line">
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                  i === 0 ? "bg-primary/10 text-primary" : "bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                )}>
                  {i === 0 ? <Brain size={24} /> : <FileText size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      i === 0 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    )}>
                      {i === 0 ? 'Review' : 'New'}
                    </span>
                    <span className="text-xs text-muted">{i === 0 ? 'Spaced Repetition' : 'High Priority'}</span>
                  </div>
                  <h4 className="truncate text-base font-bold">{map.title}</h4>
                  <p className="text-xs text-muted mt-0.5">{map.description || 'Continue your study map'} • {i === 0 ? '30' : '45'} mins</p>
                </div>
                <button 
                  onClick={() => navigate(`/map/${map.id}`)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-primary/90"
                >
                  {i === 0 ? <Play size={16} fill="currentColor" /> : <Plus size={20} />}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Deadlines */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Upcoming Deadlines</h3>
            <div className="flex items-center gap-2">
              <div className="flex bg-app p-1 rounded-lg">
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={cn("px-2 py-1 text-[10px] font-semibold rounded transition-all", filterStatus === 'all' ? "bg-surface shadow-sm text-primary" : "text-muted hover:text-main")}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterStatus('incomplete')}
                  className={cn("px-2 py-1 text-[10px] font-semibold rounded transition-all", filterStatus === 'incomplete' ? "bg-surface shadow-sm text-primary" : "text-muted hover:text-main")}
                >
                  To Do
                </button>
                <button 
                  onClick={() => setFilterStatus('completed')}
                  className={cn("px-2 py-1 text-[10px] font-semibold rounded transition-all", filterStatus === 'completed' ? "bg-surface shadow-sm text-primary" : "text-muted hover:text-main")}
                >
                  Done
                </button>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
              
              {/* Priority Filter */}
              <div className="flex bg-app p-1 rounded-lg">
                <button 
                  onClick={() => setFilterPriority('all')}
                  className={cn("px-2 py-1 text-[10px] font-semibold rounded transition-all", filterPriority === 'all' ? "bg-surface shadow-sm text-primary" : "text-muted hover:text-main")}
                >
                  All Pri
                </button>
                <button 
                  onClick={() => setFilterPriority('high')}
                  className={cn("px-2 py-1 text-[10px] font-semibold rounded transition-all", filterPriority === 'high' ? "bg-surface shadow-sm text-red-500" : "text-muted hover:text-main")}
                >
                  High
                </button>
                <button 
                  onClick={() => setFilterPriority('medium')}
                  className={cn("px-2 py-1 text-[10px] font-semibold rounded transition-all", filterPriority === 'medium' ? "bg-surface shadow-sm text-yellow-500" : "text-muted hover:text-main")}
                >
                  Med
                </button>
                <button 
                  onClick={() => setFilterPriority('low')}
                  className={cn("px-2 py-1 text-[10px] font-semibold rounded transition-all", filterPriority === 'low' ? "bg-surface shadow-sm text-emerald-500" : "text-muted hover:text-main")}
                >
                  Low
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <button 
                onClick={() => setSortBy(prev => prev === 'date' ? 'priority' : 'date')}
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
              >
                Sort: {sortBy === 'date' ? 'Date' : 'Priority'}
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="ml-2 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="space-y-0 divide-y divide-line rounded-xl bg-surface shadow-sm border border-line">
            {filteredDeadlines.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">No deadlines found. Enjoy your day! 🎉</div>
            ) : (
              filteredDeadlines.map(deadline => (
                <div key={deadline.id} className={cn("flex items-center justify-between p-4 group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50", deadline.is_completed && "opacity-60 bg-slate-50/50 dark:bg-slate-900/50")}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button 
                      onClick={() => handleToggleComplete(deadline.id, deadline.is_completed)}
                      className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        deadline.is_completed 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "border-slate-300 dark:border-slate-600 hover:border-primary"
                      )}
                    >
                      {deadline.is_completed && <CheckCircle2 size={14} />}
                    </button>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-semibold truncate transition-all", deadline.is_completed && "line-through text-muted")}>{deadline.title}</p>
                      <p className="text-xs text-muted flex items-center gap-1.5">
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          deadline.priority === 'high' ? "bg-red-500" : deadline.priority === 'medium' ? "bg-yellow-400" : "bg-emerald-400"
                        )}></span>
                        {deadline.is_completed ? 'Completed' : `Due ${new Date(deadline.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!deadline.is_completed && (
                      <div className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap",
                        calculateDaysRemaining(deadline.due_date) === "Overdue" ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" :
                        calculateDaysRemaining(deadline.due_date) === "Today" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" :
                        "bg-app text-muted"
                      )}>
                        {calculateDaysRemaining(deadline.due_date)} {typeof calculateDaysRemaining(deadline.due_date) === 'number' ? 'days' : ''}
                      </div>
                    )}
                    <button 
                      onClick={() => handleDeleteDeadline(deadline.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Floating Smart Schedule Button */}
      <div className="fixed bottom-24 right-4 z-30">
        <button 
          onClick={handleSmartSchedule}
          disabled={isGeneratingSchedule}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/40 transition hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGeneratingSchedule ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
        </button>
      </div>

      <AddDeadlineModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddDeadline} 
      />

      <BottomNav active="schedule" />
    </div>
  );
};
