import React, { useState } from 'react';
import { Plus, BrainCircuit, ScanLine, Dumbbell, Calendar, ChevronRight, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { cn } from '../App';

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const initialForm = { exerciseName: '', sets: '', reps: '', weight: '' };

export default function EditorView({ weeklyData, setWeeklyData }) {
  const [activeDay, setActiveDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [inputMode, setInputMode] = useState('manual');
  const [formData, setFormData] = useState(initialForm);
  const [aiText, setAiText] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const currentDayWorkouts = weeklyData[activeDay] || [];
  
  const addWorkout = (workout) => {
    setWeeklyData(prev => {
      const dayData = prev[activeDay] || [];
      return { ...prev, [activeDay]: [...dayData, { id: `w-${Date.now()}-${Math.random()}`, ...workout }] };
    });
  };

  const removeWorkout = (id) => {
    setWeeklyData(prev => {
      const dayData = prev[activeDay] || [];
      return { ...prev, [activeDay]: dayData.filter(w => w.id !== id) };
    });
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const { exerciseName, sets, reps, weight } = formData;
    if (!exerciseName.trim() || !sets || !reps || !weight) return;
    addWorkout({ exerciseName: exerciseName.trim(), sets: parseInt(sets, 10), reps: parseInt(reps, 10), weight: parseFloat(weight) });
    setFormData(initialForm);
  };

  const handleAiSubmit = () => {
    if (!aiText.trim()) return;
    const lines = aiText.split('\n');
    lines.forEach(line => {
      const match = line.match(/(\d+)\s*[xX*]\s*(\d+)\s+(.+)/);
      if (match) addWorkout({ exerciseName: match[3].trim(), sets: parseInt(match[1], 10), reps: parseInt(match[2], 10), weight: 0 });
    });
    setAiText('');
  };

  const handleVisionScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      addWorkout({ exerciseName: "Esercizio Scansionato", sets: 3, reps: 10, weight: 20 });
    }, 2500);
  };

  const totalVolume = currentDayWorkouts.reduce((acc, curr) => acc + (curr.sets * curr.reps * curr.weight), 0);

  return (
    <div className="p-6 space-y-8 pb-32">
       <header className="pt-8 mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent mb-6">
          Editor Schede
        </h1>
        {/* Weekly Tabs */}
        <div className="flex space-x-3 overflow-x-auto hide-scrollbar pb-2">
          {DAYS.map((day, idx) => {
            const isActive = activeDay === idx;
            const hasData = weeklyData[idx] && weeklyData[idx].length > 0;
            return (
              <button key={day} onClick={() => setActiveDay(idx)} className={cn("relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex-shrink-0 flex items-center space-x-1.5", isActive ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-surface text-muted hover:text-white border border-border/50")}>
                <span>{day}</span>
                {!isActive && hasData && <span className="w-1.5 h-1.5 rounded-full bg-accentBlue shadow-[0_0_5px_rgba(10,132,255,0.8)]"></span>}
              </button>
            );
          })}
        </div>
      </header>

      {/* DASHBOARD */}
      <section className="bg-gradient-to-br from-surface to-[#0A0A0A] border border-border/50 rounded-[32px] p-6 shadow-soft flex justify-between items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-accentBlue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div>
            <p className="text-sm text-muted font-medium mb-1">Volume Pianificato</p>
            <div className="flex items-baseline space-x-1">
              <span className="text-4xl font-bold tracking-tighter">{totalVolume.toLocaleString()}</span>
              <span className="text-muted font-medium text-sm">kg</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-accentBlue/10 flex items-center justify-center border border-accentBlue/20 shadow-[0_0_20px_rgba(10,132,255,0.15)]">
            <Dumbbell className="text-accentBlue" size={24} />
          </div>
      </section>

      {/* INPUT */}
      <section className="bg-surface/50 border border-border/50 rounded-[32px] p-2 backdrop-blur-md shadow-soft">
        <div className="flex space-x-1 mb-4 p-1 bg-black/40 rounded-full">
            {['manual', 'ai', 'vision'].map((mode) => (
              <button key={mode} onClick={() => setInputMode(mode)} className={cn("flex-1 py-2.5 rounded-full text-xs font-semibold capitalize transition-all duration-300 flex justify-center items-center space-x-2", inputMode === mode ? "bg-white text-black shadow-sm" : "text-muted hover:text-white")}>
                {mode === 'manual' && <Plus size={14} />}
                {mode === 'ai' && <BrainCircuit size={14} />}
                {mode === 'vision' && <ScanLine size={14} />}
                <span>{mode}</span>
              </button>
            ))}
        </div>
        <div className="p-4">
           {inputMode === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <input type="text" placeholder="Esercizio (es. Panca Piana)" value={formData.exerciseName} onChange={(e) => setFormData({...formData, exerciseName: e.target.value})} className="w-full bg-black/50 border border-border rounded-3xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accentBlue/50 transition-all placeholder:text-muted/60" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative"><span className="absolute left-4 top-4 text-xs text-muted font-medium">Set</span><input type="number" value={formData.sets} onChange={(e) => setFormData({...formData, sets: e.target.value})} className="w-full bg-black/50 border border-border rounded-3xl pl-12 pr-3 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accentBlue/50 transition-all font-mono" min="1" /></div>
                  <div className="relative"><span className="absolute left-4 top-4 text-xs text-muted font-medium">Rep</span><input type="number" value={formData.reps} onChange={(e) => setFormData({...formData, reps: e.target.value})} className="w-full bg-black/50 border border-border rounded-3xl pl-12 pr-3 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accentBlue/50 transition-all font-mono" min="1" /></div>
                  <div className="relative"><span className="absolute left-4 top-4 text-xs text-muted font-medium">Kg</span><input type="number" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="w-full bg-black/50 border border-border rounded-3xl pl-10 pr-3 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accentBlue/50 transition-all font-mono" min="0" step="0.5" /></div>
                </div>
                <button type="submit" className="w-full bg-white text-black font-semibold rounded-3xl py-4 hover:bg-neutral-200 transition-colors flex items-center justify-center space-x-2 active:scale-[0.98]"><Plus size={18} /><span>Aggiungi</span></button>
              </form>
            )}
            {inputMode === 'ai' && (
              <div className="space-y-4">
                <textarea value={aiText} onChange={(e) => setAiText(e.target.value)} placeholder="Incolla qui la tua scheda..." className="w-full bg-black/50 border border-border rounded-3xl px-5 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-accentOrange/50 transition-all placeholder:text-muted/60 min-h-[140px] resize-none leading-relaxed" />
                <button onClick={handleAiSubmit} className="w-full bg-gradient-to-r from-accentOrange to-orange-500 text-white font-semibold rounded-3xl py-4 hover:opacity-90 flex items-center justify-center space-x-2 active:scale-[0.98]"><BrainCircuit size={18} /><span>Genera Blocchi</span></button>
              </div>
            )}
            {inputMode === 'vision' && (
              <div className="space-y-4">
                <div className="h-40 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center bg-black/20 text-muted overflow-hidden relative">
                  {isScanning ? (
                    <div className="flex flex-col items-center space-y-3 z-10"><div className="w-10 h-10 border-4 border-accentBlue border-t-transparent rounded-full animate-spin"></div><span className="text-sm font-medium animate-pulse text-accentBlue">Scansione e Analisi...</span></div>
                  ) : (
                    <><ScanLine size={36} className="mb-3 opacity-50" /><span className="text-sm font-medium">Inquadra la tua scheda cartacea</span></>
                  )}
                  {isScanning && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accentBlue/10 to-transparent animate-[scan_2s_ease-in-out_infinite]"></div>}
                </div>
                <button onClick={handleVisionScan} disabled={isScanning} className="w-full bg-white text-black font-semibold rounded-3xl py-4 hover:bg-neutral-200 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98]"><ScanLine size={18} /><span>{isScanning ? "Elaborazione in corso" : "Scatta Foto"}</span></button>
              </div>
            )}
        </div>
      </section>

      {/* LIST */}
      <section className="space-y-4">
          <div className="flex justify-between items-end mb-4 px-2">
            <h2 className="text-2xl font-bold tracking-tight">Piano di Oggi</h2>
            <span className="text-xs font-medium text-muted bg-surface px-3 py-1.5 rounded-full border border-border">{currentDayWorkouts.length} Sessioni</span>
          </div>

          {currentDayWorkouts.length === 0 ? (
            <div className="bg-surface/30 border border-border border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center text-center space-y-4 mt-8 backdrop-blur-sm">
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-border/50"><Calendar className="text-muted" size={32} /></div>
              <div><h3 className="text-xl font-semibold text-white mb-2">Giorno Libero?</h3><p className="text-sm text-muted">Nessun allenamento programmato per {DAYS[activeDay]}.</p></div>
            </div>
          ) : (
            <div className="space-y-3">
              {currentDayWorkouts.map((workout) => (
                <div key={workout.id} className="bg-surface border border-border/50 rounded-3xl p-5 flex items-center justify-between group shadow-soft">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-border"><Dumbbell size={20} className="text-muted" /></div>
                    <div>
                      <h3 className="font-semibold text-base mb-0.5">{workout.exerciseName}</h3>
                      <div className="flex items-center space-x-3 text-xs text-muted font-mono">
                        <span>{workout.sets} Sets</span><span className="opacity-30">•</span><span>{workout.reps} Reps</span>
                        {workout.weight > 0 && <><span className="opacity-30">•</span><span className="text-accentBlue font-medium px-2 py-0.5 bg-accentBlue/10 rounded-full">{workout.weight} kg</span></>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeWorkout(workout.id)} className="w-10 h-10 flex items-center justify-center bg-black/50 text-muted rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}
