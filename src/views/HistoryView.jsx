import React, { useMemo, useState, useEffect } from 'react';
import { 
  Trophy, CalendarDays, CheckCircle2, Clock, 
  ArrowLeft, Share2, Award, ChevronRight, Activity, Users, Flame 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../App';
import { useSupabase } from '../contexts/SupabaseContext';

export default function HistoryView({ history, setCurrentTab }) {
  const ctx = useSupabase();
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'community'
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'community' && ctx?.session && ctx?.getFeed) {
      setFeedLoading(true);
      ctx.getFeed().then(data => {
        setFeed(data || []);
        setFeedLoading(false);
      });
    }
  }, [activeTab, ctx?.session]);
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    }).replace('.', '');
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const stats = useMemo(() => {
    if (!history || history.length === 0) return { totalVolume: 0, totalWorkouts: 0, personalRecords: [] };
    
    const totalVolume = history.reduce((acc, session) => acc + (session.volume || 0), 0);
    const totalWorkouts = history.length;
    
    // Simple PR logic for history view highlights
    const prs = [];
    const exerciseBests = {};
    
    [...history].reverse().forEach(session => {
      session.exercises?.forEach(ex => {
        const bestSet = ex.sets?.reduce((max, s) => (s.weight > (max?.weight || 0) ? s : max), null);
        if (bestSet && (!exerciseBests[ex.exerciseName] || bestSet.weight > exerciseBests[ex.exerciseName].weight)) {
          exerciseBests[ex.exerciseName] = { 
            name: ex.exerciseName, 
            weight: bestSet.weight, 
            reps: bestSet.reps,
            date: session.date
          };
        }
      });
    });
    
    return { totalVolume, totalWorkouts, personalRecords: Object.values(exerciseBests).sort((a, b) => b.date - a.date) };
  }, [history]);

  const trendsData = useMemo(() => {
    if (!history) return { data: [], maxVol: 1 };
    const weeks = {};
    const now = new Date();
    
    for (let i = 0; i < 4; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - (i * 7));
      const key = `Sett. ${4 - i}`;
      weeks[key] = 0;
    }

    history.forEach(session => {
      const d = new Date(session.date);
      const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24 * 7));
      if (diff < 4) {
        const key = `Sett. ${4 - diff}`;
        weeks[key] += (session.volume || 0);
      }
    });

    const data = Object.entries(weeks).map(([name, vol]) => ({ name, vol }));
    const maxVol = Math.max(...data.map(d => d.vol), 1);
    return { data, maxVol };
  }, [history]);

  const shareResults = () => {
    const lastSession = history[0];
    if (!lastSession) return;
    const text = `Ho appena completato un allenamento su FitTrack Pro! Volume: ${lastSession.volume}kg in ${formatTime(lastSession.duration)}.`;
    if (navigator.share) {
      navigator.share({ title: 'Mio Allenamento', text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
      alert('Risultati copiati negli appunti!');
    }
  };

  return (
    <div className="p-6 pb-32 space-y-6 h-full overflow-y-auto hide-scrollbar">
      <header className="pt-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none">Analisi Progressi</h1>
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-2">Dati & Performance Storica</p>
        </div>
        <button onClick={shareResults} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-all">
          <Share2 size={18} />
        </button>
      </header>

      {/* Tab Switcher */}
      <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
        <button onClick={() => setActiveTab('stats')} className={cn("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5", activeTab === 'stats' ? "bg-white text-black" : "text-muted")}>
          <Activity size={14} /> Statistiche
        </button>
        <button onClick={() => setActiveTab('community')} className={cn("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5", activeTab === 'community' ? "bg-white text-black" : "text-muted")}>
          <Users size={14} /> Community
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'stats' ? (
          <motion.div key="stats" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            {/* PR Highlights Slider */}
            {stats.personalRecords.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black text-muted uppercase tracking-widest flex items-center">
                    <Trophy size={14} className="mr-2 text-[#FFD700]" /> Nuovi Record
                  </h3>
                </div>
                <div className="flex space-x-3 overflow-x-auto hide-scrollbar pb-2">
                  {stats.personalRecords.slice(0, 6).map((pr, i) => (
                    <div key={i} className="shrink-0 w-40 bg-surface/40 border border-white/5 rounded-[24px] p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-[0.05] pointer-events-none">
                        <Award size={40} />
                      </div>
                      <h4 className="text-[10px] font-black text-muted uppercase truncate mb-1">{pr.name}</h4>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-xl font-black text-white italic">{pr.weight}</span>
                        <span className="text-[10px] font-bold text-accentOrange italic">KG</span>
                      </div>
                      <p className="text-[9px] font-bold text-white/50 mt-1">x{pr.reps} Reps</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Weekly Trends Chart */}
            <section className="bg-surface/40 border border-white/5 rounded-[32px] p-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Trend Volume (Mensile)</h3>
                <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 bg-accentBlue rounded-full shadow-[0_0_8px_rgba(10,132,255,0.5)]" />
                   <span className="text-[9px] font-bold text-muted uppercase italic">Progressione</span>
                </div>
              </div>
              
              <div className="h-32 flex items-end justify-between space-x-4 px-2">
                {trendsData.data.map((d, i) => {
                  const h = (d.vol / trendsData.maxVol) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono whitespace-nowrap z-10">
                        {Math.round(d.vol).toLocaleString()} kg
                      </div>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(h, 4)}%` }}
                        transition={{ type: 'spring', damping: 15, stiffness: 100, delay: i * 0.1 }}
                        className={cn(
                          "w-full rounded-t-xl transition-all shadow-lg",
                          i === 3 ? "bg-accentBlue shadow-accentBlue/20" : "bg-white/10"
                        )}
                      />
                      <span className="text-[8px] font-black text-muted uppercase mt-3 tracking-tighter">{d.name}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Compact Session List */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-muted uppercase tracking-widest">Sessioni Recenti</h3>
              </div>
              
              <div className="space-y-3">
                {history.length === 0 ? (
                   <div className="py-20 text-center space-y-4">
                     <CalendarDays size={48} className="mx-auto text-white/5" />
                     <p className="text-muted text-xs uppercase tracking-widest">Nessuna sessione trovata</p>
                   </div>
                ) : (
                  history.map(session => (
                    <div 
                      key={session.id}
                      className="bg-surface/40 border border-white/5 p-4 rounded-[28px] flex items-center justify-between hover:border-white/10 transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center space-x-4 shrink-0">
                        <div className="w-10 h-10 bg-accentBlue/10 rounded-2xl flex items-center justify-center border border-accentBlue/20 text-accentBlue">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white italic">{formatDate(session.date).split(',')[0]}</h4>
                          <span className="text-[10px] font-black text-muted uppercase tracking-widest">{formatTime(session.duration)}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-baseline justify-end space-x-1">
                          <span className="text-lg font-black text-white italic">{session.volume.toLocaleString()}</span>
                          <span className="text-[8px] font-black text-accentBlue italic">KG</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-muted uppercase tracking-widest">
                            {session.exercises?.length} Esercizi
                          </span>
                          {(() => {
                            const allSets = session.exercises?.flatMap(ex => ex.sets || []) || [];
                            const rpeSets = allSets.filter(s => s.rpe);
                            if (rpeSets.length === 0) return null;
                            const avgRpe = (rpeSets.reduce((acc, s) => acc + s.rpe, 0) / rpeSets.length).toFixed(1);
                            return (
                              <span className="text-[8px] font-black text-accentOrange uppercase tracking-tighter mt-0.5">
                                Avg RPE: {avgRpe}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div key="community" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
            {!ctx?.session ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={36} className="text-muted/30" />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Unisciti alla Community</h3>
                <p className="text-muted text-xs uppercase tracking-widest leading-relaxed px-8">Accedi al tuo profilo per vedere cosa stanno facendo i tuoi amici.</p>
              </div>
            ) : feedLoading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-accentBlue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted text-xs uppercase tracking-widest">Caricamento feed...</p>
              </div>
            ) : feed.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={36} className="text-muted/30" />
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tighter">Nessun aggiornamento</h3>
                <p className="text-muted text-xs uppercase tracking-widest leading-relaxed px-8">Segui altri atleti dal tuo profilo per vedere i loro progressi qui.</p>
              </div>
            ) : (
              feed.map((item, i) => (
                <motion.div 
                  key={item.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface/40 border border-white/5 rounded-[28px] p-4"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-accentBlue/10 rounded-full flex items-center justify-center border border-accentBlue/20 text-accentBlue font-black text-sm">
                      {(item.profiles?.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">{item.profiles?.username || 'Atleta'}</span>
                      <p className="text-[9px] font-bold text-muted uppercase">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Flame size={14} className="text-accentOrange" />
                    <span className="text-xs font-bold text-white/80">
                      Ha condiviso la scheda <span className="text-accentOrange italic">"{item.plan_data?.name || 'Allenamento'}"</span>
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
