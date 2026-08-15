import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Shield,
  CheckCircle,
  AlertCircle,
  LogIn,
  UserPlus,
  Sparkles,
  ArrowRight,
  LogOut,
  Database
} from 'lucide-react';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logoutFirebase
} from '../services/firebaseService';
import { auth } from '../services/firebaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUser = auth.currentUser;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (password.length < 6) {
          throw new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
        }
        await registerWithEmail(email, password, displayName);
        setSuccessMsg('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে এবং ডাটা সিঙ্ক চালু রয়েছে!');
      } else {
        await loginWithEmail(email, password);
        setSuccessMsg('লগইন সফল হয়েছে! আপনার সমস্ত বুকিং ও ওয়ালেট সিঙ্ক হচ্ছে।');
      }
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      let msg = err.message || 'একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। দয়া করে লগইন করুন।';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'কোনো অ্যাকাউন্ট পাওয়া যায়নি। দয়া করে রেজিস্ট্রেশন করুন।';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        setSuccessMsg('গুগল দিয়ে লগইন সফল হয়েছে!');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1000);
      } else {
        // User closed popup
        setError('গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে। আপনি চাইলে নিচে ইমেইল ও পাসওয়ার্ড দিয়ে সরাসরি লগইন করতে পারেন।');
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError('গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে। আপনি চাইলে নিচে ইমেইল ও পাসওয়ার্ড দিয়ে সরাসরি লগইন করতে পারেন।');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('ব্রাউজারে পপআপ ব্লক করা রয়েছে। দয়া করে পপআপ অনুমোদন করুন অথবা নিচে ইমেইল/পাসওয়ার্ড ফর্ম ব্যবহার করুন।');
      } else {
        setError(err?.message || 'গুগল সাইন-ইন সম্পন্ন করা যায়নি।');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutFirebase();
      setSuccessMsg('সফলভাবে লগআউট হয়েছে।');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'লগআউট ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="firebase-auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div
        id="firebase-auth-modal-content"
        className="w-full max-w-md bg-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="auth-modal-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              {currentUser ? 'Firebase অ্যাকাউন্ট স্টেটাস' : isRegister ? 'নতুন অ্যাকাউন্ট খুলুন' : 'অ্যাকাউন্টে লগইন করুন'}
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </h2>
            <p className="text-xs text-slate-400">
              {currentUser
                ? 'Firestore ক্লাউডে আপনার ডাটা রিয়েল-টাইম সেভ হচ্ছে'
                : 'বুকিং, ক্যাশব্যাক ও ট্রাভেল হিস্টোরি সুরক্ষিত রাখতে সাইন-ইন করুন'}
            </p>
          </div>
        </div>

        {/* Logged in state */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border border-blue-500/40 bg-slate-800"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {currentUser.displayName || 'TON Traveler'}
                  </h4>
                  <p className="text-xs text-slate-400">{currentUser.email}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Firestore Cloud Sync Active</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>User ID:</span>
                <span className="font-mono text-slate-300">{currentUser.uid.substring(0, 12)}...</span>
              </div>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              id="auth-logout-btn"
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>লগআউট করুন</span>
            </button>
          </div>
        ) : (
          /* Form for Login / Registration */
          <div className="space-y-4">
            {/* Google Sign In */}
            <button
              id="google-signin-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>গুগল দিয়ে দ্রুত লগইন করুন</span>
            </button>

            <div className="flex items-center gap-2 my-2 text-slate-500 text-xs">
              <div className="h-px bg-slate-800 flex-1" />
              <span>অথবা ইমেইল ব্যবহার করুন</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">আপনার নাম</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="auth-name-input"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Rahat Al-Amin"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ইমেইল ঠিকানা</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="auth-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">পাসওয়ার্ড</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="auth-password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 active:scale-98 mt-2"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : isRegister ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>রেজিস্ট্রেশন সম্পন্ন করুন</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>লগইন করুন</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs text-cyan-400 hover:underline font-bold"
              >
                {isRegister
                  ? 'ইতোমধ্যে অ্যাকাউন্ট আছে? লগইন করুন'
                  : 'নতুন অ্যাকাউন্ট তৈরি করতে এখানে ক্লিক করুন'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
