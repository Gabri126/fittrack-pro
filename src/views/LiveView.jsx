import React, { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle2, Trophy } from 'lucide-react';
import { cn } from '../App';

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export default function LiveView({ weeklyData, activeWorkout, setActiveWorkout, setHistory, startTimer, resetTimer, setCurrentTab }) {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [elapsed, setElapsed] = useState(0);

  // Timer per la durata dell'allenamento
  useEffect(() => {
    let interval;
    if (activeWorkout) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkout]);

  const startWorkout = () => {
    const planned = weeklyData[selectedDay] || [];
    if (planned.length === 0) return;
    
    const exercises = planned.map(ex => {
      const sets = Array.from({ length: ex.sets }).map((_, i) => ({
        id: `set-${Date.now()}-${i}`,
        plannedReps: ex.reps,
        plannedWeight: ex.weight,
        reps: ex.reps,
        weight: ex.weight,
        completed: false
      }));
      return { ...ex, sets };
    });

    setActiveWorkout({
      id: `session-${Date.now()}`,
      dayIdx: selectedDay,
      startTime: Date.now(),
      exercises
    });
  };

  const endWorkout = () => {
    if (!activeWorkout) return;
    const endTime = Date.now();
    const duration = Math.floor((endTime - activeWorkout.startTime) / 1000);
    
    // Calcola volume reale solo sui set completati
    let realVolume = 0;
    activeWorkout.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          realVolume += s.reps * s.weight;
        }
      });
    });

    const session = {
      id: activeWorkout.id,
      date: endTime,
      duration,
      volume: realVolume,
      exercises: activeWorkout.exercises
    };

    setHistory(prev => [session, ...prev]);
    setActiveWorkout(null);
    resetTimer();
    setCurrentTab('history');
  };

  const toggleSet = (exId, setId) => {
    setActiveWorkout(prev => {
      const newEx = prev.exercises.map(ex => {
        if (ex.id !== exId) return ex;
        const newSets = ex.sets.map(s => {
          if (s.id !== setId) return s;
          const wasCompleted = s.completed;
          if (!wasCompleted) startTimer(); // Avvia timer di recupero quando completi
          return { ...s, completed: !wasCompleted };
        });
        return { ...ex, sets: newSets };
      });
      return { ...prev, exercises: newEx };
    });
  };

  const updateSet = (exId, setId, field, value) => {
    setActiveWorkout(prev => {
      const newEx = prev.exercises.map(ex => {
        if (ex.id !== exId) return ex;
        const newSets = ex.sets.map(s => {
          if (s.id !== setId) return s;
          return { ...s, [field]: Number(value) };
        });
        return { ...ex, sets: newSets };
      });
      return { ...prev, exercises: newEx };
    });
  };

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
    return `${m}:${secs.toString().padStart(2,'0')}`;
  };

  if (!activeWorkout) {
    return (
      <div className="p-6 pb-32 flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <div className="w-24 h-24 bg-accentBlue/10 rounded-full flex items-center justify-center border border-accentBlue/20 shadow-[0_0_30px_rgba(10,132,255,0.2)]">
          <PlayCircle size={48} className="text-accentBlue ml-2" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Pronto ad allenarti?</h2>
          <p className="text-muted">Seleziona la scheda da seguire</p>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto max-w-full pb-2 hide-scrollbar w-full justify-start md:justify-center px-4">
          {DAYS.map((day, idx) => {
             const hasData = weeklyData[idx] && weeklyData[idx].length > 0;
             return (
               <button key={day} onClick={() => setSelectedDay(idx)} className={cn("px-5 py-3 rounded-full text-sm font-semibold transition-all border shrink-0", selectedDay === idx ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-surface border-border/50 text-muted hover:text-white", !hasData && "opacity-50")}>
                 {day}
               </button>
             )
          })}
        </div>

        <button 
          onClick={startWorkout}
          disabled={!weeklyData[selectedDay] || weeklyData[selectedDay].length === 0}
          className="w-full max-w-sm bg-gradient-to-r from-accentBlue to-blue-500 text-white font-bold text-lg rounded-3xl py-4 shadow-[0_0_20px_rgba(10,132,255,0.4)] disabled:opacity-50 disabled:shadow-none hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          Inizia Allenamento
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-32 space-y-6">
      <header className="sticky top-0 z-30 pt-6 pb-4 bg-background/90 backdrop-blur-md border-b border-border/50 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
            <span className="w-2 h-2 rounded-full bg-accentBlue shadow-[0_0_8px_rgba(10,132,255,0.8)] animate-pulse mr-2"></span>
            Live: {DAYS[activeWorkout.dayIdx]}
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted font-mono uppercase tracking-wider block mb-1">Elapsed</span>
          <span className="text-2xl font-bold font-mono text-accentBlue">{formatElapsed(elapsed)}</span>
        </div>
      </header>

      <div className="space-y-6">
        {activeWorkout.exercises.map((ex, exIndex) => (
          <div key={ex.id} className="bg-surface border border-border/50 rounded-[32px] p-5 shadow-soft">
            <h3 className="font-bold text-lg mb-4">{exIndex + 1}. {ex.exerciseName}</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 px-2 text-xs font-semibold text-muted mb-2">
                <span className="w-6 text-center">Set</span>
                <span className="text-center">Kg</span>
                <span className="text-center">Reps</span>
                <span className="w-8"></span>
              </div>
              
              {ex.sets.map((set, setIndex) => (
                <div key={set.id} className={cn("grid grid-cols-[auto_1fr_1fr_auto] gap-3 items-center rounded-2xl p-2 transition-colors", set.completed ? "bg-accentBlue/10 border border-accentBlue/30" : "bg-black/30 border border-transparent")}>
                  <div className="w-6 text-center font-mono text-sm font-bold text-muted">{setIndex + 1}</div>
                  
                  <div className="relative">
                    <input 
                      type="number" 
                      value={set.weight} 
                      onChange={(e) => updateSet(ex.id, set.id, 'weight', e.target.value)}
                      disabled={set.completed}
                      className="w-full bg-surface border border-border rounded-xl text-center py-2.5 text-sm font-mono focus:ring-1 focus:ring-accentBlue outline-none disabled:opacity-50"
                      step="0.5"
                    />
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] text-muted bg-surface px-1.5 rounded border border-border/50">P: {set.plannedWeight}</span>
                  </div>

                  <div className="relative">
                    <input 
                      type="number" 
                      value={set.reps} 
                      onChange={(e) => updateSet(ex.id, set.id, 'reps', e.target.value)}
                      disabled={set.completed}
                      className="w-full bg-surface border border-border rounded-xl text-center py-2.5 text-sm font-mono focus:ring-1 focus:ring-accentBlue outline-none disabled:opacity-50"
                    />
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] text-muted bg-surface px-1.5 rounded border border-border/50">P: {set.plannedReps}</span>
                  </div>

                  <button 
                    onClick={() => toggleSet(ex.id, set.id)}
                    className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all", set.completed ? "bg-accentBlue text-white shadow-[0_0_15px_rgba(10,132,255,0.5)]" : "bg-surface text-muted hover:text-white border border-border active:scale-95")}
                  >
                    {set.completed ? <CheckCircle2 size={18} /> : <div className="w-3.5 h-3.5 rounded-full bg-border/50"></div>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6">
        <button onClick={endWorkout} className="w-full bg-surface/50 border border-border text-white font-bold rounded-3xl py-4 hover:bg-surface transition-colors flex items-center justify-center space-x-2 shadow-soft active:scale-[0.98]">
          <Trophy size={20} className="text-accentOrange" />
          <span>Concludi Allenamento</span>
        </button>
      </div>
    </div>
  );
}
