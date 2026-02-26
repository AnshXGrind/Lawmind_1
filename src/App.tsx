import { useState, useEffect } from 'react';
import { User, Draft, DraftType } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import CalendarView from './components/CalendarView';
import ClauseResearch from './components/ClauseResearch';
import { Scale, LogOut, LayoutDashboard, Calendar, Search, FileText, Bell, Settings, Menu, X, Moon, Sun, Plus, CreditCard, User as UserIcon, HelpCircle, Sparkles, ShieldCheck, Bookmark, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

type View = 'dashboard' | 'editor' | 'calendar' | 'research';

const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Hearing Tomorrow', message: 'State vs. Sharma hearing at 10:30 AM', time: '2h ago', type: 'hearing' },
  { id: 2, title: 'Draft Approved', message: 'Your petition for Case #442 has been reviewed', time: '5h ago', type: 'draft' },
  { id: 3, title: 'Subscription', message: 'Your Pro plan was successfully renewed', time: '1d ago', type: 'billing' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [initialDraftType, setInitialDraftType] = useState<DraftType | undefined>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSavedItemsOpen, setIsSavedItemsOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  useEffect(() => {
    const savedCollection = localStorage.getItem('lawmind_saved_items');
    if (savedCollection) {
      setSavedItems(JSON.parse(savedCollection));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lawmind_saved_items', JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const savedUser = localStorage.getItem('lawmind_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleAuth = (user: User) => {
    setUser(user);
    localStorage.setItem('lawmind_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lawmind_user');
    setView('dashboard');
    document.documentElement.classList.remove('dark');
  };

  const toggleSaveItem = (item: any) => {
    setSavedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      return [...prev, { ...item, savedAt: new Date().toISOString() }];
    });
    
    // Add notification
    const newNotif = {
      id: Date.now(),
      title: 'Item Saved',
      message: `"${item.title || 'Draft'}" has been added to your saved items.`,
      time: 'Just now',
      type: 'save'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAllRead = () => {
    setNotifications([]);
  };

  const handleSelectDraft = (draft: Draft) => {
    setCurrentDraft(draft);
    setInitialDraftType(undefined);
    setView('editor');
  };

  const handleCreateNew = (type: DraftType) => {
    setCurrentDraft(null);
    setInitialDraftType(type);
    setView('editor');
  };

  if (!user) {
    return <Auth onAuth={handleAuth} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'research', label: 'Research', icon: Search },
  ] as const;

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-colors duration-500",
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-[#F0F2F5] text-slate-900"
    )}>
      {/* Desktop Header */}
      <header className="hidden md:flex h-20 items-center justify-between px-10 sticky top-0 z-50 glass border-b-0">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/20"
            >
              <Scale className="text-white dark:text-black w-6 h-6" />
            </motion.div>
            <span className="text-2xl font-serif font-bold text-gradient tracking-tight">LawMind</span>
          </div>

          <nav className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                  view === item.id 
                    ? "text-white" 
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {view === item.id && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/20"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-500"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileMenuOpen(false);
                }}
                className={cn(
                  "p-3 rounded-2xl transition-all relative",
                  isNotificationsOpen ? "bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-500"
                )}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white" />
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 glass rounded-[32px] border-white/50 shadow-2xl p-6 z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">Notifications</h3>
                      <button 
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full uppercase tracking-wider hover:bg-indigo-100 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {notifications.length > 0 ? notifications.map((notif) => (
                        <div key={notif.id} className="flex gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white dark:group-hover:bg-white/20 transition-colors">
                            <Bell className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{notif.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">{notif.time}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="py-10 text-center">
                          <Bell className="w-8 h-8 text-slate-200 dark:text-white/10 mx-auto mb-3" />
                          <p className="text-sm text-slate-400">All caught up!</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="h-8 w-px bg-slate-200" />
          
          <div className="flex items-center gap-4 relative">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-bold text-slate-900">Adv. {user.name}</p>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Senior Associate</p>
            </div>
            
            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  setIsNotificationsOpen(false);
                }}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border-2 transition-all relative",
                  isProfileMenuOpen 
                    ? "bg-slate-900 border-slate-900 text-white" 
                    : "bg-linear-to-br from-indigo-500 to-purple-600 border-white text-white shadow-indigo-500/20"
                )}
              >
                <span className="font-bold text-lg">{user.name.charAt(0)}</span>
                {savedItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                    {savedItems.length}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-72 glass rounded-[32px] border-white/50 shadow-2xl p-6 z-50"
                  >
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                      <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-serif font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {[
                        { icon: UserIcon, label: 'Account Settings', color: 'text-blue-500' },
                        { icon: CreditCard, label: 'Subscription Plan', color: 'text-emerald-500' },
                        { icon: ShieldCheck, label: 'Security & Privacy', color: 'text-indigo-500' },
                        { icon: Sparkles, label: 'AI Features', color: 'text-purple-500' },
                        { icon: FileText, label: `Saved Items (${savedItems.length})`, color: 'text-rose-500', onClick: () => {
                          setIsSavedItemsOpen(true);
                          setIsProfileMenuOpen(false);
                        }},
                        { icon: HelpCircle, label: 'Support & Help', color: 'text-amber-500' },
                      ].map((item, idx) => (
                        <button 
                          key={idx}
                          onClick={item.onClick}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group text-left"
                        >
                          <div className={cn("p-2 rounded-lg bg-slate-50 dark:bg-white/10 group-hover:bg-white dark:group-hover:bg-white/20 transition-colors", item.color)}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={handleLogout}
                      className="w-full mt-6 flex items-center gap-3 p-3 hover:bg-rose-50 text-rose-500 rounded-2xl transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-rose-50 group-hover:bg-white transition-colors">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold">Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex h-16 items-center justify-between px-6 glass sticky top-0 z-50 border-b-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
            <Scale className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-serif font-bold text-slate-900">LawMind</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-slate-500"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <div className="relative">
            <button 
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileMenuOpen(false);
              }}
              className="p-2 text-slate-500 relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full border border-white" />
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="fixed inset-x-4 top-20 glass rounded-[32px] border-white/50 shadow-2xl p-6 z-[60]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-serif font-bold text-slate-900">Notifications</h3>
                    <button onClick={() => setIsNotificationsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {MOCK_NOTIFICATIONS.map((notif) => (
                      <div key={notif.id} className="flex gap-4 p-3 bg-white/50 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Bell className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{notif.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">{notif.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button 
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsNotificationsOpen(false);
              }}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm ml-1 transition-all",
                isProfileMenuOpen ? "bg-slate-900" : "bg-indigo-500"
              )}
            >
              {user.name.charAt(0)}
            </button>

            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="fixed inset-x-4 top-20 glass rounded-[32px] border-white/50 shadow-2xl p-6 z-[60]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-serif font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setIsProfileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { icon: UserIcon, label: 'Account', color: 'text-blue-500' },
                      { icon: CreditCard, label: 'Subscription', color: 'text-emerald-500' },
                      { icon: Sparkles, label: 'AI Features', color: 'text-purple-500' },
                      { icon: HelpCircle, label: 'Support', color: 'text-amber-500' },
                    ].map((item, idx) => (
                      <button 
                        key={idx}
                        className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl"
                      >
                        <div className={cn("p-2 rounded-lg bg-white shadow-sm", item.color)}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="w-full mt-6 flex items-center justify-center gap-3 p-4 bg-rose-50 text-rose-500 rounded-2xl font-bold"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button 
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsNotificationsOpen(false);
              }}
              className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold relative"
            >
              {user.name.charAt(0)}
              {savedItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                  {savedItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={view + (currentDraft?.id || 'new')}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="flex-1 overflow-y-auto px-4 md:px-0"
          >
            {view === 'dashboard' && (
              <Dashboard 
                user={user} 
                onSelectDraft={handleSelectDraft} 
                onCreateNew={handleCreateNew}
                onSaveLater={toggleSaveItem}
                savedItems={savedItems}
              />
            )}
            {view === 'editor' && (
              <Editor 
                user={user} 
                draft={currentDraft || undefined} 
                initialType={initialDraftType}
                onBack={() => setView('dashboard')}
                onSaveLater={toggleSaveItem}
                isSaved={!!savedItems.find(i => i.id === currentDraft?.id)}
              />
            )}
            {view === 'calendar' && (
              <CalendarView user={user} />
            )}
            {view === 'research' && (
              <ClauseResearch 
                user={user} 
                onSelectDraft={handleSelectDraft} 
                onSaveLater={toggleSaveItem}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Saved Items Modal */}
        <AnimatePresence>
          {isSavedItemsOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSavedItemsOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl glass rounded-[40px] border-white/50 shadow-2xl p-8 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-2xl">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Saved Collection</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Your bookmarked drafts and research</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsSavedItemsOpen(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {savedItems.length > 0 ? savedItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-5 bg-white/50 dark:bg-white/5 rounded-3xl border border-white/50 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-0.5">{item.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            if (item.type === 'Research Result') {
                              // Handle research result view
                              alert("Opening research result...");
                            } else {
                              handleSelectDraft(item);
                              setIsSavedItemsOpen(false);
                            }
                          }}
                          className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
                        >
                          Open
                        </button>
                        <button 
                          onClick={() => toggleSaveItem(item)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-16">
                      <Bookmark className="w-16 h-16 text-slate-100 dark:text-white/5 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium">Your collection is empty.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 glass border-t-0 px-6 flex items-center justify-between z-50">
        {navItems.slice(0, 2).map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              view === item.id ? "text-slate-900 scale-110" : "text-slate-400"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              view === item.id ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : ""
            )}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </button>
        ))}

        {/* Mobile New Draft FAB */}
        <div className="relative -top-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleCreateNew('Petition')}
            className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/40 border-4 border-white"
          >
            <Plus className="w-8 h-8" />
          </motion.button>
        </div>

        {navItems.slice(2).map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              view === item.id ? "text-slate-900 scale-110" : "text-slate-400"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              view === item.id ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : ""
            )}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
        
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <div className="p-2">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Exit</span>
        </button>
      </nav>
    </div>
  );
}
