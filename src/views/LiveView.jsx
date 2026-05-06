import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlayCircle, CheckCircle2, Trophy, AlertTriangle, ArrowLeft, Heart, Flame, Dumbbell, PlaySquare, Zap, Pause, Play, NotebookPen, X, RefreshCcw, XCircle, ChevronDown, Play as PlayIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '../App';
import { SingleScrollPicker, WeightScrollPicker, TimeScrollPicker } from '../components/Pickers';

const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function LiveView({ library, activeWorkout, setActiveWorkout, setHistory, history, startTimer, resetTimer, setCurrentTab, setIsTabBarHidden, isTimerRunning, timerLeft, timerTotal, isTimerFullscreen, setIsTimerFullscreen }) {
  const activePlan = library.find(p => p.status === 'active');

  const todayDayOfWeek = new Date().getDay();
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayDayOfWeek);
  
  useEffect(() => {
    setSelectedDayIndex(todayDayOfWeek);
  }, [todayDayOfWeek]);

  const [elapsed, setElapsed] = useState(() => {
    if (activeWorkout) return Math.floor((Date.now() - activeWorkout.startTime) / 1000);
    return 0;
  });

  // Focus View States
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isWorkoutFinished, setIsWorkoutFinished] = useState(false);
  const [direction, setDirection] = useState(1);
  const [activePicker, setActivePicker] = useState(null); // 'reps', 'weight', 'notes'
  const [activeSetTimer, setActiveSetTimer] = useState(null); // { left, total }
  const [isNotesOverlayOpen, setIsNotesOverlayOpen] = useState(false);
  
  // Rientro Intelligente
  const [isPaused, setIsPaused] = useState(() => activeWorkout !== null);

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

  useEffect(() => {
    let interval;
    if (activeWorkout && !isWorkoutFinished && !isPaused) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkout, isWorkoutFinished, isPaused]);

  const historicalData = useMemo(() => {
    const data = {};
    for (const session of history) {
      session.exercises.forEach(ex => {
        const exName = ex.exerciseName.toLowerCase().trim();
        if (!data[exName]) {
          data[exName] = {
            sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps })),
            tonnage: ex.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0)
          };
        }
      });
    }
    return data;
  }, [history]);

  const currentVolume = useMemo(() => {
    if (!activeWorkout) return 0;
    return activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed && !s.isWarmup).reduce((sum, s) => sum + s.weight * s.reps, 0), 0);
  }, [activeWorkout]);

  // VARIABILI DERIVATE PROTETTE
  const currentExercise = (activeWorkout && activeWorkout.exercises) ? activeWorkout.exercises[currentExerciseIndex] : null;
  const activeSetIndex = currentExercise ? currentExercise.sets.findIndex(s => !s.completed) : -1;
  const isExerciseDone = activeWorkout ? activeSetIndex === -1 : false;
  const currentSet = (currentExercise && activeSetIndex !== -1) ? currentExercise.sets[activeSetIndex] : null;
  const totalExercises = activeWorkout?.exercises?.length || 0;

  const numberVariants = {
    initial: (d) => ({ opacity: 0, x: d > 0 ? 50 : -50, scale: 0.9 }),
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -50 : 50, scale: 0.9 })
  };

  const cardVariants = {
    initial: (d) => ({ y: d > 0 ? '100dvh' : '-100dvh', opacity: 0, scale: 0.9 }),
    animate: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
    exit: (d) => ({ y: d > 0 ? '-100dvh' : '100dvh', opacity: 0, scale: 0.8, transition: { duration: 0.3 } })
  };

  const updateSetField = (exId, setIdx, field, value) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const exIndex = prev.exercises.findIndex(ex => ex.id === exId);
      if (exIndex === -1) return prev;
      const newExs = [...prev.exercises];
      const newSets = [...newExs[exIndex].sets];
      newSets[setIdx] = { ...newSets[setIdx], [field]: value };
      newExs[exIndex] = { ...newExs[exIndex], sets: newSets };
      return { ...prev, exercises: newExs };
    });
  };

  const kcal = Math.floor(currentVolume * 0.05 + (elapsed / 60) * 5);

  // Timer per le serie a tempo
  useEffect(() => {
    let interval;
    if (activeSetTimer && activeSetTimer.left > 0) {
      interval = setInterval(() => {
        setActiveSetTimer(prev => {
          if (!prev) return null;
          const next = Math.max(0, prev.left - 1);
          if (next === 0) {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            completeActiveSet(currentExercise?.id, activeSetIndex);
            return null;
          }
          return { ...prev, left: next };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSetTimer, activeSetIndex, currentExercise?.id]);

  const startWorkout = () => {
    if (!activePlan || activePlan.days.length === 0) return;
    const currentDay = activePlan.days.find(d => d.dayOfWeek === selectedDayIndex);
    if (!currentDay || currentDay.exercises.length === 0) return;
    
    const exercises = currentDay.exercises.map(ex => {
      // Normalizzazione sets: usiamo setDetails o creiamolo
      const sourceSets = ex.setDetails || Array.from({ length: parseInt(ex.sets) || 1 }).map((_, i) => ({
        id: `set-${Date.now()}-${i}`,
        reps: ex.reps,
        weight: ex.weight,
        type: 'reps',
        isWarmup: false,
        restTime: null
      }));

      const sets = sourceSets.map(s => ({
        ...s,
        completed: false,
        type: s.type || 'reps',
        isWarmup: s.isWarmup || false,
        restTime: s.restTime || null
      }));

      return { ...ex, id: `ex-${Date.now()}-${Math.random()}`, sets, isOverload: false };
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

  const handleStopWorkout = () => {
    setActiveWorkout(null);
    setCurrentTab('home');
    setIsTabBarHidden(false);
    resetTimer();
  };

  const completeActiveSet = (exId, setIndex) => {
    if (!activeWorkout) return;
    setActiveWorkout(prev => {
      const exIndex = prev.exercises.findIndex(e => e.id === exId);
      if (exIndex === -1) return prev;
      const newExs = [...prev.exercises];
      const newSets = [...newExs[exIndex].sets];
      
      newSets[setIndex] = { ...newSets[setIndex], completed: true };
      newExs[exIndex] = { ...newExs[exIndex], sets: newSets };

      const setRest = newSets[setIndex].restTime;
      const exRest = newExs[exIndex].restTime;
      const finalRest = setRest || exRest || 90;
      
      startTimer(finalRest);

      // Propaghiamo il carico solo se NON è una serie di riscaldamento
      if (!newSets[setIndex].isWarmup) {
        for (let i = setIndex + 1; i < newSets.length; i++) {
          if (!newSets[i].completed && !newSets[i].isWarmup) {
            newSets[i].weight = newSets[setIndex].weight;
          }
        }
      }

      return { ...prev, exercises: newExs };
    });

    if (navigator.vibrate) navigator.vibrate(15);
  };

  const updateSetWeight = (exId, setIndex, newWeight) => {
    setActiveWorkout(prev => {
      const exIndex = prev.exercises.findIndex(e => e.id === exId);
      if (exIndex === -1) return prev;
      const newExs = [...prev.exercises];
      const newSets = [...newExs[exIndex].sets];
      newSets[setIndex] = { ...newSets[setIndex], weight: newWeight };
      newExs[exIndex] = { ...newExs[exIndex], sets: newSets };
      return { ...prev, exercises: newExs };
    });
  };

  const updateSetReps = (exId, setIndex, newReps) => {
    setActiveWorkout(prev => {
      const exIndex = prev.exercises.findIndex(e => e.id === exId);
      if (exIndex === -1) return prev;
      const newExs = [...prev.exercises];
      const newSets = [...newExs[exIndex].sets];
      newSets[setIndex] = { ...newSets[setIndex], reps: newReps };
      newExs[exIndex] = { ...newExs[exIndex], sets: newSets };
      return { ...prev, exercises: newExs };
    });
  };

  const saveAndCloseWorkout = () => {
    if (!activeWorkout) return;
    const endTime = Date.now();
    const duration = elapsed; 
    
    let realVolume = 0;
    activeWorkout.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed && !s.isWarmup) {
          realVolume += (parseFloat(s.reps) || 0) * (parseFloat(s.weight) || 0);
        }
      });
    });

    const session = {
      id: activeWorkout.id,
      dayId: activeWorkout.dayId,
      date: endTime,
      duration,
      volume: realVolume,
      exercises: activeWorkout.exercises,
      planName: activeWorkout.planName,
      dayName: activeWorkout.dayName
    };

    setHistory(prev => [session, ...prev]);
    setActiveWorkout(null);
    setIsWorkoutFinished(false);
    setCurrentExerciseIndex(0);
    setIsPaused(false);
    setElapsed(0);
    resetTimer();
    setCurrentTab('history');
  };

  const goNextExercise = () => {
    if (currentExerciseIndex < activeWorkout.exercises.length - 1) {
      setDirection(1);
      setCurrentExerciseIndex(prev => prev + 1);
      resetTimer();
    } else {
      setIsWorkoutFinished(true);
    }
  };

  const goPrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setDirection(-1);
      setCurrentExerciseIndex(prev => prev - 1);
      resetTimer();
    }
  };

  // 1. Schermata di Selezione Allenamento (se non c'è workout attivo)
  if (!activeWorkout) {
    const currentDay = activePlan?.days.find(d => d.dayOfWeek === selectedDayIndex);
    
    return (
      <div className="flex flex-col h-full bg-black text-white p-6 pt-12 pb-24 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2 tracking-tighter">PRONTO?</h1>
          <p className="text-muted text-sm font-medium">Seleziona il giorno e inizia a spingere.</p>
        </div>

        <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {activePlan?.days.map(day => (
            <button
              key={day.id}
              onClick={() => setSelectedDayIndex(day.dayOfWeek)}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border",
                selectedDayIndex === day.dayOfWeek 
                  ? "bg-white text-black border-white shadow-lg scale-105" 
                  : "bg-white/5 text-muted border-white/10 hover:bg-white/10"
              )}
            >
              {DAY_NAMES[day.dayOfWeek]}
            </button>
          ))}
        </div>

        {currentDay ? (
          <div className="flex-1 space-y-4">
            <div className="p-5 bg-white/5 border border-white/10 rounded-[32px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-white/90">{currentDay.name}</h3>
                <span className="text-[10px] font-black text-muted bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">{currentDay.exercises.length} Esercizi</span>
              </div>
              <div className="space-y-3">
                {currentDay.exercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{ex.exerciseName}</div>
                      <div className="text-[10px] text-muted font-bold uppercase tracking-wider">{ex.sets} set × {ex.reps} reps</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={startWorkout}
              className="w-full bg-gradient-to-r from-accentOrange to-orange-500 text-black font-black text-lg uppercase tracking-widest rounded-[28px] py-6 shadow-[0_15px_40px_rgba(255,159,10,0.3)] active:scale-[0.98] transition-transform flex items-center justify-center space-x-3"
            >
              <PlayCircle size={24} />
              <span>Inizia Ora</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/5 border border-white/10 rounded-[32px] border-dashed">
            <Dumbbell size={48} className="text-muted/20 mb-4" />
            <p className="text-muted text-sm font-medium">Nessun allenamento programmato per questo giorno.</p>
          </div>
        )}
      </div>
    );
  }

  // 2. Schermata di Fine Allenamento
  if (isWorkoutFinished) {
    const completedSets = activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
    return (
      <div className="flex flex-col h-full bg-black text-white p-8 items-center justify-center text-center space-y-8">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 bg-accentOrange/20 rounded-full flex items-center justify-center">
          <Trophy size={48} className="text-accentOrange" />
        </motion.div>
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-2 uppercase italic">Missione Compiuta</h2>
          <p className="text-muted text-sm font-medium">Volume Totale: <span className="text-white font-black">{currentVolume}kg</span></p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 flex flex-col items-center">
            <span className="text-muted text-sm">Tempo</span>
            <span className="text-lg font-bold">{Math.floor(elapsed / 60)}m</span>
          </div>
          <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 flex flex-col items-center">
            <span className="text-muted text-sm">Serie</span>
            <span className="text-lg font-bold">{completedSets}</span>
          </div>
        </div>
        <button onClick={saveAndCloseWorkout} className="w-full max-w-sm bg-white text-black font-bold text-lg rounded-full py-4 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98]">
          Salva nello Storico
        </button>
      </div>
    );
  }

  // 3. RENDER GUARD GLOBALE PER TRAINING VIEW
  if (!activeWorkout || !activeWorkout.exercises || activeWorkout.exercises.length === 0 || !currentExercise) return null;

  return (
    <div className="p-3 md:p-4 flex flex-col h-[100dvh] overflow-hidden relative">
      
      {/* Glow Sfondo Radiale */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-accentBlue/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Header Layout Refresh */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 pb-2 flex justify-between items-start">
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button onClick={() => { setIsTabBarHidden(false); setCurrentTab('home'); }} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md">
            <ArrowLeft size={20} />
          </button>
          <button onClick={() => setIsPaused(true)} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md">
            <Pause size={20} />
          </button>
        </div>
        <div className="flex flex-col items-end pointer-events-none">
          <div className="flex items-center space-x-1 text-accentBlue">
            <Dumbbell size={16} />
            <span className="text-lg font-black font-mono tracking-tighter">{currentVolume}</span>
          </div>
          <span className="text-[8px] font-black text-muted uppercase tracking-widest mt-0.5">Volume Totale</span>
        </div>
      </div>

      <div className="mt-16 flex-1 flex flex-col relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div 
            key={currentExercise.id}
            custom={direction}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col"
          >
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-6 flex-1 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-3xl font-black tracking-tighter leading-none italic uppercase flex flex-col">
                  <span className="text-muted/40 text-xs font-black tracking-widest mb-1 italic">Esercizio {currentExerciseIndex + 1}/{totalExercises}</span>
                  {currentExercise.exerciseName}
                </h3>
              </div>

              {/* Active Set UI */}
              <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] shrink-0">
                <AnimatePresence mode="wait">
                  {!isExerciseDone ? (
                    <motion.div 
                      key={`set-${activeSetIndex}`}
                      variants={numberVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="w-full flex flex-col items-center flex-1 justify-center"
                    >
                      <div className="flex items-center justify-center w-full gap-x-6 relative">
                        {currentSet?.isWarmup && (
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-2xl flex flex-col items-center shrink-0 min-w-max">
                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Riscaldamento</span>
                          </div>
                        )}
                        
                        <div className="flex flex-col items-center flex-1" onClick={() => setActivePicker('weight')}>
                          <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Kg</span>
                          <div className="relative group flex justify-center w-full py-2 cursor-pointer active:scale-95 transition-transform">
                            <span className={cn("text-6xl md:text-7xl font-bold font-mono tracking-tighter", currentSet?.isWarmup ? "text-muted/40" : "text-white")}>
                              {currentSet?.weight || 0}
                            </span>
                          </div>
                        </div>

                        <span className="text-3xl text-muted/30 font-light mt-[-1rem] shrink-0">x</span>

                        <div className="flex flex-col items-center flex-1" onClick={() => setActivePicker('reps')}>
                          <div className="flex items-center space-x-1.5 mb-1">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{currentSet?.type === 'time' ? 'Sec' : 'Rep'}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!currentExercise) return;
                                const newType = currentSet?.type === 'time' ? 'reps' : 'time';
                                updateSetField(currentExercise.id, activeSetIndex, 'type', newType);
                              }}
                              className="text-accentBlue p-0.5 hover:bg-accentBlue/10 rounded transition-colors"
                            >
                              <RefreshCcw size={10} />
                            </button>
                          </div>
                          <div className="relative group flex justify-center w-full py-2 cursor-pointer active:scale-95 transition-transform">
                            <span className={cn("text-6xl md:text-7xl font-bold font-mono tracking-tighter", currentSet?.isWarmup ? "text-muted/40" : (activeSetTimer ? "text-accentBlue" : "text-white"))}>
                              {activeSetTimer ? activeSetTimer.left : (currentSet?.reps || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 w-full px-4 flex flex-col items-center">
                        <motion.button 
                          onClick={() => {
                            if (!currentSet) return;
                            if (currentSet.type === 'time') {
                              if (activeSetTimer) {
                                setActiveSetTimer(null);
                                completeActiveSet(currentExercise.id, activeSetIndex);
                              } else {
                                setActiveSetTimer({ left: parseInt(currentSet.reps) || 30, total: parseInt(currentSet.reps) || 30 });
                              }
                            } else {
                              completeActiveSet(currentExercise.id, activeSetIndex);
                              if (isTimerRunning) resetTimer();
                            }
                          }}
                          className={cn(
                            "w-full font-black text-lg uppercase tracking-widest rounded-2xl py-4 shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2 z-10",
                            activeSetTimer ? "bg-red-500 text-white shadow-red-500/20" : "bg-gradient-to-r from-accentOrange to-orange-500 text-white shadow-[0_10px_30px_rgba(255,159,10,0.3)]"
                          )}
                        >
                          {activeSetTimer ? <XCircle size={24} /> : (currentSet?.type === 'time' ? <Play size={24} /> : <CheckCircle2 size={24} />)}
                          <span>
                            {activeSetTimer ? "STOP" : (currentSet?.type === 'time' ? "START" : (isTimerRunning ? "SALTA & CHECK" : "CHECK"))}
                          </span>
                        </motion.button>

                        <AnimatePresence>
                          {isTimerRunning && (
                            <motion.div 
                              key="timer-ring"
                              initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }}
                              className="mt-8 relative flex flex-col items-center"
                              onClick={() => setIsTimerFullscreen(true)}
                            >
                              <div className="relative w-[120px] h-[120px] flex items-center justify-center">
                                {/* Glow Effect per recuperi personalizzati */}
                                {currentExercise?.sets?.[activeSetIndex - 1]?.restTime && (
                                  <motion.div 
                                    className="absolute inset-0 rounded-full bg-accentOrange/30 blur-xl z-0"
                                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                  />
                                )}
                                <svg className="w-full h-full transform -rotate-90 relative z-10">
                                  <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/5" />
                                  <motion.circle 
                                    cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6" className="text-accentOrange"
                                    strokeDasharray={339.3} animate={{ strokeDashoffset: 339.3 - (timerLeft / timerTotal) * 339.3 }}
                                    transition={{ duration: 0.1, ease: "linear" }}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                  {timerLeft > 0 ? (
                                    <>
                                      <span className="text-4xl font-black font-mono text-white tabular-nums">{Math.ceil(timerLeft)}</span>
                                      <div className="flex flex-col items-center">
                                        <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mt-1">Recupero</span>
                                        {currentExercise?.sets?.[activeSetIndex - 1]?.restTime && (
                                          <span className="text-[7px] font-bold text-accentOrange uppercase tracking-widest mt-1">Special</span>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-2xl font-black text-[#34C759] uppercase tracking-widest animate-pulse">VIA!</span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="done" variants={numberVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={40} className="text-green-500" />
                      </div>
                      <span className="text-xl font-bold text-center leading-tight">Ottimo lavoro!</span>
                      <button onClick={goNextExercise} className="w-full max-w-[200px] mt-4 bg-white text-black font-bold text-base uppercase tracking-widest rounded-2xl py-4 active:scale-[0.98]">
                        {currentExerciseIndex === totalExercises - 1 ? "Termina" : "Prossimo"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigazione Footer */}
      {!isExerciseDone && (
        <div className="mt-4 flex justify-between items-center px-4 mb-2">
          <button onClick={goPrevExercise} disabled={currentExerciseIndex === 0} className="p-3 text-muted disabled:opacity-20 active:scale-90 transition-transform">
            <ChevronDown className="rotate-90" />
          </button>
          <div className="flex space-x-1">
            {activeWorkout.exercises.map((_, idx) => (
              <div key={idx} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-500", idx === currentExerciseIndex ? "bg-accentBlue w-4" : "bg-white/10")} />
            ))}
          </div>
          <button onClick={goNextExercise} className="p-3 text-muted active:scale-90 transition-transform">
            <ChevronDown className="-rotate-90" />
          </button>
        </div>
      )}

      {/* Overlay Pausa */}
      <AnimatePresence>
        {isPaused && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setIsPaused(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 z-50 bg-[#1c1c1e] border-t border-white/10 rounded-t-[32px] px-8 pt-4 pb-12 shadow-2xl">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-center space-x-3 mb-8">
                <Pause size={24} className="text-white" />
                <h3 className="font-bold text-xl uppercase tracking-tighter italic">Sessione Sospesa</h3>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setIsPaused(false)} className="flex-1 bg-white/5 text-white font-bold py-4 rounded-2xl border border-white/10 hover:bg-white/10 active:scale-95 transition-all">Continua</button>
                <button onClick={handleStopWorkout} className="flex-1 bg-red-500/20 text-red-500 font-bold py-4 rounded-2xl border border-red-500/20 hover:bg-red-500/30 active:scale-95 transition-all">Interrompi</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pickers */}
      <AnimatePresence>
        {activePicker && currentSet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={() => setActivePicker(null)} />
            <div className="fixed bottom-0 left-0 right-0 z-[70]">
              {activePicker === 'weight' ? (
                <WeightScrollPicker 
                  initialValue={currentSet.weight}
                  onSave={(val) => { updateSetWeight(currentExercise.id, activeSetIndex, val); setActivePicker(null); }}
                  onClose={() => setActivePicker(null)}
                />
              ) : activePicker === 'reps' ? (
                currentSet.type === 'time' ? (
                  <TimeScrollPicker 
                    title="Secondi"
                    initialValue={currentSet.reps}
                    onSelect={(val) => { updateSetReps(currentExercise.id, activeSetIndex, val); setActivePicker(null); }}
                    onClose={() => setActivePicker(null)}
                    isOpen={activePicker === 'reps'}
                  />
                ) : (
                  <SingleScrollPicker 
                    title="Ripetizioni"
                    options={Array.from({ length: 50 }, (_, i) => i + 1)}
                    initialValue={currentSet.reps}
                    onSelect={(val) => { updateSetReps(currentExercise.id, activeSetIndex, val); setActivePicker(null); }}
                    onClose={() => setActivePicker(null)}
                    isOpen={activePicker === 'reps'}
                  />
                )
              ) : null}
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
