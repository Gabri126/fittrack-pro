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

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const DAY_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

const REPS_OPTIONS = Array.from({ length: 50 }, (_, i) => i + 1);

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
  const todayDayOfWeek = (new Date().getDay() + 6) % 7;
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayDayOfWeek);
  const [direction, setDirection] = useState(1);
  const [activePicker, setActivePicker] = useState(null); 
  const [activeSetTimer, setActiveSetTimer] = useState(null); 
  const [isPaused, setIsPaused] = useState(false);
  const [isWorkoutFinished, setIsWorkoutFinished] = useState(false);
  const [pendingWarmupInjection, setPendingWarmupInjection] = useState(false);
  
  // Pro Features States
  const [currentRpe, setCurrentRpe] = useState(8);
  const [isPlateCalcOpen, setIsPlateCalcOpen] = useState(false);

  const handleNextDay = () => {
    setDirection(1);
    setSelectedDayIndex(prev => (prev + 1) % 7);
  };
  const handlePrevDay = () => {
    setDirection(-1);
    setSelectedDayIndex(prev => (prev - 1 + 7) % 7);
  };

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

  // Plate Calculator Logic
  const calculatePlates = (targetWeight) => {
    const barWeight = 20;
    let remaining = targetWeight - barWeight;
    if (remaining < 0) return { plates: [], remaining: targetWeight };
    
    const availablePlates = [20, 15, 10, 5, 2.5, 1.25];
    const result = [];
    
    availablePlates.forEach(p => {
      const count = Math.floor(remaining / (p * 2));
      if (count > 0) {
        result.push({ weight: p, count });
        remaining -= (count * p * 2);
      }
    });
    
    return { plates: result, remaining };
  };

  // PR Alert Logic
  const isPersonalRecord = useMemo(() => {
    if (!currentExercise || !currentSet || !history || history.length === 0) return false;
    const bestWeight = history.reduce((max, session) => {
      const ex = session.exercises?.find(e => e.exerciseName === currentExercise.exerciseName);
      if (!ex) return max;
      const sessionMax = ex.sets?.reduce((m, s) => Math.max(m, s.weight || 0), 0) || 0;
      return Math.max(max, sessionMax);
    }, 0);
    return currentSet.weight > bestWeight;
  }, [currentExercise, currentSet, history]);

  // WORKOUT ACTIONS
  const completeActiveSet = (exId, setIndex, rpeValue) => {
    setActiveWorkout(prev => {
      const exIdx = prev.exercises.findIndex(e => e.id === exId);
      if (exIdx === -1) return prev;
      const newExs = [...prev.exercises];
      const newSets = [...newExs[exIdx].sets];
      newSets[setIndex] = { ...newSets[setIndex], completed: true, rpe: rpeValue || null };
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

  const handleSetCompletion = () => {
    if (!currentSet) return;
    if (currentSet.type === 'time') {
      if (activeSetTimer) { 
        setActiveSetTimer(null); 
        completeActiveSet(currentExercise.id, activeSetIndex, currentRpe); 
      } else { 
        setActiveSetTimer({ left: parseInt(currentSet.reps) || 30, total: parseInt(currentSet.reps) || 30 }); 
      }
    } else { 
      completeActiveSet(currentExercise.id, activeSetIndex, currentRpe); 
    }
  };

  const saveAndCloseWorkout = () => {
    const endTime = Date.now();
    let realVolume = 0;
    activeWorkout.exercises.forEach(ex => ex.sets.forEach(s => { if (s.completed && !s.isWarmup) realVolume += (s.reps * s.weight); }));
    const session = { 
      id: activeWorkout.id, 
      date: endTime, 
      duration: elapsed, 
      volume: realVolume, 
      exercises: activeWorkout.exercises.map(ex => ({
        exerciseName: ex.exerciseName,
        sets: ex.sets.map(s => ({
          completed: s.completed,
          reps: s.reps,
          weight: s.weight,
          rpe: s.rpe || null,
          isWarmup: s.isWarmup
        }))
      })), 
      planName: activeWorkout.planName, 
      dayName: activeWorkout.dayName 
    };
    setHistory(prev => [session, ...prev]);
    setActiveWorkout(null);
    setCurrentTab('history');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#0A84FF', '#FF9F0A', '#FFFFFF'] });
  };

  const goNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      resetTimer();
    } else {
      setIsWorkoutFinished(true);
    }
  };

  const injectWarmup = (weightOverride) => {
    const weight = weightOverride !== undefined ? weightOverride : (currentSet?.weight || 0);
    const targetReps = parseInt(currentExercise?.reps) || 10;
    if (weight <= 0) { setActivePicker('weight'); setPendingWarmupInjection(true); return; }

    setActiveWorkout(prev => {
      if (!prev) return prev;
      const exIdx = prev.exercises.findIndex(e => e.id === currentExercise.id);
      if (exIdx === -1) return prev;
      const newExs = [...prev.exercises];
      const currentEx = { ...newExs[exIdx] };
      const warmupA = { id: `warm-a-${Date.now()}`, weight: Math.round(weight * 0.5 * 4) / 4, reps: targetReps, type: 'reps', isWarmup: true, completed: false, restTime: 60 };
      const warmupB = { id: `warm-b-${Date.now()}`, weight: Math.round(weight * 0.75 * 4) / 4, reps: Math.max(4, Math.floor(targetReps / 2)), type: 'reps', isWarmup: true, completed: false, restTime: 90 };
      currentEx.sets = [warmupA, warmupB, ...currentEx.sets];
      newExs[exIdx] = currentEx;
      return { ...prev, exercises: newExs };
    });
    setPendingWarmupInjection(false);
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // RENDER LOGIC
  if (!activeWorkout?.startTime && !isWorkoutFinished) {
    if (!activePlan) {
      return (
        <div className="flex flex-col h-full bg-black text-white p-8 items-center justify-center text-center">
          <Dumbbell size={64} className="text-muted/20 mb-6" />
          <h2 className="text-2xl font-bold mb-2 uppercase italic tracking-tighter">Nessun Allenamento Attivo</h2>
          <button onClick={() => setCurrentTab('editor')} className="mt-8 bg-white text-black font-black uppercase tracking-widest px-8 py-3 rounded-full active:scale-95 transition-all text-xs">Vai al Laboratorio</button>
        </div>
      );
    }

    const briefingData = (() => {
      const day = activePlan.days.find(d => d.dayOfWeek === selectedDayIndex);
      if (!day || !day.exercises || day.exercises.length === 0) return null;
      let totalVol = 0;
      day.exercises.forEach(ex => (ex.setDetails || []).forEach(s => { if (!s.isWarmup) totalVol += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0); }));
      return { volume: totalVol, exercisesCount: day.exercises.length, tags: day.tags || [] };
    })();

    return (
      <div className="flex flex-col h-full bg-black text-white relative overflow-y-auto hide-scrollbar pb-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-accentOrange/10 blur-[120px] rounded-full pointer-events-none" />
        
        <header className="px-6 pt-12 pb-6 relative z-10">
          <h1 className="text-sm font-black tracking-tighter uppercase italic text-white/50">Training Brief</h1>
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{activePlan.name}</p>
        </header>

        <div className="px-4 pb-8 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedDayIndex}
              initial={{ opacity: 0, x: 50 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 * direction }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, { offset }) => {
                if (offset.x > 100) handlePrevDay();
                else if (offset.x < -100) handleNextDay();
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-surface/40 border border-white/5 rounded-[40px] p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center text-center"
            >
              {briefingData ? (
                <>
                  <h2 className="text-2xl font-black italic uppercase mb-2 tracking-tighter">{DAY_NAMES[selectedDayIndex]}</h2>
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {briefingData.tags.map(t => <span key={t} className="text-[10px] font-black bg-accentBlue/20 text-accentBlue px-3 py-1 rounded-full uppercase italic">{t}</span>)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full mb-10">
                    <div className="p-4 bg-white/5 rounded-3xl flex flex-col items-center">
                      <span className="block text-2xl font-black italic">{briefingData.exercisesCount}</span>
                      <span className="text-[8px] font-black text-muted uppercase tracking-widest">Esercizi</span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-3xl flex flex-col items-center">
                      <span className="block text-2xl font-black italic text-accentOrange">
                        {briefingData.volume > 999 ? `${(briefingData.volume / 1000).toFixed(1)}k` : briefingData.volume}
                      </span>
                      <span className="text-[8px] font-black text-muted uppercase tracking-widest">Vol. (Kg)</span>
                    </div>
                  </div>
                  {selectedDayIndex === todayDayOfWeek && (
                    <button onClick={() => {
                      const day = activePlan.days.find(d => d.dayOfWeek === selectedDayIndex);
                      setActiveWorkout({ 
                        id: `session-${Date.now()}`, 
                        startTime: Date.now(), 
                        planName: activePlan.name, 
                        dayName: DAY_NAMES[selectedDayIndex], 
                        exercises: day.exercises.map(ex => ({ 
                          ...ex, 
                          id: `ex-${Date.now()}-${Math.random()}`, 
                          sets: ex.setDetails 
                            ? ex.setDetails.map(s => ({ ...s, completed: false })) 
                            : Array.from({ length: parseInt(ex.sets) || 3 }, () => ({ 
                                reps: ex.reps, 
                                weight: ex.weight, 
                                type: 'reps', 
                                completed: false 
                              }))
                        })) 
                      });
                    }} className="w-full bg-white text-black font-black py-5 rounded-[32px] text-xl uppercase italic shadow-2xl active:scale-95 transition-all">Start Session</button>
                  )}
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6"><BatteryCharging size={40} className="text-muted/30" /></div>
                  <h2 className="text-2xl font-black italic uppercase mb-2 tracking-tighter">Recovery Day</h2>
                  <p className="text-muted text-xs uppercase tracking-widest leading-relaxed">Il riposo è parte integrante della tua evoluzione.</p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-4 pb-12 flex flex-row items-center w-full gap-2 relative z-10">
          <button 
            onClick={() => setSelectedDayIndex(todayDayOfWeek)}
            disabled={selectedDayIndex === todayDayOfWeek}
            className={cn(
              "p-3 rounded-xl transition-all",
              selectedDayIndex === todayDayOfWeek ? "opacity-10 text-muted" : "bg-accentOrange/10 text-accentOrange active:scale-90"
            )}
          >
            <RefreshCcw size={20} />
          </button>
          
          <div className="flex-1 flex justify-between items-center bg-white/5 p-1 rounded-2xl border border-white/10">
            {DAY_LABELS.map((l, i) => (
              <button 
                key={i} 
                onClick={() => { setDirection(i > selectedDayIndex ? 1 : -1); setSelectedDayIndex(i); }} 
                className={cn(
                  "flex-1 aspect-square flex items-center justify-center rounded-xl transition-all text-[10px] font-black uppercase", 
                  selectedDayIndex === i ? "bg-white text-black shadow-md scale-105" : "text-muted active:opacity-50"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isWorkoutFinished) {
    return (
      <div className="flex flex-col h-[100dvh] bg-black text-white p-8 items-center justify-center text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-accentBlue/10 blur-[150px] rounded-full" />
        <div className="w-24 h-24 bg-accentOrange/20 rounded-full flex items-center justify-center relative z-10 border border-accentOrange/30 shadow-2xl"><Trophy size={48} className="text-accentOrange" /></div>
        <div className="relative z-10"><h2 className="text-4xl font-black tracking-tighter uppercase italic">Missione Compiuta</h2></div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm relative z-10">
          <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 flex flex-col items-center"><span className="text-[10px] font-black text-muted uppercase mb-1">Tempo</span><span className="text-2xl font-black italic">{formatTime(elapsed)}</span></div>
          <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 flex flex-col items-center"><span className="text-[10px] font-black text-muted uppercase mb-1">Volume</span><span className="text-2xl font-black italic text-accentBlue">{currentVolume.toLocaleString()}</span></div>
        </div>
        <button onClick={saveAndCloseWorkout} className="w-full max-w-sm bg-white text-black font-black text-xl rounded-[32px] py-5 shadow-2xl active:scale-95 transition-all uppercase italic relative z-10">Salva & Chiudi</button>
      </div>
    );
  }

  if (!currentExercise) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden relative">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between relative z-30">
        <div className="flex flex-col items-start shrink-0">
          <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Set {activeSetIndex + 1}/{currentExercise.sets.length}</span>
          {isPersonalRecord && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-1 bg-yellow-500 text-black text-[8px] font-black px-2 py-0.5 rounded shadow-lg animate-pulse uppercase">Record!</motion.div>}
        </div>
        <div className="flex flex-col items-center flex-1 px-4 text-center">
          <h2 className="text-lg font-black italic uppercase truncate w-full">{currentExercise.exerciseName}</h2>
          <span className="text-[10px] font-black text-accentBlue uppercase tracking-widest">{formatTime(elapsed)}</span>
        </div>
        <button onClick={() => setIsPlateCalcOpen(true)} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-all"><Dumbbell size={20} className="text-muted" /></button>
      </header>

      <div className="flex-1 relative flex flex-col items-center justify-center px-6">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20"><Dumbbell size={400} className="absolute -top-20 -right-20 rotate-12 text-white/5" /><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-accentBlue/10 blur-[100px] rounded-full" /></div>
        
        <div className="w-full space-y-8 relative z-10">
          <div className="flex flex-col items-center space-y-3">
             <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Sforzo (RPE)</span>
             <div className="flex space-x-2">
               {[6, 7, 8, 9, 10].map(val => (
                 <button key={val} onClick={() => setCurrentRpe(val)} className={cn("w-12 h-12 rounded-2xl font-black italic transition-all border", currentRpe === val ? "bg-accentBlue border-accentBlue text-white shadow-lg scale-110" : "bg-white/5 border-white/5 text-muted")}>{val}</button>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center space-y-2">
               <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">KG</span>
               <button onClick={() => setActivePicker('weight')} className="w-full aspect-[4/3] bg-white/5 border border-white/10 rounded-[40px] flex items-center justify-center active:scale-95 transition-all"><span className="text-5xl font-black italic">{currentSet?.weight || 0}</span></button>
            </div>
            <div className="flex flex-col items-center space-y-2">
               <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">{currentSet?.type === 'time' ? 'SEC' : 'REPS'}</span>
               <button onClick={() => setActivePicker('reps')} className="w-full aspect-[4/3] bg-white/5 border border-white/10 rounded-[40px] flex items-center justify-center active:scale-95 transition-all"><span className="text-5xl font-black italic">{currentSet?.reps || 0}</span></button>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col justify-end pb-12 relative z-20 mt-12">
          {isTimerRunning && (
            <div className="flex justify-center mb-8" onClick={() => setIsTimerFullscreen(true)}>
              <div className="px-6 py-2 bg-accentOrange/10 border border-accentOrange/30 rounded-full flex items-center space-x-3"><Clock size={16} className="text-accentOrange" /><span className="text-xl font-black font-mono tabular-nums text-white">{Math.ceil(timerLeft)}s</span><span className="text-[10px] font-black text-muted uppercase tracking-widest">Recupero</span></div>
            </div>
          )}

          <div className="flex items-center justify-center space-x-4 pb-safe w-full">
            <button onClick={() => setCurrentTab('editor')} className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all shrink-0"><ArrowLeft size={24} /></button>
            <div className="flex-1 max-w-[200px]">
              {!isExerciseDone ? (
                <button onClick={handleSetCompletion} className={cn("w-full py-6 rounded-[28px] font-black text-xl uppercase tracking-widest italic shadow-xl active:scale-95 transition-all", activeSetTimer ? "bg-red-500" : "bg-accentOrange")}>{activeSetTimer ? "STOP" : (currentSet?.type === 'time' ? "START" : "CHECK")}</button>
              ) : (
                <button onClick={goNextExercise} className="w-full py-6 bg-white text-black rounded-[28px] font-black text-xl uppercase italic active:scale-95 transition-all">NEXT</button>
              )}
            </div>
            <button onClick={() => setIsPaused(true)} className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all shrink-0"><Pause size={24} /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isPlateCalcOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md" onClick={() => setIsPlateCalcOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 z-[110] bg-[#1c1c1e] border-t border-white/10 rounded-t-[40px] px-8 pt-6 pb-12 shadow-2xl">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              <div className="text-center mb-8"><h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Plate Calculator</h3><p className="text-muted text-xs uppercase tracking-widest">Carico per {currentSet?.weight} Kg</p></div>
              <div className="space-y-3">
                {currentSet?.weight === 20 ? (
                  <div className="py-10 text-center space-y-3">
                    <div className="w-16 h-16 bg-accentBlue/10 rounded-full flex items-center justify-center mx-auto border border-accentBlue/20">
                      <Dumbbell size={32} className="text-accentBlue" />
                    </div>
                    <p className="text-white font-black italic uppercase tracking-tighter">Usa solo il bilanciere olimpico</p>
                    <p className="text-muted text-[10px] uppercase tracking-widest">Peso standard: 20 Kg</p>
                  </div>
                ) : currentSet?.weight < 20 ? (
                  <div className="py-10 text-center space-y-3">
                    <div className="w-16 h-16 bg-accentOrange/10 rounded-full flex items-center justify-center mx-auto border border-accentOrange/20">
                      <AlertTriangle size={32} className="text-accentOrange" />
                    </div>
                    <p className="text-white font-black italic uppercase tracking-tighter">Usa bilanciere leggero o manubri</p>
                    <p className="text-muted text-[10px] uppercase tracking-widest">Carico inferiore a 20 Kg</p>
                  </div>
                ) : (
                  calculatePlates(currentSet?.weight || 0).plates.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-accentBlue/20 rounded-xl flex items-center justify-center border border-accentBlue/30 text-accentBlue font-black italic">
                          {p.weight}
                        </div>
                        <span className="font-bold text-white uppercase tracking-widest text-sm">Disco {p.weight}kg</span>
                      </div>
                      <span className="text-xl font-black italic text-white">x {p.count * 2} <span className="text-[10px] text-muted">(lato + lato)</span></span>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setIsPlateCalcOpen(false)} className="w-full mt-8 bg-white/5 text-white font-black py-5 rounded-[24px] border border-white/10 uppercase italic active:scale-95">Chiudi</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPaused && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setIsPaused(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 z-[110] bg-[#1c1c1e] border-t border-white/10 rounded-t-[32px] px-8 pt-4 pb-12 shadow-2xl">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-center space-x-3 mb-8"><Pause size={24} /><h3 className="font-bold text-xl uppercase italic">Sessione In Pausa</h3></div>
              <div className="flex space-x-3"><button onClick={() => setIsPaused(false)} className="flex-1 bg-white/5 text-white font-bold py-4 rounded-2xl border border-white/10">Continua</button><button onClick={() => { setActiveWorkout(null); setCurrentTab('editor'); }} className="flex-1 bg-red-500/20 text-red-500 font-bold py-4 rounded-2xl border border-red-500/20">Termina Allenamento</button></div>
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
                <WeightScrollPicker isOpen={true} title="Carico (Kg)" initialValue={currentSet?.weight || 0} onSelect={(val) => { updateSetWeight(currentExercise.id, activeSetIndex, val); if (pendingWarmupInjection) injectWarmup(val); setActivePicker(null); }} onClose={() => setActivePicker(null)} />
              ) : (
                currentSet.type === 'time' ? (
                  <TimeScrollPicker isOpen={true} title="Secondi" initialValue={currentSet.reps} onSelect={(val) => { updateSetReps(currentExercise.id, activeSetIndex, val); setActivePicker(null); }} onClose={() => setActivePicker(null)} />
                ) : (
                  <SingleScrollPicker isOpen={true} title="Ripetizioni" options={REPS_OPTIONS} initialValue={currentSet.reps} onSelect={(val) => { updateSetReps(currentExercise.id, activeSetIndex, val); setActivePicker(null); }} onClose={() => setActivePicker(null)} />
                )
              )}
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
