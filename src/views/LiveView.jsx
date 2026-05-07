import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PlayCircle, CheckCircle2, Trophy, AlertTriangle, ArrowLeft, Heart, Flame, Dumbbell, Zap, 
  Pause, Play, NotebookPen, X, RefreshCcw, RefreshCw, XCircle, ChevronRight, Activity, 
  Clock, ChevronDown, ChevronUp, BatteryCharging, CalendarDays, Calendar
} from 'lucide-react';
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
  const todayDayOfWeek = new Date().getDay();
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayDayOfWeek);
  const [direction, setDirection] = useState(1);
  const [activePicker, setActivePicker] = useState(null); // 'reps', 'weight'
  const [activeSetTimer, setActiveSetTimer] = useState(null); // { left, total }
  const [isPaused, setIsPaused] = useState(false);
  const [isWorkoutFinished, setIsWorkoutFinished] = useState(false);
  const [pendingWarmupInjection, setPendingWarmupInjection] = useState(false);

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

  // PROTECTED DERIVED VARIABLES
  const currentExercise = activeWorkout?.exercises?.[currentExerciseIndex] || null;
  const activeSetIndex = currentExercise ? currentExercise.sets.findIndex(s => !s.completed) : -1;
  const isExerciseDone = currentExercise && activeSetIndex === -1;
  const currentSet = currentExercise && activeSetIndex !== -1 ? currentExercise.sets[activeSetIndex] : null;
  const totalExercises = activeWorkout?.exercises?.length || 0;

  const currentVolume = useMemo(() => {
    if (!activeWorkout?.exercises) return 0;
    return activeWorkout.exercises.reduce((acc, ex) => {
      const sets = ex.sets || [];
      return acc + sets.filter(s => s.completed && !s.isWarmup).reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
    }, 0);
  }, [activeWorkout]);

  // BRIEFING DATA (Secure definition)
  const briefingData = useMemo(() => {
    if (!activePlan?.days) return null;
    const day = activePlan.days.find(d => d.dayOfWeek === selectedDayIndex);
    if (!day || !day.exercises || day.exercises.length === 0) return null;

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

  // NAVIGATION HANDLERS
  const handleNextDay = () => {
    setDirection(1);
    setSelectedDayIndex(prev => (prev + 1) % 7);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handlePrevDay = () => {
    setDirection(-1);
    setSelectedDayIndex(prev => (prev - 1 + 7) % 7);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startWorkout = () => {
    if (!activePlan?.days) return;
    const currentDay = activePlan.days.find(d => d.dayOfWeek === selectedDayIndex);
    if (!currentDay || !currentDay.exercises || currentDay.exercises.length === 0) return;
    
    const exercises = currentDay.exercises.map(ex => {
      const sourceSets = ex.setDetails || Array.from({ length: parseInt(ex.sets) || 1 }).map((_, i) => ({
        id: `set-${Date.now()}-${i}`, reps: ex.reps, weight: ex.weight, type: 'reps', isWarmup: false, restTime: null
      }));
      const sets = sourceSets.map(s => ({ 
        ...s, 
        completed: false, 
        type: s.type || 'reps', 
        isWarmup: s.isWarmup || false, 
        restTime: s.restTime || null 
      }));
      return { ...ex, id: `ex-${Date.now()}-${Math.random()}`, sets };
    });

    setActiveWorkout({
      id: `session-${Date.now()}`, 
      dayId: currentDay.id, 
      dayName: DAY_NAMES[currentDay.dayOfWeek], 
      planName: activePlan.name, 
      startTime: Date.now(), 
      exercises
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

  const injectWarmup = (weightOverride) => {
    const weight = weightOverride !== undefined ? weightOverride : (currentSet?.weight || 0);
    const targetReps = parseInt(currentExercise?.reps) || 10;

    if (weight <= 0) {
      setActivePicker('weight');
      setPendingWarmupInjection(true);
      return;
    }

    setActiveWorkout(prev => {
      if (!prev) return prev;
      const exIdx = prev.exercises.findIndex(e => e.id === currentExercise.id);
      if (exIdx === -1) return prev;

      const newExs = [...prev.exercises];
      const currentEx = { ...newExs[exIdx] };
      
      const warmupA = {
        id: `warmup-a-${Date.now()}`,
        weight: Math.round(weight * 0.5 * 4) / 4,
        reps: targetReps,
        type: 'reps',
        isWarmup: true,
        completed: false,
        restTime: 60
      };

      const warmupB = {
        id: `warmup-b-${Date.now()}`,
        weight: Math.round(weight * 0.75 * 4) / 4,
        reps: Math.max(4, Math.floor(targetReps / 2)),
        type: 'reps',
        isWarmup: true,
        completed: false,
        restTime: 90
      };

      currentEx.sets = [warmupA, warmupB, ...currentEx.sets];
      newExs[exIdx] = currentEx;

      return { ...prev, exercises: newExs };
    });

    setPendingWarmupInjection(false);
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  };

  const goNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      resetTimer();
    } else {
      setIsWorkoutFinished(true);
    }
  };

  const goPrevExercise = () => {
    if (currentExerciseIndex > 0) {
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

  // 1. DASHBOARD BRIEFING (Safety Guard for activePlan)
  if (!activeWorkout?.startTime && !isWorkoutFinished) {
    if (!activePlan) {
      return (
        <div className="flex flex-col h-full bg-black text-white p-8 items-center justify-center text-center">
          <Dumbbell size={64} className="text-muted/20 mb-6" />
          <h2 className="text-2xl font-bold mb-2 uppercase italic tracking-tighter">Nessun Allenamento Attivo</h2>
          <p className="text-muted text-sm max-w-xs leading-relaxed">Attiva un piano nella libreria per sbloccare il briefing giornaliero.</p>
          <button onClick={() => setCurrentTab('editor')} className="mt-8 bg-white text-black font-black uppercase tracking-widest px-8 py-3 rounded-full active:scale-95 transition-all text-xs">Vai al Laboratorio</button>
        </div>
      );
    }

    const isToday = selectedDayIndex === todayDayOfWeek;

    return (
      <div className="flex flex-col h-full bg-black text-white selection:bg-transparent touch-action-pan-y relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-accentOrange/10 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Compact Header */}
        <header className="px-6 pt-6 pb-2 relative z-10">
          <h1 className="text-sm font-black tracking-tighter uppercase italic text-white/50">Training Brief</h1>
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{activePlan.name}</p>
        </header>

        <div className="flex-1 overflow-y-auto hide-scrollbar touch-action-pan-y relative z-10 py-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div 
              key={selectedDayIndex}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset }) => {
                if (offset.x > 50) handlePrevDay();
                else if (offset.x < -50) handleNextDay();
              }}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="px-6 w-full h-full flex flex-col"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-5 flex flex-col shadow-2xl relative overflow-hidden flex-1 min-h-0">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                  <Dumbbell size={140} />
                </div>

                {/* Unified Title Area */}
                <div className="flex items-center justify-between mb-1 relative z-10">
                  <h2 className="text-2xl font-black tracking-tighter italic uppercase text-white">
                    {briefingData ? DAY_NAMES[selectedDayIndex] : 'Recovery Day'}
                  </h2>
                  {isToday && briefingData && <span className="bg-accentOrange text-black text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-lg shadow-accentOrange/20">OGGI</span>}
                </div>

                {briefingData ? (
                  <div className="flex-1 flex flex-col relative z-10">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(briefingData.tags || []).map((t, i) => (
                        <span key={i} className="text-[9px] font-black uppercase bg-accentBlue/10 text-accentBlue px-2.5 py-1 rounded-full border border-accentBlue/20">{t}</span>
                      ))}
                    </div>

                    <div className="flex-1 flex flex-col justify-around">
                      <div>
                        <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em] block mb-0.5">Volume Muscolare</span>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-4xl font-black italic tracking-tighter text-white">{briefingData.volume.toLocaleString()}</span>
                          <span className="text-lg font-bold text-muted italic">KG</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-black/40 border border-white/5 rounded-[24px]">
                          <span className="text-[9px] text-muted uppercase block mb-0.5">Esercizi</span>
                          <span className="text-xl font-black italic text-white">{briefingData.exercisesCount}</span>
                        </div>
                        <div className="p-4 bg-black/40 border border-white/5 rounded-[24px]">
                          <span className="text-[9px] text-muted uppercase block mb-0.5">Set Totali</span>
                          <span className="text-xl font-black italic text-accentOrange">{briefingData.work} Serie</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-2">
                    <div className="w-16 h-16 bg-accentBlue/10 rounded-full flex items-center justify-center border border-accentBlue/20 mb-4">
                      <BatteryCharging size={32} className="text-accentBlue animate-pulse" />
                    </div>
                    <div className="w-full text-center">
                      <p className="text-muted text-[11px] max-w-[180px] mx-auto leading-relaxed">
                        Oggi è il tuo giorno di recupero. Riposa e ricarica le energie per la prossima sessione.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation & Action Footer - Static & External to Swipe */}
        <div className="px-6 pb-8 pt-2 relative z-20 space-y-4 mt-auto bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="flex items-center space-x-3">
             <button 
               disabled={isToday}
               onClick={() => { setSelectedDayIndex(todayDayOfWeek); setDirection(todayDayOfWeek > selectedDayIndex ? -1 : 1); if (navigator.vibrate) navigator.vibrate(5); }}
               className={cn(
                 "w-11 h-11 rounded-2xl transition-all border flex items-center justify-center shrink-0",
                 isToday 
                   ? "bg-white/5 border-white/5 text-white/20 opacity-20 pointer-events-none" 
                   : "bg-white/5 text-accentBlue border-white/10 active:scale-95 hover:bg-white/10"
               )}
             >
               <CalendarDays size={20} />
             </button>
             
             <div className="flex-1 flex justify-between items-center bg-white/5 p-1 rounded-2xl border border-white/5 h-11">
                {DAY_LABELS.map((label, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setDirection(i > selectedDayIndex ? 1 : -1); setSelectedDayIndex(i); if (navigator.vibrate) navigator.vibrate(5); }} 
                    className={cn(
                      "flex-1 h-9 rounded-xl flex items-center justify-center text-[9px] font-black transition-all", 
                      selectedDayIndex === i ? "bg-white text-black shadow-lg scale-105" : "text-muted hover:text-white"
                    )}
                  >
                    {label}
                  </button>
                ))}
             </div>
          </div>
          
          {briefingData && (
            <button 
              onClick={startWorkout} 
              className="w-full bg-accentOrange py-4 rounded-[24px] font-black text-lg italic uppercase tracking-[0.1em] shadow-[0_10px_30px_rgba(255,159,10,0.3)] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 h-14"
            >
              <span>Inizia Sessione</span>
              <ChevronRight size={18} />
            </button>
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

  // 3. TACTICAL FOCUS VIEW
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
          {(activeSetIndex === 0 && !currentExercise.sets.some(s => s.isWarmup)) && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              onClick={() => injectWarmup()}
              className="mt-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition-colors border border-white/5 active:scale-90"
            >
              <Flame size={12} className="text-accentOrange" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">+ Scaldati</span>
            </motion.button>
          )}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-12 text-center w-[60%]">
          <h2 className="text-lg font-black tracking-tighter uppercase italic truncate">{currentExercise.exerciseName}</h2>
          <div className="flex justify-center space-x-1 mt-2">
            {activeWorkout.exercises.map((ex, i) => (
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

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col space-y-3">
            <span className="text-lg font-bold text-surface uppercase tracking-widest pl-2">Kg</span>
            <button onClick={() => setActivePicker('weight')} className="bg-surface/50 border border-white/5 rounded-[32px] h-32 flex items-center justify-center active:scale-95 transition-all shadow-lg">
              <span className="text-6xl font-black italic tracking-tighter tabular-nums">{currentSet?.weight || 0}</span>
            </button>
          </div>
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-lg font-bold text-surface uppercase tracking-widest">{currentSet?.type === 'time' ? 'Sec' : 'Rep'}</span>
              <button onClick={(e) => { e.stopPropagation(); setActiveWorkout(prev => {
                const exs = [...prev.exercises];
                const sets = [...exs[currentExerciseIndex].sets];
                sets[activeSetIndex] = { ...sets[activeSetIndex], type: currentSet.type === 'time' ? 'reps' : 'time' };
                exs[currentExerciseIndex] = { ...exs[currentExerciseIndex], sets };
                return { ...prev, exercises: exs };
              })}} className="p-2 -mr-2 text-accentBlue hover:text-white transition-colors active:scale-110">
                <RefreshCw size={18} />
              </button>
            </div>
            <button onClick={() => setActivePicker('reps')} className="bg-surface/50 border border-white/5 rounded-[32px] h-32 flex items-center justify-center active:scale-95 transition-all shadow-lg">
              <div className="flex items-baseline">
                <span className="text-6xl font-black italic tracking-tighter tabular-nums">{activeSetTimer ? activeSetTimer.left : (currentSet?.reps || 0)}</span>
                {currentSet?.type === 'time' && !activeSetTimer && <span className="text-xl font-bold text-muted ml-1 italic mt-4">s</span>}
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end pb-8">
          {isTimerRunning && (
            <div className="flex justify-center mb-6" onClick={() => setIsTimerFullscreen(true)}>
              <div className="px-6 py-2 bg-accentOrange/10 border border-accentOrange/30 rounded-full flex items-center space-x-3">
                <Clock size={16} className="text-accentOrange" /><span className="text-xl font-black font-mono tabular-nums text-white">{Math.ceil(timerLeft)}s</span>
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Recupero</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between space-x-4 pb-safe">
            {/* Library / Back Button */}
            <button 
              onClick={() => setCurrentTab('editor')} 
              className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all shrink-0"
            >
              <ArrowLeft size={24} />
            </button>

            {/* Main Action Button */}
            <div className="flex-1">
              {!isExerciseDone ? (
                <button 
                  onClick={() => {
                    if (!currentSet) return;
                    if (currentSet.type === 'time') {
                      if (activeSetTimer) { setActiveSetTimer(null); completeActiveSet(currentExercise.id, activeSetIndex); }
                      else { setActiveSetTimer({ left: parseInt(currentSet.reps) || 30, total: parseInt(currentSet.reps) || 30 }); }
                    } else { completeActiveSet(currentExercise.id, activeSetIndex); }
                  }}
                  className={cn(
                    "w-full py-5 rounded-[32px] font-black text-xl uppercase tracking-widest italic shadow-xl active:scale-95 transition-all", 
                    activeSetTimer ? "bg-red-500 text-white" : "bg-accentOrange text-white shadow-orange-500/20"
                  )}
                >
                  {activeSetTimer ? "STOP" : (currentSet?.type === 'time' ? "START" : "CHECK")}
                </button>
              ) : (
                <button onClick={goNextExercise} className="w-full py-5 bg-white text-black rounded-[32px] font-black text-xl uppercase italic active:scale-95 transition-all">NEXT</button>
              )}
            </div>

            {/* Pause Button */}
            <button 
              onClick={() => setIsPaused(true)} 
              className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all shrink-0"
            >
              <Pause size={24} />
            </button>
          </div>
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
                    if (pendingWarmupInjection) {
                      injectWarmup(val);
                    }
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
