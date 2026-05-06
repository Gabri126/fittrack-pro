import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlayCircle, CheckCircle2, Trophy, AlertTriangle, ArrowLeft, Heart, Flame, Dumbbell, Zap, Pause, Play, NotebookPen, X, RefreshCcw, RefreshCw, XCircle, ChevronRight, Activity, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '../App';
import { SingleScrollPicker, WeightScrollPicker, TimeScrollPicker } from '../components/Pickers';

const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const DAY_LABELS = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];

export default function LiveView({ 
  library, 
  activeWorkout, 
  setActiveWorkout, 
  setHistory, 
  history, 
  startTimer, 
  resetTimer, 
  setCurrentTab, 
  setIsTabBarHidden, 
  isTimerRunning, 
  timerLeft, 
  timerTotal, 
  isTimerFullscreen, 
  setIsTimerFullscreen, 
  elapsed, 
  setElapsed, 
  currentExerciseIndex, 
  setCurrentExerciseIndex 
}) {
  
  const activePlan = library?.find(p => p.status === 'active');

  // 1. TOP LEVEL SAFETY GUARD
  if (!activeWorkout && !activePlan) {
    return (
      <div className="flex flex-col h-full bg-black text-white p-8 items-center justify-center text-center">
        <Dumbbell size={64} className="text-muted/20 mb-6" />
        <h2 className="text-2xl font-bold mb-2 uppercase italic tracking-tighter">Nessun Allenamento</h2>
        <p className="text-muted text-sm max-w-xs leading-relaxed">Attiva un piano nel Laboratorio per sbloccare il briefing giornaliero e iniziare la sessione.</p>
        <button onClick={() => setCurrentTab('editor')} className="mt-8 bg-white text-black font-black uppercase tracking-widest px-8 py-3 rounded-full active:scale-95 transition-all text-xs">Vai al Laboratorio</button>
      </div>
    );
  }

  const todayDayOfWeek = new Date().getDay();
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayDayOfWeek);
  const [isWorkoutFinished, setIsWorkoutFinished] = useState(false);
  const [direction, setDirection] = useState(1);
  const [activePicker, setActivePicker] = useState(null); // 'reps', 'weight'
  const [activeSetTimer, setActiveSetTimer] = useState(null); // { left, total }
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    return () => setIsTabBarHidden(false);
  }, [setIsTabBarHidden]);

  useEffect(() => {
    if (isPaused || isWorkoutFinished || !activeWorkout) {
      setIsTabBarHidden(false);
    } else {
      setIsTabBarHidden(true);
    }
  }, [isPaused, isWorkoutFinished, activeWorkout, setIsTabBarHidden]);

  // PROTECTED DERIVED VARIABLES (Optional Chaining everywhere)
  const currentExercise = activeWorkout?.exercises?.[currentExerciseIndex] || null;
  const activeSetIndex = currentExercise ? currentExercise.sets.findIndex(s => !s.completed) : -1;
  const isExerciseDone = currentExercise && activeSetIndex === -1;
  const currentSet = currentExercise && activeSetIndex !== -1 ? currentExercise.sets[activeSetIndex] : null;
  const totalExercises = activeWorkout?.exercises?.length || 0;

  const currentVolume = useMemo(() => {
    if (!activeWorkout?.exercises) return 0;
    return activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed && !s.isWarmup).reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0), 0);
  }, [activeWorkout]);

  // BRIEFING DATA (Memoized)
  const briefingData = useMemo(() => {
    if (!activePlan) return null;
    const day = activePlan.days.find(d => d.dayOfWeek === selectedDayIndex);
    if (!day || day.exercises.length === 0) return null;

    let totalVol = 0;
    let warmup = 0;
    let work = 0;
    day.exercises.forEach(ex => {
      const sets = ex.setDetails || [];
      sets.forEach(s => {
        if (s.isWarmup) warmup++;
        else {
          work++;
          totalVol += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
        }
      });
    });
    return { volume: totalVol, warmup, work, exercisesCount: day.exercises.length, tags: day.tags || [] };
  }, [activePlan, selectedDayIndex]);

  // UTILS
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startWorkout = () => {
    if (!activePlan) return;
    const currentDay = activePlan.days.find(d => d.dayOfWeek === selectedDayIndex);
    if (!currentDay || currentDay.exercises.length === 0) return;
    
    const exercises = currentDay.exercises.map(ex => {
      const sourceSets = ex.setDetails || Array.from({ length: parseInt(ex.sets) || 1 }).map((_, i) => ({
        id: `set-${Date.now()}-${i}`, reps: ex.reps, weight: ex.weight, type: 'reps', isWarmup: false, restTime: null
      }));
      const sets = sourceSets.map(s => ({ ...s, completed: false, type: s.type || 'reps', isWarmup: s.isWarmup || false, restTime: s.restTime || null }));
      return { ...ex, id: `ex-${Date.now()}-${Math.random()}`, sets };
    });

    setActiveWorkout({
      id: `session-${Date.now()}`, dayId: currentDay.id, dayName: DAY_NAMES[currentDay.dayOfWeek], planName: activePlan.name, startTime: Date.now(), exercises
    });
    setCurrentExerciseIndex(0);
    setIsWorkoutFinished(false);
    setIsPaused(false);
    setElapsed(0);
    resetTimer();
  };

  const completeActiveSet = (exId, setIndex) => {
    if (!activeWorkout) return;
    setActiveWorkout(prev => {
      const exIdx = prev.exercises.findIndex(e => e.id === exId);
      if (exIdx === -1) return prev;
      const newExs = [...prev.exercises];
      const newSets = [...newExs[exIdx].sets];
      newSets[setIndex] = { ...newSets[setIndex], completed: true };
      newExs[exIdx] = { ...newExs[exIdx], sets: newSets };

      const setRest = newSets[setIndex].restTime;
      const exRest = newExs[exIdx].restTime;
      startTimer(setRest || exRest || 90);

      if (!newSets[setIndex].isWarmup) {
        for (let i = setIndex + 1; i < newSets.length; i++) {
          if (!newSets[i].completed && !newSets[i].isWarmup) newSets[i].weight = newSets[setIndex].weight;
        }
      }
      return { ...prev, exercises: newExs };
    });
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const updateSetWeight = (exId, setIndex, newWeight) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const exIdx = prev.exercises.findIndex(e => e.id === exId);
      if (exIdx === -1) return prev;
      const newExs = [...prev.exercises];
      const newSets = [...newExs[exIdx].sets];
      newSets[setIndex] = { ...newSets[setIndex], weight: newWeight };
      newExs[exIdx] = { ...newExs[exIdx], sets: newSets };
      return { ...prev, exercises: newExs };
    });
  };

  const updateSetReps = (exId, setIndex, newReps) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const exIdx = prev.exercises.findIndex(e => e.id === exId);
      if (exIdx === -1) return prev;
      const newExs = [...prev.exercises];
      const newSets = [...newExs[exIdx].sets];
      newSets[setIndex] = { ...newSets[setIndex], reps: newReps };
      newExs[exIdx] = { ...newExs[exIdx], sets: newSets };
      return { ...prev, exercises: newExs };
    });
  };

  const goNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setDirection(1);
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      resetTimer();
    } else {
      setIsWorkoutFinished(true);
    }
  };

  const goPrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setDirection(-1);
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      resetTimer();
    }
  };

  const saveAndCloseWorkout = () => {
    const endTime = Date.now();
    let realVolume = 0;
    activeWorkout.exercises.forEach(ex => ex.sets.forEach(s => { if (s.completed && !s.isWarmup) realVolume += (s.reps * s.weight); }));
    const session = { id: activeWorkout.id, date: endTime, duration: elapsed, volume: realVolume, exercises: activeWorkout.exercises, planName: activeWorkout.planName, dayName: activeWorkout.dayName };
    setHistory(prev => [session, ...prev]);
    setActiveWorkout(null);
    setCurrentTab('history');
  };

  // 1. DASHBOARD BRIEFING (Se workout non iniziato o non esiste)
  if (!activeWorkout?.startTime && !isWorkoutFinished) {
    return (
      <div className="flex flex-col h-full bg-black text-white p-6 pt-12 pb-24 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-accentOrange/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10 mb-8">
          <h1 className="text-4xl font-black mb-1 tracking-tighter uppercase italic">Training Brief</h1>
          <p className="text-muted text-xs font-bold uppercase tracking-[0.3em]">{activePlan?.name || 'Piano Libero'}</p>
        </div>
        <div className="flex justify-between items-center mb-10 px-2 relative z-10">
          {DAY_LABELS.map((label, i) => (
            <button key={i} onClick={() => setSelectedDayIndex(i)} className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all border-2", selectedDayIndex === i ? "bg-accentOrange border-accentOrange shadow-lg scale-110 text-white" : "bg-white/5 border-transparent text-muted")}>{label}</button>
          ))}
        </div>
        <div className="flex-1 relative z-10">
          {briefingData ? (
            <div className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 flex flex-col">
              <h2 className="text-3xl font-black tracking-tighter italic uppercase mb-2">{DAY_NAMES[selectedDayIndex]}</h2>
              <div className="flex flex-wrap gap-2 mb-10">
                {briefingData.tags.map((t, i) => <span key={i} className="text-[10px] font-black uppercase bg-accentOrange/10 text-accentOrange px-3 py-1 rounded-full">{t}</span>)}
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-8">
                <div>
                  <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Volume Stimato</span>
                  <div className="flex items-baseline space-x-2"><span className="text-6xl font-black italic">{briefingData.volume.toLocaleString()}</span><span className="text-xl font-bold text-muted italic">KG</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-black/40 border border-white/5 rounded-[28px]">
                    <span className="text-[10px] text-muted uppercase block mb-1">Esercizi</span>
                    <span className="text-2xl font-black italic">{briefingData.exercisesCount}</span>
                  </div>
                  <div className="p-5 bg-black/40 border border-white/5 rounded-[28px]">
                    <span className="text-[10px] text-muted uppercase block mb-1">Struttura</span>
                    <span className="text-xl font-black italic text-accentOrange">{briefingData.warmup}W | {briefingData.work}W</span>
                  </div>
                </div>
              </div>
              <button onClick={startWorkout} className="mt-8 w-full bg-accentOrange py-5 rounded-[28px] font-black text-lg italic uppercase tracking-widest shadow-xl active:scale-95 transition-all">Inizia Allenamento</button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-[40px] border border-white/10">
              <Zap size={48} className="text-accentBlue mb-4" />
              <h2 className="text-2xl font-black italic uppercase">Giorno di Recupero</h2>
              <p className="text-muted text-sm mt-2 max-w-[200px]">I tuoi muscoli crescono ora. Riposa bene per spingere al massimo domani.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. WORKOUT FINISHED
  if (isWorkoutFinished) {
    return (
      <div className="flex flex-col h-full bg-black text-white p-8 items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-accentOrange/20 rounded-full flex items-center justify-center"><Trophy size={48} className="text-accentOrange" /></div>
        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Missione Compiuta</h2>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 flex flex-col"><span className="text-muted text-sm">Tempo</span><span className="text-lg font-bold">{formatTime(elapsed)}</span></div>
          <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 flex flex-col"><span className="text-muted text-sm">Volume</span><span className="text-lg font-bold">{currentVolume}kg</span></div>
        </div>
        <button onClick={saveAndCloseWorkout} className="w-full max-w-sm bg-white text-black font-bold text-lg rounded-full py-4 shadow-xl active:scale-95">Salva Sessione</button>
      </div>
    );
  }

  // 3. TACTICAL FOCUS VIEW (Solo se c'è un currentExercise valido)
  if (!currentExercise) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden relative">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between relative z-30">
        <div className="flex flex-col items-start shrink-0">
          <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Set</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black italic">{activeSetIndex + 1}</span>
            <span className="text-muted font-bold">/ {currentExercise.sets.length}</span>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-12 text-center w-[60%]">
          <h2 className="text-lg font-black tracking-tighter uppercase italic truncate">{currentExercise.exerciseName}</h2>
          <div className="flex justify-center space-x-1 mt-2">
            {activeWorkout?.exercises?.map((ex, i) => (
              <motion.div key={i} animate={i === currentExerciseIndex ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}} transition={{ repeat: Infinity, duration: 2 }} className={cn("w-1.5 h-1.5 rounded-full", i < currentExerciseIndex ? "bg-[#34C759]" : (i === currentExerciseIndex ? "bg-accentBlue" : "bg-white/10"))} />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center space-x-1.5 text-accentBlue mb-0.5"><Activity size={14} /><span className="text-sm font-black font-mono tabular-nums">{currentVolume}</span></div>
          <div className="flex items-center space-x-1.5 text-muted"><Clock size={14} /><span className="text-sm font-bold font-mono tabular-nums">{formatTime(elapsed)}</span></div>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-6">
        <div className="w-full h-44 bg-surface/50 border border-white/5 rounded-[32px] mb-6 flex items-center justify-center relative overflow-hidden">
          <Dumbbell className="text-white/10" size={64} />
          {currentSet?.isWarmup && <div className="absolute top-4 left-4 bg-accentOrange text-black text-[9px] font-black uppercase px-3 py-1 rounded-full">Riscaldamento</div>}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button onClick={() => setActivePicker('weight')} className="bg-white/5 border border-white/10 rounded-[40px] py-12 flex flex-col items-center justify-center active:scale-95 transition-all">
            <span className="text-[10px] font-black text-muted uppercase mb-4 tracking-widest">Kg</span>
            <span className="text-6xl font-black italic tracking-tighter tabular-nums">{currentSet?.weight || 0}</span>
          </button>
          <button onClick={() => setActivePicker('reps')} className="bg-white/5 border border-white/10 rounded-[40px] py-12 flex flex-col items-center justify-center active:scale-95 transition-all">
            <div className="flex items-center space-x-1 mb-4">
              <span className="text-[10px] font-black text-muted uppercase tracking-widest">{currentSet?.type === 'time' ? 'Sec' : 'Rep'}</span>
              <button onClick={(e) => { e.stopPropagation(); setActiveWorkout(prev => {
                const exs = [...prev.exercises];
                const sets = [...exs[currentExerciseIndex].sets];
                sets[activeSetIndex] = { ...sets[activeSetIndex], type: currentSet.type === 'time' ? 'reps' : 'time' };
                exs[currentExerciseIndex] = { ...exs[currentExerciseIndex], sets };
                return { ...prev, exercises: exs };
              })}} className="text-accentBlue hover:text-white transition-colors">
                <RefreshCw size={10} />
              </button>
            </div>
            <div className="flex items-baseline">
              <span className="text-6xl font-black italic tracking-tighter tabular-nums">{activeSetTimer ? activeSetTimer.left : (currentSet?.reps || 0)}</span>
              {currentSet?.type === 'time' && !activeSetTimer && <span className="text-xl font-bold text-muted ml-1 italic mt-4">s</span>}
            </div>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-end pb-12 space-y-4">
          {isTimerRunning && (
            <div className="flex justify-center mb-4" onClick={() => setIsTimerFullscreen(true)}>
              <div className="px-6 py-2 bg-accentOrange/10 border border-accentOrange/30 rounded-full flex items-center space-x-3">
                <Clock size={16} className="text-accentOrange" /><span className="text-xl font-black font-mono tabular-nums text-white">{Math.ceil(timerLeft)}s</span>
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Recupero</span>
              </div>
            </div>
          )}
          {!isExerciseDone ? (
            <button 
              onClick={() => {
                if (!currentSet) return;
                if (currentSet.type === 'time') {
                  if (activeSetTimer) { setActiveSetTimer(null); completeActiveSet(currentExercise.id, activeSetIndex); }
                  else { setActiveSetTimer({ left: parseInt(currentSet.reps) || 30, total: parseInt(currentSet.reps) || 30 }); }
                } else { completeActiveSet(currentExercise.id, activeSetIndex); }
              }}
              className={cn("w-full py-8 rounded-[32px] font-black text-2xl uppercase tracking-widest italic shadow-xl active:scale-95 transition-all", activeSetTimer ? "bg-red-500 text-white" : "bg-accentOrange text-white shadow-orange-500/20")}
            >
              {activeSetTimer ? "STOP" : (currentSet?.type === 'time' ? "START" : "CHECK")}
            </button>
          ) : (
            <button onClick={goNextExercise} className="w-full py-8 bg-white text-black rounded-[32px] font-black text-2xl uppercase italic active:scale-95 transition-all">Prossimo Esercizio</button>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 left-6 right-6 flex items-center justify-between z-30">
        <button onClick={() => setCurrentTab('editor')} className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all">
          <ArrowLeft size={24} />
        </button>
        <div className="flex space-x-4">
          <button onClick={goPrevExercise} disabled={currentExerciseIndex === 0} className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md disabled:opacity-20 active:scale-90 transition-all">
            <ChevronDown className="rotate-90" size={24} />
          </button>
          <button onClick={() => setIsPaused(true)} className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all">
            <Pause size={24} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isPaused && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setIsPaused(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 z-[110] bg-[#1c1c1e] border-t border-white/10 rounded-t-[32px] px-8 pt-4 pb-12 shadow-2xl">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-center space-x-3 mb-8"><Pause size={24} /><h3 className="font-bold text-xl uppercase italic">Sessione In Pausa</h3></div>
              <div className="flex space-x-3">
                <button onClick={() => setIsPaused(false)} className="flex-1 bg-white/5 text-white font-bold py-4 rounded-2xl border border-white/10">Continua</button>
                <button onClick={() => { setActiveWorkout(null); setCurrentTab('editor'); }} className="flex-1 bg-red-500/20 text-red-500 font-bold py-4 rounded-2xl border border-red-500/20">Termina Allenamento</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePicker && currentSet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={() => setActivePicker(null)} />
            <div className="fixed bottom-0 left-0 right-0 z-[210]">
              {activePicker === 'weight' ? (
                <WeightScrollPicker 
                  isOpen={true}
                  title="Carico (Kg)"
                  initialValue={currentSet?.weight || 0}
                  onSelect={(val) => {
                    updateSetWeight(currentExercise.id, activeSetIndex, val);
                    setActivePicker(null);
                  }}
                  onClose={() => setActivePicker(null)}
                />
              ) : (
                currentSet.type === 'time' ? (
                  <TimeScrollPicker 
                    isOpen={true}
                    title="Secondi" 
                    initialValue={currentSet.reps} 
                    onSelect={(val) => {
                      updateSetReps(currentExercise.id, activeSetIndex, val);
                      setActivePicker(null);
                    }} 
                    onClose={() => setActivePicker(null)} 
                  />
                ) : (
                  <SingleScrollPicker 
                    isOpen={true}
                    title="Ripetizioni" 
                    options={Array.from({ length: 50 }, (_, i) => i + 1)} 
                    initialValue={currentSet.reps} 
                    onSelect={(val) => {
                      updateSetReps(currentExercise.id, activeSetIndex, val);
                      setActivePicker(null);
                    }} 
                    onClose={() => setActivePicker(null)} 
                  />
                )
              )}
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
