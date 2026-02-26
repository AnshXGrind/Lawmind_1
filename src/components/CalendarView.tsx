import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, LegalEvent } from '../types';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, ChevronLeft, ChevronRight, AlertCircle, Loader2, MapPin, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { cn } from '../lib/utils';

interface CalendarViewProps {
  user: User;
}

function InteractiveEventCard({ event, onDelete, onClick }: { event: LegalEvent, onDelete: (id: number) => void, onClick: () => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function handleMouseMove(event: React.MouseEvent) {
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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative p-6 bg-white rounded-[32px] border border-slate-200 hover:border-indigo-500/30 transition-all shadow-xl shadow-slate-200/20 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <span className={cn(
          "text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest",
          event.type === 'Hearing' ? "bg-rose-50 text-rose-600" :
          event.type === 'Meeting' ? "bg-blue-50 text-blue-600" :
          "bg-emerald-50 text-emerald-600"
        )}>
          {event.type}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(event.id);
          }} 
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <h4 className="text-xl font-serif font-bold text-slate-900 mb-2 leading-tight">{event.title}</h4>
      <div className="space-y-2">
        <p className="text-xs text-slate-500 flex items-center gap-2 font-medium">
          <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
          {format(new Date(event.event_date), 'MMMM d, yyyy')}
        </p>
        {event.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function CalendarView({ user }: CalendarViewProps) {
  const [events, setEvents] = useState<LegalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LegalEvent | null>(null);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), type: 'Hearing' });

  useEffect(() => {
    loadEvents();
  }, [user.id]);

  const loadEvents = async () => {
    try {
      const data = await api.events.list(user.id);
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.events.create(user.id, newEvent.title, newEvent.description, newEvent.date, newEvent.type);
      setShowAddModal(false);
      loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Delete this event?')) return;
    try {
      await api.events.delete(id);
      loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-8 md:mb-16">
        <div className="max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <span className="px-3 md:px-4 py-1 md:py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest">
              Docket
            </span>
            <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-slate-500">
              <TrendingUp className="w-3 md:w-3.5 h-3 md:h-3.5" />
              {events.length} Active Proceedings
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-6xl font-serif font-bold text-slate-900 leading-tight"
          >
            Docket <span className="text-indigo-600 italic">Repository</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 text-base md:text-lg mt-4 md:mt-6 leading-relaxed"
          >
            Track your hearings, consultations, and critical statutory deadlines with precision.
          </motion.p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-[24px] font-bold hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/20 text-base md:text-lg"
        >
          <Plus className="w-5 h-5 md:w-6 md:h-6" />
          Schedule Proceeding
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Calendar Grid */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-8 glass rounded-[32px] md:rounded-[48px] border-slate-200 shadow-2xl shadow-slate-200/20 overflow-hidden flex flex-col bg-white"
        >
          <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h2 className="text-xl md:text-3xl font-serif font-bold text-slate-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2 md:gap-3">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                className="p-2 md:p-4 hover:bg-white rounded-xl md:rounded-2xl border border-slate-200 transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                className="p-2 md:p-4 hover:bg-white rounded-xl md:rounded-2xl border border-slate-200 transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="py-4 md:py-6 text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1">
            {days.map((day, idx) => {
              const dayEvents = events.filter(e => isSameDay(new Date(e.event_date), day));
              const today = isToday(day);
              
              return (
                <div 
                  key={day.toString()} 
                  className={cn(
                    "min-h-[80px] md:min-h-[140px] p-1 md:p-4 border-r border-b border-slate-100 transition-all hover:bg-slate-50 relative group",
                    idx % 7 === 6 && "border-r-0",
                    today && "bg-indigo-50"
                  )}
                >
                  <div className={cn(
                    "text-[10px] md:text-sm font-bold mb-1 md:mb-3 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full transition-colors",
                    today ? "bg-indigo-600 text-white" : "text-slate-400 group-hover:text-slate-900"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map(event => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={cn(
                          "text-[7px] md:text-[9px] p-1 md:p-2 rounded-md md:rounded-xl border truncate font-bold uppercase tracking-tighter shadow-sm cursor-pointer hover:brightness-95 transition-all",
                          event.type === 'Hearing' ? "bg-rose-50 text-rose-700 border-rose-100" :
                          event.type === 'Meeting' ? "bg-blue-50 text-blue-700 border-blue-100" :
                          "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}
                      >
                        {event.title}
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Upcoming Events List */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-600" />
              Forthcoming Proceedings
            </h3>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Next 7 Days</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 glass rounded-[40px] bg-white border-slate-200">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
              <p className="text-sm text-slate-500 font-medium">Syncing Docket...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-6">
              {events.slice(0, 4).map((event, i) => (
                <InteractiveEventCard 
                  key={event.id} 
                  event={event} 
                  onDelete={handleDeleteEvent} 
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 glass rounded-[40px] border-dashed border-2 border-slate-200 bg-white">
              <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No forthcoming proceedings found.</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
              >
                Schedule your first proceeding
              </button>
            </div>
          )}

          {/* Quick Stats Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass p-8 rounded-[40px] border-slate-200 bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20"
          >
            <h4 className="text-lg font-serif font-bold mb-4">Docket Insights</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-80">Hearings this month</span>
                <span className="text-xl font-bold">{events.filter(e => e.type === 'Hearing').length}</span>
              </div>
              <div className="h-px bg-white/20" />
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-80">Consultations scheduled</span>
                <span className="text-xl font-bold">{events.filter(e => e.type === 'Meeting').length}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-6 md:p-12">
                <div className="flex items-center gap-4 mb-8 md:mb-10">
                  <div className="p-3 md:p-4 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-[24px]">
                    <CalendarIcon className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Schedule Proceeding</h2>
                    <p className="text-xs md:text-sm text-slate-500 font-medium">Add a new hearing or consultation</p>
                  </div>
                </div>

                <form onSubmit={handleAddEvent} className="space-y-6 md:space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest ml-2">Proceeding Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Final Oral Argument"
                      className="w-full p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-xl md:rounded-[24px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-base md:text-lg font-medium text-slate-900"
                      value={newEvent.title}
                      onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest ml-2">Date</label>
                      <input
                        type="date"
                        required
                        className="w-full p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-xl md:rounded-[24px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-base md:text-lg font-medium text-slate-900"
                        value={newEvent.date}
                        onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest ml-2">Type</label>
                      <select
                        className="w-full p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-xl md:rounded-[24px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-base md:text-lg font-medium appearance-none text-slate-900"
                        value={newEvent.type}
                        onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                      >
                        <option>Hearing</option>
                        <option>Meeting</option>
                        <option>Deadline</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest ml-2">Annotations</label>
                    <textarea
                      placeholder="Append matter annotations..."
                      className="w-full p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-xl md:rounded-[24px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-base md:text-lg font-medium h-24 md:h-32 resize-none text-slate-900"
                      value={newEvent.description}
                      onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-3 md:gap-4 pt-4 md:pt-6">
                    <button 
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-6 md:px-8 py-4 md:py-5 border border-slate-200 rounded-xl md:rounded-[24px] font-bold text-sm md:text-lg text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 md:px-8 py-4 md:py-5 bg-indigo-600 text-white rounded-xl md:rounded-[24px] font-bold hover:scale-[1.02] transition-all shadow-2xl shadow-indigo-600/20 text-sm md:text-lg"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-6 md:p-12">
                <div className="flex justify-between items-start mb-6 md:mb-8">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={cn(
                      "p-3 md:p-4 rounded-xl md:rounded-[24px]",
                      selectedEvent.type === 'Hearing' ? "bg-rose-50 text-rose-600" :
                      selectedEvent.type === 'Meeting' ? "bg-blue-50 text-blue-600" :
                      "bg-emerald-50 text-emerald-600"
                    )}>
                      <CalendarIcon className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                      <span className={cn(
                        "text-[8px] md:text-[10px] px-2 md:px-3 py-0.5 md:py-1 rounded-full font-bold uppercase tracking-widest mb-1 inline-block",
                        selectedEvent.type === 'Hearing' ? "bg-rose-50 text-rose-600" :
                        selectedEvent.type === 'Meeting' ? "bg-blue-50 text-blue-600" :
                        "bg-emerald-50 text-emerald-600"
                      )}>
                        {selectedEvent.type}
                      </span>
                      <h2 className="text-xl md:text-3xl font-serif font-bold text-slate-900">{selectedEvent.title}</h2>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <Plus className="w-5 h-5 md:w-6 md:h-6 rotate-45 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-[32px] border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600 text-sm md:text-base">
                      <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                      <span className="font-bold">{format(new Date(selectedEvent.event_date), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="hidden md:block w-px h-4 bg-slate-200" />
                    <div className="flex items-center gap-2 text-slate-600 text-sm md:text-base">
                      <Clock className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                      <span className="font-bold">Scheduled</span>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <div className="space-y-2 md:space-y-3">
                      <h4 className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest ml-2">Annotations</h4>
                      <div className="p-4 md:p-8 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-[32px] text-sm md:text-base text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {selectedEvent.description}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 md:gap-4 pt-4 md:pt-6">
                    <button 
                      onClick={() => {
                        handleDeleteEvent(selectedEvent.id);
                        setSelectedEvent(null);
                      }}
                      className="flex-1 px-6 md:px-8 py-4 md:py-5 border border-rose-200 rounded-xl md:rounded-[24px] font-bold text-sm md:text-lg text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      Delete
                    </button>
                    <button 
                      onClick={() => setSelectedEvent(null)}
                      className="flex-1 px-6 md:px-8 py-4 md:py-5 bg-indigo-600 text-white rounded-xl md:rounded-[24px] font-bold hover:scale-[1.02] transition-all shadow-2xl shadow-indigo-600/20 text-sm md:text-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
