import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Draft, User, DraftType, LegalEvent } from '../types';
import { Plus, FileText, Clock, Trash2, Search, Filter, ChevronRight, Scale, Calendar, TrendingUp, Briefcase, Users, Bookmark, BookmarkCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface DashboardProps {
  user: User;
  onSelectDraft: (draft: Draft) => void;
  onCreateNew: (type: DraftType) => void;
  onSaveLater: (item: any) => void;
  savedItems: any[];
}

const DRAFT_TYPES: DraftType[] = ['Petition', 'Contract', 'Bail Application', 'Affidavit', 'Legal Notice'];

function InteractiveCard({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000 }}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={cn("preserve-3d transition-shadow duration-300", className)}
    >
      {children}
    </motion.div>
  );
}

export default function Dashboard({ user, onSelectDraft, onCreateNew, onSaveLater, savedItems }: DashboardProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [events, setEvents] = useState<LegalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DraftType | 'All'>('All');

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      const [draftsData, eventsData] = await Promise.all([
        api.drafts.list(user.id),
        api.events.list(user.id)
      ]);
      setDrafts(draftsData);
      setEvents(eventsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      await api.drafts.delete(id);
      setDrafts(drafts.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDrafts = drafts.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || d.type === filter;
    return matchesSearch && matchesFilter;
  });

  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= new Date())
    .slice(0, 3);

  const stats = [
    { label: 'Active Cases', value: '12', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Pending Drafts', value: drafts.length.toString(), icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Hearings', value: events.length.toString(), icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Clients', value: '24', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 md:py-12">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 md:mb-12"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-2 md:mb-3"
            >
              Good morning, <span className="text-gradient">Adv. {user.name}</span>
            </motion.h1>
            <p className="text-slate-500 text-base md:text-lg">You have {upcomingEvents.length} hearings scheduled for this week.</p>
          </div>
          <div className="hidden md:flex gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {DRAFT_TYPES.slice(0, 3).map((type, idx) => (
              <motion.button
                key={type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => onCreateNew(type)}
                className="whitespace-nowrap bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all text-sm flex items-center gap-2 shadow-xl shadow-slate-900/20"
              >
                <Plus className="w-4 h-4" />
                {type}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass p-4 md:p-6 rounded-[24px] md:rounded-[32px] border-white/50"
          >
            <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-inner", stat.bg)}>
              <stat.icon className={cn("w-5 h-5 md:w-6 md:h-6", stat.color)} />
            </div>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Sidebar-like widgets */}
        <div className="lg:col-span-4 space-y-8">
          {/* Case Progress Tracker */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 rounded-[40px] border-white/50"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-serif font-bold text-slate-900">Case Progress</h3>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="space-y-6">
              {[
                { label: 'Drafting', progress: 75, color: 'bg-blue-500' },
                { label: 'Filing', progress: 40, color: 'bg-indigo-500' },
                { label: 'Hearing', progress: 15, color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500 uppercase tracking-tighter">{item.label}</span>
                    <span className="text-slate-900">{item.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn("h-full rounded-full", item.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Events Summary */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass p-8 rounded-[40px] border-white/50"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-serif font-bold text-slate-900">Upcoming hearings</h3>
              <button className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                <div key={event.id} className="flex gap-4 p-4 bg-white/50 rounded-3xl border border-white/50 hover:bg-white transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                    <span className="text-[10px] font-bold uppercase">{format(new Date(event.event_date), 'MMM')}</span>
                    <span className="text-lg font-bold leading-none">{format(new Date(event.event_date), 'd')}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{event.title}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      10:30 AM • Court Room 4
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No hearings scheduled.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Main Content */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search your legal drafts..."
                className="w-full pl-14 pr-6 py-4 glass rounded-[24px] md:rounded-3xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-base md:text-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
              {['All', ...DRAFT_TYPES].map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(t as any)}
                  className={cn(
                    "whitespace-nowrap px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all",
                    filter === t 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                      : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-4" />
              <p className="text-slate-400 font-medium">Loading your legal archive...</p>
            </div>
          ) : filteredDrafts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredDrafts.map((draft, idx) => (
                  <InteractiveCard
                    key={draft.id}
                    onClick={() => onSelectDraft(draft)}
                    className="group"
                  >
                    <div className="glass p-8 rounded-[40px] border-white/50 h-full flex flex-col relative overflow-hidden dark:bg-black/40">
                      <div className="flex items-start justify-between mb-6 relative z-10">
                        <div className="p-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-xl shadow-slate-900/20 group-hover:rotate-12 transition-transform">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSaveLater(draft);
                            }}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              savedItems.find(i => i.id === draft.id) 
                                ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30" 
                                : "text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            )}
                            title="Save for Later"
                          >
                            {savedItems.find(i => i.id === draft.id) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, draft.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-2"
                            title="Delete Draft"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="relative z-10">
                        <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{draft.title}</h3>
                        <div className="flex items-center gap-4 text-xs font-bold">
                          <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full uppercase tracking-tighter">
                            {draft.type}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                            {format(new Date(draft.updated_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto pt-6 flex items-center justify-between relative z-10">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            alert("Opening research for this draft...");
                          }}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline"
                        >
                          <Sparkles className="w-3 h-3" />
                          Research Clauses
                        </button>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </div>

                      {/* Decorative background element */}
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700 -z-0" />
                    </div>
                  </InteractiveCard>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-[40px] border-dashed border-slate-200 py-24 text-center"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Scale className="text-slate-200 w-12 h-12" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-900 mb-3">Your archive is empty</h3>
              <p className="text-slate-500 mb-10 max-w-sm mx-auto">Start drafting your first professional legal document with AI assistance.</p>
              <button 
                onClick={() => onCreateNew('Petition')}
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20"
              >
                Create New Draft
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
