import React, { useState, useMemo } from 'react';
import { Trophy, Clock, CheckCircle2, Share, CalendarDays, Dumbbell, Flame, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../App';

export default function HistoryView({ history, library }) {
  const activePlan = library?.find(p => p.status === 'active');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    return `${m} min`;
  };

  const formatDate = (ts) => {
    return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
  };

  // Analytics
  const stats = useMemo(() => {
    const totalWorkouts = history.length;
    const totalVolume = history.reduce((sum, s) => sum + (s.volume || 0), 0);
    
    // Personal records (max weight per exercise)
    const prMap = {};
    history.forEach(session => {
      session.exercises?.forEach(ex => {
        ex.sets?.forEach(s => {
          if (s.completed && s.weight > 0 && !s.isWarmup) {
            const name = ex.exerciseName;
            if (!prMap[name] || s.weight > prMap[name].weight) {
              prMap[name] = { weight: s.weight, reps: s.reps, date: session.date };
            }
          }
        });
      });
    });
    const personalRecords = Object.entries(prMap).map(([name, data]) => ({ name, ...data }));
    personalRecords.sort((a, b) => b.weight - a.weight);

    return { totalWorkouts, totalVolume, personalRecords };
  }, [history]);

  // Calendar data
  const workoutDates = useMemo(() => {
    const map = {};
    history.forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [history]);

  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Mon = 0
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calendarMonth]);

  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  const prevMonth = () => setCalendarMonth(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
  const nextMonth = () => setCalendarMonth(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });

  const chartData = [...history].slice(0, 10).reverse();
  const maxVol = Math.max(...chartData.map(h => h.volume), 1);

  const shareResults = async (session) => {
    let text = `🏋️ Allenamento Completato!\n`;
    text += `Volume Totale: ${session.volume.toLocaleString()} kg\n`;
    text += `Esercizi:\n`;
    
    session.exercises.forEach(ex => {
      const completedSets = ex.sets.filter(s => s.completed).length;
      if (completedSets > 0) {
        text += `- ${completedSets}x ${ex.exerciseName}\n`;
      }
    });
    
    text += `\nCreato con FitTrack Ultra 🚀`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Il mio allenamento su FitTrack Ultra',
          text: text,
        });
      } catch (err) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Risultati copiati negli appunti!');
    }
  };

  return (
    <div className="p-6 pb-32 space-y-6">
      <header className="pt-8 mb-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
          Storico
        </h1>
        <p className="text-muted mt-2">I tuoi progressi nel tempo</p>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border/50 rounded-2xl p-4 text-center shadow-soft">
          <Dumbbell size={16} className="text-accentBlue mx-auto mb-2" />
          <div className="text-2xl font-bold tracking-tighter">{stats.totalWorkouts}</div>
          <div className="text-[10px] uppercase font-bold text-muted tracking-widest mt-1">Allenamenti</div>
        </div>
        <div className="bg-surface border border-border/50 rounded-2xl p-4 text-center shadow-soft">
          <Flame size={16} className="text-accentOrange mx-auto mb-2" />
          <div className="text-2xl font-bold tracking-tighter">{stats.totalVolume > 999 ? `${(stats.totalVolume / 1000).toFixed(1)}k` : stats.totalVolume}</div>
          <div className="text-[10px] uppercase font-bold text-muted tracking-widest mt-1">Volume (kg)</div>
        </div>
        <div className="bg-surface border border-border/50 rounded-2xl p-4 text-center shadow-soft">
          <Award size={16} className="text-[#FFD700] mx-auto mb-2" />
          <div className="text-2xl font-bold tracking-tighter">{stats.personalRecords.length}</div>
          <div className="text-[10px] uppercase font-bold text-muted tracking-widest mt-1">Record</div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <section className="bg-surface/40 border border-border/50 rounded-[28px] p-5 shadow-soft backdrop-blur-md">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-white/10 text-muted hover:text-white transition-colors"><ChevronLeft size={18} /></button>
          <h3 className="font-bold text-sm tracking-tight">{monthNames[calendarMonth.month]} {calendarMonth.year}</h3>
          <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-white/10 text-muted hover:text-white transition-colors"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (
            <div key={i} className="text-[9px] font-bold text-muted uppercase py-1">{d}</div>
          ))}
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            
            const dayDate = new Date(calendarMonth.year, calendarMonth.month, day);
            const dayOfWeek = dayDate.getDay();
            const dayOfWeekAdjusted = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0
            const planDay = activePlan?.days.find(d => d.dayOfWeek === dayOfWeekAdjusted);
            const isScheduled = planDay && (planDay.exercises.length > 0 || planDay.tags?.length > 0);
            
            const key = `${calendarMonth.year}-${calendarMonth.month}-${day}`;
            const count = workoutDates[key] || 0;
            const today = new Date();
            const isToday = day === today.getDate() && calendarMonth.month === today.getMonth() && calendarMonth.year === today.getFullYear();
            
            return (
              <div key={day} className="relative aspect-square flex items-center justify-center">
                {isToday && <div className="absolute inset-0 border border-white/50 rounded-lg z-10" />}
                <div className={cn(
                  "w-7 h-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center border",
                  count > 0 
                    ? "bg-green-500 text-black border-green-500 shadow-[0_0_10px_rgba(52,199,89,0.3)]" 
                    : (isScheduled ? "bg-accentOrange/10 text-accentOrange border-accentOrange/30 border-dashed" : "text-muted/40 border-transparent")
                )}>
                  {day}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Personal Records (top 5) */}
      {stats.personalRecords.length > 0 && (
        <section className="bg-surface/40 border border-border/50 rounded-[28px] p-5 shadow-soft backdrop-blur-md">
          <h3 className="text-sm font-medium text-muted mb-4 flex items-center"><Award size={16} className="mr-2 text-[#FFD700]"/>Record Personali</h3>
          <div className="space-y-2">
            {stats.personalRecords.slice(0, 5).map((pr, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                <span className="text-sm font-medium truncate flex-1 mr-4">{pr.name}</span>
                <span className="text-sm font-bold font-mono text-accentOrange whitespace-nowrap">{pr.weight} kg × {pr.reps}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Volume Chart */}
      {history.length > 0 && (
        <section className="bg-surface/40 border border-border/50 rounded-[28px] p-5 shadow-soft backdrop-blur-md">
          <h3 className="text-sm font-medium text-muted mb-6 flex items-center"><Trophy size={16} className="mr-2 text-accentOrange"/> Trend Volume</h3>
          <div className="h-28 flex items-end space-x-2 w-full">
            {chartData.map((session) => {
              const heightPct = Math.max((session.volume / maxVol) * 100, 5);
              return (
                <div key={session.id} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="absolute -top-8 bg-black border border-border text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono shadow-soft">
                    {session.volume} kg
                  </div>
                  <div 
                    className="w-full bg-gradient-to-t from-accentBlue/20 to-accentBlue rounded-t-md transition-all duration-500 shadow-[0_0_10px_rgba(10,132,255,0.2)]" 
                    style={{ height: `${heightPct}%` }}
                  ></div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Session Cards */}
      <motion.section layout className="space-y-4">
        <h3 className="text-sm font-medium text-muted flex items-center"><CalendarDays size={16} className="mr-2 text-muted"/> Sessioni Recenti</h3>
        <AnimatePresence>
          {history.length === 0 ? (
            <motion.div layout className="bg-surface/30 border border-border border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center text-center space-y-4">
              <Trophy className="text-muted/50" size={48} />
              <p className="text-muted">Nessun allenamento registrato.</p>
            </motion.div>
          ) : (
            history.map(session => (
              <motion.div layout key={session.id} className="bg-surface border border-border/50 rounded-3xl p-5 flex flex-col space-y-4 shadow-soft group hover:border-border transition-colors relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-border/50 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-border shadow-inner">
                      <CheckCircle2 className="text-green-500" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{formatDate(session.date)}</h4>
                      <span className="text-xs text-muted flex items-center mt-1"><Clock size={12} className="mr-1 opacity-70"/> {formatTime(session.duration)}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="block text-2xl font-bold tracking-tighter text-accentBlue">{session.volume.toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Kg Vol.</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {session.exercises.map((ex, i) => {
                    const completedSets = ex.sets.filter(s => s.completed).length;
                    if (completedSets === 0) return null;
                    return (
                      <span key={i} className="text-xs bg-black border border-border px-3 py-1.5 rounded-full text-muted flex items-center">
                        <span className="font-semibold text-white mr-1.5">{completedSets}x</span> {ex.exerciseName}
                      </span>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => shareResults(session)}
                    className="w-full mt-2 bg-black/40 border border-border/50 text-white text-xs font-semibold rounded-2xl py-2.5 hover:bg-black transition-colors flex items-center justify-center space-x-2"
                  >
                    <Share size={14} className="text-accentOrange" />
                    <span>Condividi Risultati</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
