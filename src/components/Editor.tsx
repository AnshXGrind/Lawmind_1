import React, { useState, useEffect, useRef } from 'react';
import { Draft, User, DraftType } from '../types';
import { api } from '../services/api';
import { generateLegalDraft, suggestLegalSections } from '../services/gemini';
import { 
  ChevronLeft, Save, Sparkles, Download, FileText, 
  Search, AlertCircle, CheckCircle2, Loader2, Upload, 
  Mic, MicOff, Maximize2, Minimize2, Share2, History, Type, Plus,
  ChevronDown, Bookmark, BookmarkCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import { createWorker } from 'tesseract.js';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface EditorProps {
  user: User;
  draft?: Draft;
  initialType?: DraftType;
  onBack: () => void;
  onSaveLater: (item: any) => void;
  isSaved: boolean;
}

export default function Editor({ user, draft, initialType, onBack, onSaveLater, isSaved }: EditorProps) {
  const [title, setTitle] = useState(draft?.title || `New ${initialType || 'Draft'}`);
  const [content, setContent] = useState(draft?.content || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (draft) {
        await api.drafts.update(draft.id, title, content);
      } else {
        await api.drafts.create(user.id, title, content, initialType || 'Petition');
      }
      alert('Draft saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const result = await generateLegalDraft(aiPrompt, initialType || draft?.type || 'Petition');
      setContent(result || '');
      setActiveTab('preview');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!content) return;
    setIsAnalyzing(true);
    setShowIntelligence(true);
    setExpandedSections([]); // Reset expanded sections on new analysis
    try {
      const result = await suggestLegalSections(content);
      setSuggestions(result || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseSuggestions = (text: string) => {
    if (!text) return [];
    // Split by headers (e.g., "## Section Name" or "### Section Name")
    const sections = text.split(/^#{2,3}\s+/m).filter(Boolean);
    
    // If no headers found, return the whole text as one section
    if (sections.length === 1 && !text.match(/^#{2,3}\s+/m)) {
      return [{ title: "Legal Analysis", content: text }];
    }

    return sections.map(section => {
      const lines = section.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      return { title, content };
    });
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    const width = doc.internal.pageSize.getWidth() - (margin * 2);
    
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text(title.toUpperCase(), margin, margin + 10);
    
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(content, width);
    doc.text(splitText, margin, margin + 25);
    
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      setAiPrompt(prev => prev + "\n\nExtracted Text from Document:\n" + text);
    } catch (err) {
      console.error(err);
    } finally {
      setOcrLoading(false);
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setAiPrompt(p => p + " (Voice input: Add a clause for dispute resolution via arbitration in New Delhi)");
        setIsListening(false);
      }, 3000);
    }
  };

  return (
    <div className={cn(
      "h-full flex flex-col bg-[#F8F9FA] dark:bg-black transition-all duration-500",
      isFullscreen && "fixed inset-0 z-[100] p-0"
    )}>
      {/* Editor Header */}
      <header className="h-16 md:h-20 glass border-b-0 px-4 md:px-10 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
          <motion.button 
            whileHover={{ x: -3 }}
            onClick={onBack}
            className="p-2 md:p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl md:rounded-2xl transition-colors text-slate-500 dark:text-slate-400 shrink-0"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
          <div className="h-6 md:h-8 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />
          <div className="flex flex-col min-w-0 flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-base md:text-xl font-serif font-bold text-slate-900 dark:text-white p-0 placeholder:text-slate-300 dark:placeholder:text-slate-600 w-full truncate"
              placeholder="Case Title / Document Name"
            />
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 md:px-2 py-0.5 rounded-md">
                {initialType || draft?.type || 'Petition'}
              </span>
              <span className="text-[8px] md:text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate hidden xs:block">Drafting Assistant Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 ml-2">
          <div className="hidden lg:flex items-center gap-2 mr-4">
            <button 
              onClick={() => onSaveLater({ id: draft?.id || Date.now(), title, content, type: initialType || draft?.type || 'Draft' })}
              className={cn(
                "p-3 rounded-2xl transition-colors",
                isSaved ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30" : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400"
              )}
              title={isSaved ? "Saved to Collection" : "Save for Later"}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors text-slate-500 dark:text-slate-400" title="History">
              <History className="w-5 h-5" />
            </button>
            <button className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors text-slate-500 dark:text-slate-400" title="Share">
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors text-slate-500 dark:text-slate-400"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={handleExportPDF}
            className="hidden sm:flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-white dark:bg-black border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl md:rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-xs md:text-sm shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 md:px-8 py-2 md:py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl md:rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-xs md:text-sm shadow-xl shadow-slate-900/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden p-2 md:p-8 gap-8">
        {/* Main Workspace */}
        <div className="flex-1 flex flex-col gap-4 md:gap-6 overflow-hidden">
          {/* Prompt Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-3 md:p-4 rounded-[24px] md:rounded-[32px] border-white/50 flex items-center gap-2 md:gap-4 shadow-2xl shadow-indigo-500/5"
          >
            <div className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl hidden xs:block">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the case details..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-base text-slate-900 dark:text-white placeholder:text-slate-400 font-medium min-w-0"
            />
            <div className="flex items-center gap-1 md:gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 md:p-3 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 rounded-xl md:rounded-2xl hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                title="Upload Document (OCR)"
              >
                {ocrLoading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Upload className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
              
              <button
                onClick={toggleListening}
                className={cn(
                  "p-2 md:p-3 rounded-xl md:rounded-2xl transition-all",
                  isListening ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {isListening ? <Mic className="w-4 h-4 md:w-5 md:h-5" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
              
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !aiPrompt}
                className="bg-indigo-600 text-white px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 text-xs md:text-sm"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Sparkles className="w-3 h-3 md:w-4 md:h-4" />}
                <span className="hidden xs:inline">Draft</span>
              </button>
            </div>
          </motion.div>

          {/* Tab Switcher & Analysis Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex p-1 bg-slate-200/50 rounded-xl md:rounded-2xl border border-slate-200/50">
              <button
                onClick={() => setActiveTab('edit')}
                className={cn(
                  "px-6 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'edit' ? "bg-white text-slate-900 shadow-lg" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Type className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Editor
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={cn(
                  "px-6 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'preview' ? "bg-white text-slate-900 shadow-lg" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Preview
              </button>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !content}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm border",
                showIntelligence 
                  ? "bg-amber-500 text-white border-amber-600" 
                  : "bg-white text-amber-600 border-amber-100 hover:bg-amber-50"
              )}
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
              {showIntelligence ? "Update Analysis" : "Analyze Content"}
            </button>
          </div>

          {/* Collapsible Intelligence Panel */}
          <AnimatePresence>
            {showIntelligence && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="glass p-6 rounded-[32px] border-amber-200/50 bg-amber-50/30 relative">
                  <button 
                    onClick={() => setShowIntelligence(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-amber-100 rounded-full transition-colors text-amber-600"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-slate-900">AI Intelligence Report</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-300 mb-2" />
                        <p className="text-xs text-amber-600 font-medium">Analyzing legal context...</p>
                      </div>
                    ) : suggestions ? (
                      <div className="space-y-3">
                        {parseSuggestions(suggestions).map((section, idx) => (
                          <div key={idx} className="bg-white/50 border border-amber-100 rounded-2xl overflow-hidden transition-all">
                            <button
                              onClick={() => toggleSection(idx)}
                              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-amber-100/50 transition-colors"
                            >
                              <span className="text-sm font-bold text-slate-800">{section.title}</span>
                              <ChevronDown className={cn(
                                "w-4 h-4 text-amber-600 transition-transform duration-300",
                                expandedSections.includes(idx) && "rotate-180"
                              )} />
                            </button>
                            <AnimatePresence>
                              {expandedSections.includes(idx) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-5 pb-5 pt-1">
                                    <div className="markdown-body text-xs prose-sm text-slate-600 leading-relaxed">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No analysis available. Try analyzing the content again.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor/Preview Area */}
          <div className="flex-1 relative perspective-1000 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'edit' ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, rotateY: -10 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 10 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="h-full"
                >
                  <textarea
                    ref={editorRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full glass p-6 md:p-10 rounded-[24px] md:rounded-[40px] border-white/50 focus:ring-0 outline-none resize-none font-mono text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed shadow-2xl shadow-black/5 dark:bg-black/40"
                    placeholder="Document content will appear here..."
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, rotateY: 10 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -10 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="h-full glass p-6 md:p-10 rounded-[24px] md:rounded-[40px] border-white/50 overflow-y-auto shadow-2xl shadow-black/5 bg-white/90 dark:bg-black/80"
                >
                  <div className="max-w-3xl mx-auto py-4 md:py-10">
                    <div className="markdown-body text-sm md:text-base">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden xl:flex w-80 flex-col gap-8 shrink-0">
          {/* Intelligence Widget */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-8 rounded-[40px] border-white/50 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-900">Intelligence</h3>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !content}
                className="text-xs font-bold text-indigo-600 hover:underline disabled:opacity-50"
              >
                Analyze
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {isAnalyzing ? (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400">Analyzing legal context...</p>
                </div>
              ) : suggestions ? (
                <div className="space-y-2">
                  {parseSuggestions(suggestions).map((section, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden transition-all">
                      <button
                        onClick={() => toggleSection(idx + 100)} // Offset to avoid conflict with main panel
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-700">{section.title}</span>
                        <ChevronDown className={cn(
                          "w-3 h-3 text-slate-400 transition-transform duration-300",
                          expandedSections.includes(idx + 100) && "rotate-180"
                        )} />
                      </button>
                      <AnimatePresence>
                        {expandedSections.includes(idx + 100) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-0">
                              <div className="markdown-body text-[10px] prose-sm text-slate-500 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Generate a draft to see relevant legal sections.</p>
              )}
            </div>
          </motion.div>

          {/* Drafting Tips Widget */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-8 rounded-[40px] border-white/50 flex-1"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900">Drafting Tips</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Specify court jurisdiction clearly",
                "Double-check party details",
                "Verify AI suggestions with gazettes",
                "Ensure proper formatting for filing"
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-500 font-medium">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => alert("Use the 'Research' tab for in-depth precedents.")}
              className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
            >
              <Search className="w-4 h-4" />
              Clause Research
            </button>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
