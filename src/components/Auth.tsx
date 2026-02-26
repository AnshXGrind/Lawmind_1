import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Scale, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, Gavel, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  onAuth: (user: User) => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const user = await api.auth.login(email, password);
        onAuth(user);
      } else {
        const user = await api.auth.register(email, password, name);
        onAuth(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full glass p-10 md:p-16 rounded-[56px] border-white/50 shadow-2xl shadow-indigo-500/5 relative z-10"
      >
        <div className="flex flex-col items-center mb-12">
          <motion.div 
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center shadow-2xl shadow-slate-900/20 mb-8"
          >
            <Scale className="text-white w-12 h-12" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-center text-slate-900 mb-4"
          >
            {isLogin ? 'Counsel Authentication' : 'Establish Legal Credentials'}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 text-center text-lg font-medium max-w-sm"
          >
            {isLogin ? 'Access your professional jurisprudential drafting suite' : 'Initiate professional legal instrument formulation via AI'}
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full pl-16 pr-6 py-5 bg-white/50 border border-white/50 rounded-[24px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-lg font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full pl-16 pr-6 py-5 bg-white/50 border border-white/50 rounded-[24px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-lg font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-16 pr-6 py-5 bg-white/50 border border-white/50 rounded-[24px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-lg font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-6 rounded-[24px] font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 shadow-2xl shadow-slate-900/20 text-xl"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Authenticate' : 'Register Credentials'}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-500 hover:text-slate-900 font-bold transition-colors text-lg"
          >
            {isLogin ? "Lacking credentials? Register here" : "Existing credentials? Authenticate here"}
          </button>
        </div>

        <div className="mt-12 pt-12 border-t border-white/50 flex items-center justify-center gap-8 opacity-40">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            Secure
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <Gavel className="w-4 h-4" />
            Compliant
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
