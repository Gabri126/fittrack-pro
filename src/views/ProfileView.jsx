import React, { useState, useMemo } from 'react';
import { User, Mail, Lock, ChevronRight, LogOut, Search, UserPlus, UserMinus, Trophy, Flame, Target, Dumbbell, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../App';
import { useSupabase } from '../contexts/SupabaseContext';

const GOALS = ['Ipertrofia', 'Forza', 'Dimagrimento', 'Resistenza', 'Atletica'];
const LEVELS = [
  { name: 'Principiante', xpTarget: 1000, volTarget: 3000 },
  { name: 'Intermedio', xpTarget: 5000, volTarget: 5000 },
  { name: 'Avanzato', xpTarget: 15000, volTarget: 8000 },
  { name: 'Elite', xpTarget: 50000, volTarget: 12000 },
];

export default function ProfileView({ history, library, setCurrentTab }) {
  const ctx = useSupabase();
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [weight, setWeight] = useState('75');
  const [height, setHeight] = useState('175');
  const [goal, setGoal] = useState('Ipertrofia');
  const [level, setLevel] = useState('Intermedio');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [followedIds, setFollowedIds] = useState([]);

  const stats = useMemo(() => {
    if (!history || history.length === 0) return { totalVol: 0, totalSessions: 0, avgRpe: 0, streak: 0 };
    const totalVol = history.reduce((a, s) => a + (s.volume || 0), 0);
    const allSets = history.flatMap(s => s.exercises?.flatMap(e => e.sets || []) || []);
    const rpeSets = allSets.filter(s => s.rpe);
    const avgRpe = rpeSets.length ? (rpeSets.reduce((a, s) => a + s.rpe, 0) / rpeSets.length).toFixed(1) : '—';
    return { totalVol, totalSessions: history.length, avgRpe, streak: Math.min(history.length, 7) };
  }, [history]);

  const handleAuth = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = authMode === 'login'
        ? await ctx.signInWithEmail(email, password)
        : await ctx.signUpWithEmail(email, password, username); // Aggiunto 'username' qui

      if (res.error) {
        console.dir(res.error); // Ispezione dettagliata dell'oggetto errore
        setAuthError(res.error.message);
      } else {
        setOnboardingStep(1);
      }
    } catch (e) {
      console.error("Errore critico durante l'autenticazione:", e);
      setAuthError(e.message);
    }
    setAuthLoading(false);
  };

  const handleFinishOnboarding = async () => {
    await ctx.updateProfile({ username, goal, level, weight: parseFloat(weight), height: parseFloat(height) });
    setOnboardingStep(3);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const results = await ctx.searchUsers(searchQuery);
    setSearchResults(results);
  };

  const handleFollow = async (userId) => {
    await ctx.followUser(userId);
    setFollowedIds(prev => [...prev, userId]);
  };

  // --- NOT LOGGED IN: Onboarding Flow ---
  if (!ctx?.session && !ctx?.profile) {
    return (
      <div className="flex flex-col h-full bg-black text-white overflow-y-auto hide-scrollbar pb-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-accentBlue/10 blur-[120px] rounded-full pointer-events-none" />

        <header className="px-6 pt-14 pb-8 relative z-10 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 bg-accentBlue/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-accentBlue/30">
            <Dumbbell size={36} className="text-accentBlue" />
          </motion.div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">FitTrack Ultra</h1>
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mt-2">Il tuo coach personale</p>
        </header>

        <div className="px-6 relative z-10 space-y-4">
          {/* Auth Tabs */}
          <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
            <button onClick={() => setAuthMode('login')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all", authMode === 'login' ? "bg-white text-black" : "text-muted")}>Accedi</button>
            <button onClick={() => setAuthMode('signup')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all", authMode === 'signup' ? "bg-white text-black" : "text-muted")}>Registrati</button>
          </div>

          {/* Email */}
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold placeholder:text-muted/50 focus:border-accentBlue/50 outline-none transition-all" />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold placeholder:text-muted/50 focus:border-accentBlue/50 outline-none transition-all" />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>

          {authMode === 'signup' && (
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold placeholder:text-muted/50 focus:border-accentBlue/50 outline-none transition-all" />
            </div>
          )}

          {authError && <p className="text-red-400 text-xs font-bold text-center px-4">{authError}</p>}

          <button onClick={handleAuth} disabled={authLoading || !email || !password} className="w-full bg-white text-black font-black py-4 rounded-2xl text-sm uppercase italic shadow-2xl active:scale-95 transition-all disabled:opacity-30">
            {authLoading ? '...' : authMode === 'login' ? 'Accedi' : 'Crea Account'}
          </button>

          <button onClick={() => ctx.signInWithGoogle()} className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all">
            Continua con Google
          </button>

          {/* Skip for offline */}
          <button onClick={() => setCurrentTab('editor')} className="w-full text-muted text-[10px] font-black uppercase tracking-widest py-4 active:opacity-50">
            Continua senza account →
          </button>
        </div>
      </div>
    );
  }

  // --- LOGGED IN: Profile Dashboard ---
  return (
    <div className="flex flex-col h-full bg-black text-white overflow-y-auto hide-scrollbar pb-32">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-accentBlue/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="px-6 pt-14 pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">{ctx.profile?.username || 'Atleta'}</h1>
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{ctx.profile?.goal || 'Ipertrofia'} · {ctx.profile?.level || 'Intermedio'}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={cn("w-3 h-3 rounded-full", ctx.isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
            <button onClick={() => ctx.signOut()} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-all">
              <LogOut size={18} className="text-muted" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="px-6 pb-6 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Volume Totale', value: stats.totalVol > 9999 ? `${(stats.totalVol / 1000).toFixed(0)}k` : stats.totalVol.toLocaleString(), unit: 'KG', color: 'text-accentBlue' },
            { label: 'Sessioni', value: stats.totalSessions, unit: '', color: 'text-white' },
            { label: 'Avg RPE', value: stats.avgRpe, unit: '', color: 'text-accentOrange' },
            { label: 'Streak', value: stats.streak, unit: 'GG', color: 'text-green-400' },
          ].map((s, i) => (
            <div key={i} className="bg-surface/40 border border-white/5 rounded-3xl p-4 text-center">
              <span className={cn("text-2xl font-black italic", s.color)}>{s.value}</span>
              {s.unit && <span className="text-[8px] font-black text-muted ml-1">{s.unit}</span>}
              <p className="text-[8px] font-black text-muted uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search Friends */}
      <div className="px-6 pb-6 relative z-10 space-y-3">
        <h3 className="text-xs font-black text-muted uppercase tracking-widest flex items-center"><Search size={14} className="mr-2" /> Cerca Amici</h3>
        <div className="flex gap-2">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Username..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold placeholder:text-muted/50 outline-none focus:border-accentBlue/50 transition-all" />
          <button onClick={handleSearch} className="px-5 bg-accentBlue/20 border border-accentBlue/30 text-accentBlue rounded-2xl font-black text-xs uppercase active:scale-95 transition-all">Cerca</button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accentBlue/10 rounded-full flex items-center justify-center border border-accentBlue/20 text-accentBlue font-black text-sm">{(u.username || '?')[0].toUpperCase()}</div>
                  <div>
                    <span className="text-sm font-bold text-white">{u.username}</span>
                    <p className="text-[9px] font-bold text-muted uppercase">{u.level || 'Intermedio'}</p>
                  </div>
                </div>
                <button onClick={() => handleFollow(u.id)} disabled={followedIds.includes(u.id)} className={cn("p-2 rounded-xl transition-all", followedIds.includes(u.id) ? "text-green-400 opacity-50" : "bg-accentBlue/20 text-accentBlue active:scale-90")}>
                  {followedIds.includes(u.id) ? <UserMinus size={18} /> : <UserPlus size={18} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PR List */}
      {history.length > 0 && (
        <div className="px-6 pb-8 relative z-10 space-y-3">
          <h3 className="text-xs font-black text-muted uppercase tracking-widest flex items-center"><Trophy size={14} className="mr-2 text-yellow-500" /> Record Personali</h3>
          <div className="space-y-2">
            {(() => {
              const bests = {};
              [...history].reverse().forEach(s => {
                s.exercises?.forEach(ex => {
                  const best = ex.sets?.reduce((m, set) => (set.weight > (m?.weight || 0) ? set : m), null);
                  if (best && (!bests[ex.exerciseName] || best.weight > bests[ex.exerciseName].weight)) {
                    bests[ex.exerciseName] = { name: ex.exerciseName, weight: best.weight, reps: best.reps };
                  }
                });
              });
              return Object.values(bests).slice(0, 8).map((pr, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-3">
                  <span className="text-xs font-bold text-white truncate flex-1">{pr.name}</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-black text-white italic">{pr.weight}</span>
                    <span className="text-[8px] font-black text-accentOrange">KG</span>
                    <span className="text-[9px] font-bold text-muted ml-2">x{pr.reps}</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
