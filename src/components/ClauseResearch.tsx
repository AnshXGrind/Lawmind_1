import React, { useState, useEffect } from 'react';
import { researchLegalClauses } from '../services/gemini';
import { Search, Sparkles, Copy, Check, BookOpen, Scale, Loader2, AlertCircle, TrendingUp, Shield, Gavel, History, FileText, ChevronRight, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import { Draft, User } from '../types';

const QUICK_TOPICS = [
  { title: "Force Majeure", icon: Shield, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { title: "Arbitration", icon: Gavel, color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  { title: "Bail Grounds", icon: Scale, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { title: "Limitation Act", icon: History, color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" }
];

interface ClauseResearchProps {
  user?: User;
  onSelectDraft?: (draft: Draft) => void;
  onSaveLater?: (item: any) => void;
}

export default function ClauseResearch({ user, onSelectDraft, onSaveLater }: ClauseResearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentDrafts, setRecentDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    if (user) {
      api.drafts.list(user.id).then(data => setRecentDrafts(data.slice(0, 4)));
    }
  }, [user]);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = overrideQuery || query;
    if (!finalQuery) return;
    setLoading(true);
    try {
      const data = await researchLegalClauses(finalQuery);
      setResults(data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!results) return;
    navigator.clipboard.writeText(results);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveResult = () => {
    if (!results || !onSaveLater) return;
    onSaveLater({
      id: `research-${Date.now()}`,
      title: `Research: ${query}`,
      content: results,
      type: 'Research Result'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
      {/* Top Search Bar & Header */}
      <div className="flex flex-col gap-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Jurisprudential Intelligence
              </span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-serif font-bold text-slate-900 leading-tight"
            >
              Precedents & <span className="text-indigo-600 italic">Clauses</span>
            </motion.h1>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 max-w-2xl w-full"
          >
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search legal clauses, jurisprudential topics or precedents..."
                className="w-full pl-14 pr-32 py-4 bg-white rounded-2xl border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-base font-medium placeholder:text-slate-400 text-slate-900 shadow-xl"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || !query}
                className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-6 rounded-xl font-bold hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 text-sm shadow-lg shadow-indigo-600/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Investigate</span>
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Topics & History */}
        <div className="lg:col-span-4 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-8 rounded-[40px] border-slate-200 bg-white shadow-xl"
          >
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Expedited Matters</p>
            <div className="grid grid-cols-1 gap-3">
              {QUICK_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(topic.title);
                    handleSearch(undefined, topic.title);
                  }}
                  className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all text-left group"
                >
                  <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", topic.color.split(' dark:')[0])}>
                    <topic.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-slate-700">{topic.title}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {recentDrafts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-8 rounded-[40px] border-slate-200 bg-white shadow-xl"
            >
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Contextual Jurisprudence</p>
              <div className="space-y-3">
                {recentDrafts.map((draft) => (
                  <button
                    key={draft.id}
                    onClick={() => {
                      setQuery(`Analyze and suggest clauses for: ${draft.title}`);
                      handleSearch(undefined, `Based on this draft title "${draft.title}", suggest 3 critical legal clauses that should be included.`);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{draft.title}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Content: Results */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 glass rounded-[40px] border-slate-200 bg-white shadow-xl h-full"
              >
                <div className="relative">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-8 animate-pulse">
                    <Scale className="w-10 h-10 text-indigo-600" />
                  </div>
                  <div className="absolute inset-0 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                </div>
                <p className="text-slate-500 text-lg font-serif italic animate-pulse">Consulting jurisprudential precedents...</p>
              </motion.div>
            ) : results ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-[40px] border-slate-200 bg-white shadow-2xl overflow-hidden h-full flex flex-col"
              >
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-bold text-slate-900">Jurisprudential Findings</h2>
                      <p className="text-xs text-slate-500 font-medium mt-1">Found relevant clauses and citations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveResult}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
                      title="Save to Repository"
                    >
                      <Bookmark className="w-5 h-5" />
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-all shadow-lg shadow-indigo-600/20"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy All'}
                    </button>
                  </div>
                </div>
                <div className="p-8 md:p-12 bg-white flex-1 overflow-y-auto custom-scrollbar">
                  <div className="max-w-3xl mx-auto">
                    <div className="markdown-body text-slate-600">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{results}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-[40px] border-slate-200 border-dashed border-2 py-32 text-center h-full flex flex-col items-center justify-center bg-slate-50/50"
              >
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
                  <Scale className="w-12 h-12 text-slate-200" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-400">Prepared for Investigation</h3>
                <p className="text-slate-400 mt-2 max-w-xs mx-auto">Submit a jurisprudential topic or select an expedited matter from the sidebar to initiate investigation.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
