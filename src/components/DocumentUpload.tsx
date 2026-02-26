import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { processDocument, chunkText } from '../lib/document-processor';
import { addToVectorStore } from '../lib/vector-store';

interface DocumentUploadProps {
  onUploadSuccess?: (text: string) => void;
}

export default function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('processing');
    setProgress(0);
    setError(null);

    try {
      const text = await processDocument(selectedFile, (p) => setProgress(p));
      
      // Chunk and add to vector store for RAG
      const chunks = chunkText(text);
      await addToVectorStore(chunks, { fileName: selectedFile.name });
      
      setStatus('success');
      if (onUploadSuccess) onUploadSuccess(text);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Failed to process document');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-[32px] p-12 transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer",
          isDragging ? "border-indigo-500 bg-indigo-50 scale-[1.02]" : "border-slate-200 bg-slate-50 hover:border-indigo-500/50",
          status === 'processing' && "pointer-events-none opacity-80"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.pdf,image/*"
        />

        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900">Submit Instrument</h3>
                <p className="text-sm text-slate-600 mt-2">Deposit legal instruments here, or click to browse repository</p>
                <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-widest font-bold">Accepts PDF, TXT, and Visual Records</p>
              </div>
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 w-full max-w-xs"
            >
              <div className="relative">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                  {progress}%
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">Processing Instrument</h3>
                <p className="text-xs text-slate-600 mt-1">Extracting text and generating jurisprudential embeddings...</p>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900">Submission Finalized</h3>
                <p className="text-sm text-slate-600 mt-2">{file?.name} has been processed and added to your knowledge base.</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setStatus('idle'); setFile(null); }}
                className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
              >
                Submit additional instrument
              </button>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900">Submission Failed</h3>
                <p className="text-sm text-rose-600 mt-2">{error}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setStatus('idle'); }}
                className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
