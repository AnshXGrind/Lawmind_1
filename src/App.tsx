import { useState, useEffect } from 'react';
import { User, Draft, DraftType } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import CalendarView from './components/CalendarView';
import ClauseResearch from './components/ClauseResearch';
import { Scale, LogOut, LayoutDashboard, Calendar, Search, FileText, Bell, Settings, Menu, X, Moon, Sun, Plus, CreditCard, User as UserIcon, HelpCircle, Sparkles, ShieldCheck, Bookmark, Trash2, Gavel, AlertCircle, MessageSquare, FileSearch, Zap, Users, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import DocumentUpload from './components/DocumentUpload';
import { askLegalQuestion, analyzeDocument } from './services/gemini';
import { SubscriptionTier } from './types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type View = 'dashboard' | 'editor' | 'calendar' | 'research' | 'contracts' | 'petitions' | 'qa' | 'analysis' | 'subscription' | 'account-settings' | 'support';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSavedItemsOpen, setIsSavedItemsOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [qaMessages, setQaMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isQaLoading, setIsQaLoading] = useState(false);

  const canAccessFeature = (feature: string) => {
    const tier = user?.subscription?.tier || 'Starter';
    if (tier === 'Premium' || tier === 'Enterprise') return true;
    if (tier === 'Advanced') {
      return !['enterprise-features'].includes(feature);
    }
    return !['analysis', 'advanced-research', 'enterprise-features'].includes(feature);
  };

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
    document.documentElement.classList.add('dark');
  }, []);

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

  const bottomNavItems = [
    { id: 'dashboard', label: 'Chambers', icon: LayoutDashboard },
    { id: 'qa', label: 'Jurisprudence AI', icon: MessageSquare },
    { id: 'analysis', label: 'Case Briefing', icon: FileSearch },
  ] as const;

  const topNavItems = [
    { id: 'calendar', label: 'Docket', icon: Calendar },
    { id: 'research', label: 'Precedents', icon: Search },
  ] as const;

  const allNavItems = [...bottomNavItems, ...topNavItems];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="h-20 flex items-center justify-between px-6 md:px-10 sticky top-0 z-50 glass border-b border-slate-200">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xl"
            >
              <Scale className="text-white w-5 h-5" />
            </motion.div>
            <span className="text-xl font-serif font-bold text-gradient tracking-tight hidden sm:block">LawMind</span>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {topNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  view === item.id 
                    ? "bg-white text-indigo-600 shadow-md" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileMenuOpen(false);
              }}
              className={cn(
                "p-2.5 rounded-xl transition-all relative",
                isNotificationsOpen ? "bg-indigo-600 text-white" : "hover:bg-slate-100 text-slate-500"
              )}
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 glass rounded-[32px] border-white/10 shadow-2xl p-6 z-50"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-serif font-bold text-slate-900">Notifications</h3>
                    <button 
                      onClick={markAllRead}
                      className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {notifications.length > 0 ? notifications.map((notif) => (
                      <div key={notif.id} className="flex gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                          <Bell className="w-4 h-4 text-slate-600 group-hover:text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{notif.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">{notif.time}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="py-10 text-center">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm text-slate-400">All caught up!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="h-6 w-px bg-white/10" />
          
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsNotificationsOpen(false);
              }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-xl border transition-all relative",
                isProfileMenuOpen 
                  ? "bg-indigo-600 border-indigo-600 text-white" 
                  : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <span className="font-bold text-sm">{user.name.charAt(0)}</span>
              {savedItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
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
                  className="absolute right-0 mt-4 w-72 glass rounded-[32px] border-white/10 shadow-2xl p-6 z-50"
                >
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-serif font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {[
                      { icon: UserIcon, label: 'Counsel Profile', color: 'text-blue-600', onClick: () => {
                        setView('account-settings');
                        setIsProfileMenuOpen(false);
                      }},
                      { icon: CreditCard, label: 'Retainer Agreement', color: 'text-emerald-600', onClick: () => {
                        setView('subscription');
                        setIsProfileMenuOpen(false);
                      }},
                      { icon: FileText, label: `Saved Instruments (${savedItems.length})`, color: 'text-rose-600', onClick: () => {
                        setIsSavedItemsOpen(true);
                        setIsProfileMenuOpen(false);
                      }},
                      { icon: HelpCircle, label: 'Legal Assistance', color: 'text-amber-600', onClick: () => {
                        setView('support');
                        setIsProfileMenuOpen(false);
                      }},
                    ].map((item, idx) => (
                      <button 
                        key={idx}
                        onClick={item.onClick}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors group text-left"
                      >
                        <div className={cn("p-2 rounded-lg bg-slate-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100", item.color)}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="w-full mt-6 flex items-center gap-3 p-3 hover:bg-rose-50 text-rose-600 rounded-2xl transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-rose-50 group-hover:bg-rose-100 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold">Relinquish Session</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden flex flex-col pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={view + (currentDraft?.id || 'new')}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
              className="flex-1 overflow-y-auto custom-scrollbar"
            >
              {view === 'dashboard' && (
                <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h1 className="text-4xl font-serif font-bold text-slate-900">Salutations, Adv. {user.name.split(' ')[0]}</h1>
                      <p className="text-slate-500 mt-2">You have {notifications.length} new updates and {savedItems.length} saved instruments in your repository.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleCreateNew('Petition')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Initiate Instrument
                      </button>
                    </div>
                  </div>

                  <Dashboard 
                    user={user} 
                    onSelectDraft={handleSelectDraft} 
                    onCreateNew={handleCreateNew}
                    onSaveLater={toggleSaveItem}
                    savedItems={savedItems}
                  />
                </div>
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
              {view === 'qa' && (
                <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
                  <div className="mb-8">
                    <h1 className="text-3xl font-serif font-bold text-slate-900">Jurisprudence AI</h1>
                    <p className="text-slate-500 mt-2">Inquire regarding complex jurisprudential matters and obtain precise responses based on Indian Law.</p>
                  </div>
                  
                  <div className="flex-1 flex flex-col glass rounded-[40px] overflow-hidden border-slate-200 bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                      {qaMessages.length === 0 && (
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <Scale className="w-5 h-5" />
                          </div>
                          <div className="p-6 bg-slate-50 rounded-3xl rounded-tl-none max-w-[80%] border border-slate-100">
                            <p className="text-sm text-slate-600">Salutations, Counsel. How may I facilitate your jurisprudential research this session?</p>
                          </div>
                        </div>
                      )}
                      
                      {qaMessages.map((msg, i) => (
                        <div key={i} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            msg.role === 'user' ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
                          )}>
                            {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
                          </div>
                          <div className={cn(
                            "p-6 rounded-3xl max-w-[80%] markdown-body",
                            msg.role === 'user' 
                              ? "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20" 
                              : "bg-slate-50 rounded-tl-none text-slate-600 border border-slate-100"
                          )}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      ))}

                      {isQaLoading && (
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                          <div className="p-6 bg-slate-50 rounded-3xl rounded-tl-none border border-slate-100">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Submit a jurisprudential inquiry (e.g., What are the grounds for anticipatory bail?)"
                          className="w-full pl-6 pr-16 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const q = (e.target as HTMLInputElement).value;
                              if (!q || isQaLoading) return;
                              (e.target as HTMLInputElement).value = '';
                              
                              setQaMessages(prev => [...prev, { role: 'user', content: q }]);
                              setIsQaLoading(true);
                              
                              try {
                                let currentResponse = "";
                                await askLegalQuestion(q, "Indian", (chunk) => {
                                  currentResponse += chunk;
                                  setQaMessages(prev => {
                                    const last = prev[prev.length - 1];
                                    if (last && last.role === 'ai') {
                                      return [...prev.slice(0, -1), { role: 'ai', content: currentResponse }];
                                    }
                                    return [...prev, { role: 'ai', content: currentResponse }];
                                  });
                                });
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setIsQaLoading(false);
                              }
                            }
                          }}
                        />
                        <button className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:scale-105 transition-all">
                          <Zap className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {view === 'account-settings' && (
                <div className="p-8 max-w-4xl mx-auto space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <UserIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-serif font-bold text-slate-900">Counsel Profile</h1>
                      <p className="text-slate-500">Manage your jurisprudential profile and security credentials.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass p-8 rounded-[40px] space-y-6 bg-white border-slate-200 shadow-xl">
                      <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                          <input type="text" defaultValue={user.name} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                          <input type="email" defaultValue={user.email} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                        </div>
                      </div>
                      <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-indigo-600/20">Finalize Profile Updates</button>
                    </div>
                    
                    <div className="glass p-8 rounded-[40px] space-y-6 bg-white border-slate-200 shadow-xl">
                      <h3 className="text-lg font-bold text-slate-900">Security</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Current Password</label>
                          <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                          <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                        </div>
                      </div>
                      <button className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all border border-slate-200">Revise Security Credentials</button>
                    </div>
                  </div>
                </div>
              )}

              {view === 'support' && (
                <div className="p-8 max-w-4xl mx-auto space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                      <HelpCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-serif font-bold text-slate-900">Legal Assistance</h1>
                      <p className="text-slate-500">We are dedicated to facilitating your jurisprudential endeavors.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { title: 'Jurisprudential Guides', icon: FileText, desc: 'Access comprehensive manuals and API documentation.' },
                      { title: 'Real-time Counsel', icon: MessageSquare, desc: 'Engage with our legal technology specialists.' },
                      { title: 'Formal Correspondence', icon: Bell, desc: 'Obtain a response within a twenty-four hour period.' }
                    ].map((item, i) => (
                      <div key={i} className="glass p-8 rounded-[40px] text-center space-y-4 hover:scale-[1.05] transition-all cursor-pointer bg-white border-slate-200 shadow-xl">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
                          <item.icon className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900">{item.title}</h3>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="glass p-8 rounded-[40px] space-y-6 bg-white border-slate-200 shadow-xl">
                    <h3 className="text-xl font-serif font-bold text-slate-900">Submit a Formal Inquiry</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Inquiry Subject</label>
                        <input type="text" placeholder="Specify the nature of your inquiry..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Detailed Particulars</label>
                        <textarea placeholder="Elaborate upon the specifics of your request..." className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-900" />
                      </div>
                      <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-indigo-600/20">Dispatch Inquiry</button>
                    </div>
                  </div>
                </div>
              )}

              {view === 'analysis' && (
                <div className="p-8 max-w-5xl mx-auto">
                  {!canAccessFeature('analysis') ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                      <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                        <Zap className="w-10 h-10" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-slate-900">Advanced Feature</h2>
                        <p className="text-slate-500 mt-2 max-w-md">Instrument briefing and RAG-powered research are available on Advanced and Premium tiers.</p>
                      </div>
                      <button 
                        onClick={() => setView('subscription')}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-xl shadow-indigo-600/20"
                      >
                        Upgrade Retainer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      <div className="text-center">
                        <h1 className="text-4xl font-serif font-bold text-slate-900">Instrument Intelligence</h1>
                        <p className="text-slate-500 mt-2">Submit legal instruments to analyze risks, clauses, and missing provisions.</p>
                      </div>
                      
                      <div className="glass p-8 rounded-[40px] bg-white border-slate-200 shadow-xl">
                        <DocumentUpload onUploadSuccess={(text) => {
                          alert("Instrument processed! You may now submit inquiries regarding it in the Jurisprudence AI section.");
                        }} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { title: 'Risk Assessment', icon: AlertCircle, desc: 'Identify potential liabilities and ambiguous language.' },
                          { title: 'Clause Extraction', icon: FileText, desc: 'Automatically extract key clauses and their implications.' },
                          { title: 'Missing Provisions', icon: Search, desc: 'Find standard clauses that are missing from your instrument.' }
                        ].map((item, i) => (
                          <div key={i} className="glass p-6 rounded-[32px] border-slate-200 text-center bg-white shadow-md">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <item.icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900">{item.title}</h3>
                            <p className="text-xs text-slate-500 mt-2">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {view === 'subscription' && (
                <div className="p-8 max-w-6xl mx-auto">
                  <div className="text-center mb-16">
                    <h1 className="text-4xl font-serif font-bold text-slate-900">Select Retainer Tier</h1>
                    <p className="text-slate-500 mt-2">Scale your legal practice with AI-powered intelligence.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { 
                        tier: 'Starter', 
                        price: '₹0', 
                        period: '/month',
                        features: ['Basic Legal Drafting', 'Standard Clause Research', 'Limited Q&A (5/day)', 'Single User'],
                        color: 'bg-white border-slate-200 shadow-xl',
                        btnColor: 'bg-slate-900 text-white'
                      },
                      { 
                        tier: 'Advanced', 
                        price: '₹250', 
                        period: '/month',
                        features: ['Unlimited Drafting', 'Advanced Research', 'Unlimited Q&A', 'Document Analysis (10/mo)', 'Priority Support'],
                        color: 'bg-indigo-600 shadow-2xl shadow-indigo-600/20 scale-105 border-indigo-500',
                        btnColor: 'bg-white text-indigo-600',
                        popular: true
                      },
                      { 
                        tier: 'Premium', 
                        price: '₹1,000', 
                        period: '/month',
                        features: ['Unlimited Everything', 'Full RAG Intelligence', 'Unlimited Doc Analysis', 'Custom Prompt Templates', 'Early Access Features'],
                        color: 'bg-white border-slate-200 shadow-xl',
                        btnColor: 'bg-slate-900 text-white'
                      }
                    ].map((plan, i) => (
                      <div key={i} className={cn("relative p-8 rounded-[40px] flex flex-col h-full transition-all hover:scale-[1.02] border", plan.color)}>
                        {plan.popular && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-widest shadow-xl">
                            Most Popular
                          </div>
                        )}
                        <div className="mb-8">
                          <h3 className={cn("text-xl font-bold mb-2", plan.popular ? "text-white" : "text-slate-900")}>{plan.tier}</h3>
                          <div className="flex items-baseline gap-1">
                            <span className={cn("text-4xl font-serif font-bold", plan.popular ? "text-white" : "text-slate-900")}>{plan.price}</span>
                            <span className={plan.popular ? "text-indigo-100" : "text-slate-500"}>{plan.period}</span>
                          </div>
                        </div>
                        
                        <ul className="space-y-4 mb-12 flex-1">
                          {plan.features.map((f, j) => (
                            <li key={j} className="flex items-center gap-3 text-sm">
                              <Check className={cn("w-4 h-4 shrink-0", plan.popular ? "text-white" : "text-indigo-600")} />
                              <span className={plan.popular ? "text-indigo-50" : "text-slate-600"}>{f}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <button 
                          onClick={() => {
                            const updatedUser = { ...user!, subscription: { tier: plan.tier as SubscriptionTier } };
                            setUser(updatedUser);
                            localStorage.setItem('lawmind_user', JSON.stringify(updatedUser));
                            setView('dashboard');
                            alert(`Upgraded to ${plan.tier} retainer tier!`);
                          }}
                          className={cn("w-full py-4 rounded-2xl font-bold transition-all hover:scale-105", plan.btnColor)}
                        >
                          {user?.subscription?.tier === plan.tier ? 'Current Tier' : `Select ${plan.tier}`}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-16 glass p-12 rounded-[48px] border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8 bg-white shadow-xl">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-indigo-600/20">
                        <Users className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-slate-900">Enterprise for Law Firms</h3>
                        <p className="text-slate-500 mt-1">Team collaboration, custom workflows, and dedicated account manager.</p>
                      </div>
                    </div>
                    <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl">
                      Contact Sales
                    </button>
                  </div>
                </div>
              )}
              {view === 'contracts' && (
                <div className="p-8 max-w-5xl mx-auto">
                  <div className="mb-12">
                    <h1 className="text-4xl font-serif font-bold text-slate-900">Instrument Drafting</h1>
                    <p className="text-slate-500 mt-2">Select an instrument type and input terms to formulate a professional draft.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                      <div className="glass p-6 rounded-[32px] border-slate-200 bg-white shadow-xl">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Instrument Type</p>
                        <div className="space-y-2">
                          {[
                            { title: 'Lease Agreement', icon: ShieldCheck },
                            { title: 'Service Agreement', icon: FileText },
                            { title: 'Employment Contract', icon: UserIcon },
                            { title: 'NDA', icon: ShieldCheck }
                          ].map((type, i) => (
                            <button
                              key={i}
                              className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all text-left group"
                            >
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                                <type.icon className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-slate-700">{type.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                      <div className="glass p-8 rounded-[40px] space-y-8 border-slate-200 bg-white shadow-xl">
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Key Terms & Conditions</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500">Effective Date</label>
                              <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500">Jurisdiction</label>
                              <input type="text" placeholder="e.g. New Delhi" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500">Specific Clauses (Optional)</label>
                            <textarea placeholder="Add any custom terms or specific requirements..." className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-900 placeholder:text-slate-400" />
                          </div>
                        </div>

                        <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                          <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-sm font-bold text-slate-900">AI Drafting Suggestions</h4>
                          </div>
                          <ul className="space-y-2">
                            <li className="text-xs text-slate-600 flex gap-2">
                              <div className="w-1 h-1 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                              Include a clear termination clause with notice period.
                            </li>
                            <li className="text-xs text-slate-600 flex gap-2">
                              <div className="w-1 h-1 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                              Specify dispute resolution through arbitration.
                            </li>
                          </ul>
                        </div>

                        <button 
                          onClick={() => handleCreateNew('Contract')}
                          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-5 h-5" />
                          Formulate Professional Instrument
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {view === 'petitions' && (
                <div className="p-8 max-w-5xl mx-auto">
                  <div className="mb-12">
                    <h1 className="text-4xl font-serif font-bold text-slate-900">Petition Formulation</h1>
                    <p className="text-slate-500 mt-2">Formulate legal petitions with AI-suggested IPC/CrPC codes and sections.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="glass p-8 rounded-[40px] space-y-8 border-slate-200 bg-white shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Case Type</label>
                            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900">
                              <option>Criminal Petition</option>
                              <option>Civil Suit</option>
                              <option>Writ Petition</option>
                              <option>Bail Application</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Parties Involved</label>
                            <input type="text" placeholder="e.g. State vs. John Doe" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Key Facts & Grounds</label>
                          <textarea placeholder="Describe the incident and key legal points..." className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-900 placeholder:text-slate-400" />
                        </div>
                        <button 
                          onClick={() => handleCreateNew('Petition')}
                          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                        >
                          <Gavel className="w-5 h-5" />
                          Formulate Petition via AI
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                      <div className="glass p-6 rounded-[32px] border-amber-200 bg-amber-50 shadow-md">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">Jurisprudential Suggestions</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm">
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Relevant Codes</p>
                            <p className="text-xs font-bold text-slate-700">IPC Section 420, 406</p>
                            <p className="text-[10px] text-slate-500 mt-1">Cheating and Criminal Breach of Trust</p>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm">
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Procedural Codes</p>
                            <p className="text-xs font-bold text-slate-700">CrPC Section 438</p>
                            <p className="text-[10px] text-slate-500 mt-1">Anticipatory Bail Application</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Saved Instruments Modal */}
      <AnimatePresence>
        {isSavedItemsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSavedItemsOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] border-slate-200 shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-slate-900">Saved Instruments</h2>
                    <p className="text-sm text-slate-500">Your repository of legal instruments and research</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSavedItemsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {savedItems.length > 0 ? savedItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl text-slate-500 group-hover:scale-110 transition-transform shadow-sm">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <p className="text-[10px] text-indigo-600 uppercase tracking-widest font-bold mt-0.5">{item.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          if (item.type === 'Research Result') {
                            alert("Opening research result...");
                          } else {
                            handleSelectDraft(item);
                            setIsSavedItemsOpen(false);
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-md shadow-indigo-600/20"
                      >
                        Access
                      </button>
                      <button 
                        onClick={() => toggleSaveItem(item)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Relinquish Instrument"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                      <Bookmark className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-500 font-medium">The repository is void.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation (Mobile & Desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 glass border-t border-slate-200 px-6 flex items-center justify-around md:justify-center md:gap-24 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-300 group",
              view === item.id ? "scale-110" : "text-slate-400 hover:text-indigo-600"
            )}
          >
            <div className={cn(
              "p-3 rounded-2xl transition-all duration-300",
              view === item.id 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                : "bg-slate-100 group-hover:bg-indigo-50"
            )}>
              <item.icon className="w-6 h-6" />
            </div>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest hidden sm:block transition-colors",
              view === item.id ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"
            )}>
              {item.label}
            </span>
          </button>
        ))}

        {/* New Draft FAB */}
        <div className="relative -top-10 md:-top-12">
          <motion.button
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleCreateNew('Petition')}
            className="w-20 h-20 bg-slate-900 text-white rounded-[28px] flex items-center justify-center shadow-2xl shadow-slate-900/40 border-8 border-slate-50 relative z-10"
          >
            <Plus className="w-10 h-10" />
          </motion.button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900 absolute -bottom-8 left-1/2 -translate-x-1/2 hidden sm:block whitespace-nowrap">
            Initiate Instrument
          </span>
        </div>

        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-rose-600 transition-all group"
        >
          <div className="p-3 rounded-2xl bg-slate-100 group-hover:bg-rose-50 transition-all">
            <LogOut className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Relinquish</span>
        </button>
      </nav>
    </div>
  );
}
