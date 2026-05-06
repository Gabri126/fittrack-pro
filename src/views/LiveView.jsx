import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlayCircle, CheckCircle2, Trophy, AlertTriangle, ArrowLeft, Heart, Flame, Dumbbell, PlaySquare, Zap, Pause, Play as PlayIcon, NotebookPen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '../App';
import { SingleScrollPicker, WeightScrollPicker } from '../components/Pickers';

export default function LiveView({ library, activeWorkout, setActiveWorkout, setHistory, history, startTimer, resetTimer, setCurrentTab, setIsTabBarHidden }) {
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
  const [activePicker, setActivePicker] = useState(null);
  const [isNotesOverlayOpen, setIsNotesOverlayOpen] = useState(false);
  
  // Rientro Intelligente: se il componente viene montato e c'è già una sessione attiva, andiamo in Pausa per chiedere se Riprendere o Interrompere.
  const [isPaused, setIsPaused] = useState(() => activeWorkout !== null);

  // Forza visibilità della Tab Bar quando usciamo dalla LiveView
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
    return activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).reduce((sum, s) => sum + s.weight * s.reps, 0), 0);
  }, [activeWorkout]);

  const kcal = Math.floor(currentVolume * 0.05 + (elapsed / 60) * 5);

  const startWorkout = () => {
    if (!activePlan || activePlan.days.length === 0) return;
    const currentDay = activePlan.days.find(d => d.dayOfWeek === selectedDayIndex);
    if (!currentDay || currentDay.exercises.length === 0) return;
    
    const exercises = currentDay.exercises.map(ex => {
      const sets = Array.from({ length: ex.sets }).map((_, i) => ({
        id: `set-${Date.now()}-${i}`,
        reps: ex.reps,
        weight: ex.weight,
        completed: false
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

  const saveAndCloseWorkout = () => {
    if (!activeWorkout) return;
    const endTime = Date.now();
    const duration = elapsed; 
    
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

  const handleStopWorkout = () => {
    if (!activeWorkout) return;
    const endTime = Date.now();
    const duration = elapsed; 
    
    let realVolume = 0;
    activeWorkout.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          realVolume += s.reps * s.weight;
        }
      });
    });

    if (realVolume > 0) {
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
    }

    setActiveWorkout(null);
    setIsWorkoutFinished(false);
    setCurrentExerciseIndex(0);
    setIsPaused(false);
    setElapsed(0);
    resetTimer();
    setCurrentTab('history');
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

  const completeActiveSet = (exId, setIndex) => {
    setActiveWorkout(prev => {
      let isOverload = false;
      
      const newEx = prev.exercises.map(ex => {
        if (ex.id !== exId) return ex;
        
        let newSets = [...ex.sets];
        newSets[setIndex] = { ...newSets[setIndex], completed: true };
        
        const currentWeight = newSets[setIndex].weight;
        const currentReps = newSets[setIndex].reps;
        for (let i = setIndex + 1; i < newSets.length; i++) {
          if (!newSets[i].completed) {
            newSets[i] = { ...newSets[i], weight: currentWeight, reps: currentReps };
          }
        }

        const allCompletedNow = newSets.every(s => s.completed);
        
        if (allCompletedNow) {
          const currentTonnage = newSets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
          const exName = ex.exerciseName.toLowerCase().trim();
          const lastData = historicalData[exName];
          if (lastData && currentTonnage > lastData.tonnage) {
            isOverload = true;
          }
        }

        return { ...ex, sets: newSets, isOverload: isOverload || ex.isOverload };
      });

      if (isOverload) {
        confetti({
          particleCount: 400,
          spread: 160,
          origin: { y: 0.4 },
          colors: ['#FFD700', '#FFA500', '#FFFFFF'],
          zIndex: 9999
        });
      }

      const exRestTime = prev.exercises.find(e => e.id === exId)?.restTime;
      startTimer(exRestTime && exRestTime > 0 ? exRestTime : 90);
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

  const goNextExercise = () => {
    if (currentExerciseIndex < activeWorkout.exercises.length - 1) {
      setDirection(1);
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      confetti({
        particleCount: 300,
        spread: 150,
        origin: { y: 0.5 },
        colors: ['#0A84FF', '#FFFFFF', '#34C759'],
        zIndex: 9999
      });
      setIsWorkoutFinished(true);
    }
  };

  const goPrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setDirection(-1);
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  // Picker Configuration
  const repsArray = useMemo(() => Array.from({ length: 100 }, (_, i) => i + 1), []);

  // -- RENDERING --

  if (!activePlan) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[100dvh] pb-32 space-y-4 text-center">
        <AlertTriangle size={48} className="text-accentOrange opacity-80" />
        <h2 className="text-2xl font-bold">Nessuna Scheda Attiva</h2>
        <p className="text-muted text-sm">Vai nell'Editor e imposta una scheda come "Attiva" per poterti allenare.</p>
        <button onClick={() => setCurrentTab('editor')} className="px-6 py-3 bg-white text-black font-bold rounded-full mt-4">Vai all'Editor</button>
      </div>
    );
  }

  if (activePlan.days.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[100dvh] pb-32 space-y-4 text-center">
        <AlertTriangle size={48} className="text-accentOrange opacity-80" />
        <h2 className="text-2xl font-bold">Scheda Vuota</h2>
        <p className="text-muted text-sm">La scheda attiva "{activePlan.name}" non ha ancora giorni programmati.</p>
        <button onClick={() => setCurrentTab('editor')} className="px-6 py-3 bg-white text-black font-bold rounded-full mt-4">Vai all'Editor</button>
      </div>
    );
  }

  const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  if (!activeWorkout) {
    const selectedDayData = activePlan.days.find(d => d.dayOfWeek === selectedDayIndex);
    const hasExercises = selectedDayData && selectedDayData.exercises.length > 0;
    const isRestDay = !hasExercises;

    // Find last unexecuted programmed day for "Recupera Sessione"
    const executedDayIds = new Set(history.map(s => s.dayId));
    const lastUnexecutedDay = [...activePlan.days].reverse().find(d => d.exercises.length > 0 && !executedDayIds.has(d.id));

    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[100dvh] pb-32 space-y-8">
        <div className={cn("w-24 h-24 rounded-full flex items-center justify-center border shadow-[0_0_30px]", isRestDay ? "bg-accentBlue/10 border-accentBlue/20 shadow-accentBlue/20" : "bg-accentOrange/10 border-accentOrange/20 shadow-accentOrange/20")}>
          <PlayCircle size={48} className={cn("ml-2", isRestDay ? "text-accentBlue" : "text-accentOrange")} />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">{isRestDay ? 'Giorno di Riposo' : 'Pronto ad allenarti?'}</h2>
          <p className="text-muted">Scheda: <strong className="text-white">{activePlan.name}</strong></p>
          {isRestDay && <p className="text-muted text-sm mt-1">Oggi non hai esercizi programmati</p>}
        </div>
        
        <div className="flex space-x-2 overflow-x-auto max-w-full pb-2 hide-scrollbar w-full justify-start md:justify-center px-4">
          {activePlan.days.map((day) => {
             const hasData = day.exercises && day.exercises.length > 0;
             return (
               <button 
                 key={day.id} 
                 onClick={() => setSelectedDayIndex(day.dayOfWeek)} 
                 className={cn("px-5 py-3 rounded-full text-sm font-semibold transition-all border shrink-0", selectedDayIndex === day.dayOfWeek ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-surface border-border/50 text-muted hover:text-white", !hasData && "opacity-50")}
               >
                 {DAY_NAMES[day.dayOfWeek]}
               </button>
             )
          })}
        </div>

        {isRestDay ? (
          <div className="w-full max-w-sm space-y-3">
            <button 
              onClick={() => {
                // Start extra workout: pick a different day or just start fresh
                const firstDayWithExercises = activePlan.days.find(d => d.exercises.length > 0);
                if (firstDayWithExercises) {
                  setSelectedDayIndex(firstDayWithExercises.dayOfWeek);
                }
              }}
              className="w-full bg-white/10 border border-white/20 text-white font-bold text-base rounded-2xl py-4 hover:bg-white/20 transition-colors active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <Dumbbell size={20} /><span>Allenamento Extra</span>
            </button>
            {lastUnexecutedDay && (
              <button 
                onClick={() => setSelectedDayIndex(lastUnexecutedDay.dayOfWeek)}
                className="w-full bg-accentBlue/10 border border-accentBlue/30 text-accentBlue font-bold text-base rounded-2xl py-4 hover:bg-accentBlue/20 transition-colors active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <PlayCircle size={20} /><span>Recupera Sessione ({DAY_NAMES[lastUnexecutedDay.dayOfWeek]})</span>
              </button>
            )}
          </div>
        ) : (
          <button 
            onClick={startWorkout}
            className="w-full max-w-sm bg-gradient-to-r from-accentOrange to-orange-500 text-white font-bold text-lg rounded-3xl py-4 shadow-[0_0_20px_rgba(255,159,10,0.4)] hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            Inizia Allenamento
          </button>
        )}
      </div>
    );
  }

  if (isWorkoutFinished) {
    let finalVolume = 0;
    let completedSets = 0;
    activeWorkout.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          finalVolume += s.reps * s.weight;
          completedSets++;
        }
      });
    });

    const lastSession = history[0];
    const volumeDiffPct = lastSession && lastSession.volume > 0 
      ? Math.round(((finalVolume - lastSession.volume) / lastSession.volume) * 100)
      : 0;

    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[100dvh] pb-32 space-y-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 shadow-[0_0_30px_rgba(52,199,89,0.3)]">
          <Trophy size={40} className="text-green-500" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-1">Sessione Completata</h2>
          <p className="text-muted text-sm">Allenamento salvato con successo.</p>
        </div>

        {lastSession && volumeDiffPct !== 0 && (
          <div className={cn("px-4 py-2 rounded-full font-bold text-xs border flex items-center", volumeDiffPct > 0 ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-orange-500/10 text-orange-400 border-orange-500/30")}>
            {volumeDiffPct > 0 ? <Zap size={14} className="mr-1.5" /> : <AlertTriangle size={14} className="mr-1.5" />}
            {volumeDiffPct > 0 ? `Oggi hai sollevato il +${volumeDiffPct}% rispetto all'ultima volta!` : `Volume inferiore del ${Math.abs(volumeDiffPct)}% rispetto all'ultima volta.`}
          </div>
        )}

        <div className="bg-surface border border-border/50 rounded-[24px] p-5 w-full max-w-sm shadow-soft space-y-3">
          <div className="flex justify-between items-center border-b border-border/50 pb-3">
            <span className="text-muted flex items-center text-sm"><Dumbbell size={14} className="mr-2" /> Volume Totale</span>
            <span className="text-lg font-bold text-accentBlue">{finalVolume.toLocaleString()} kg</span>
          </div>
          <div className="flex justify-between items-center border-b border-border/50 pb-3">
            <span className="text-muted flex items-center text-sm"><Flame size={14} className="mr-2" /> Calorie</span>
            <span className="text-lg font-bold text-accentOrange">{kcal} kcal</span>
          </div>
          <div className="flex justify-between items-center pb-1">
            <span className="text-muted text-sm">Serie Completate</span>
            <span className="text-lg font-bold">{completedSets}</span>
          </div>
        </div>

        <button 
          onClick={saveAndCloseWorkout}
          className="w-full max-w-sm bg-white text-black font-bold text-lg rounded-full py-4 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          Salva nello Storico
        </button>
      </div>
    );
  }

  const currentExercise = activeWorkout.exercises[currentExerciseIndex];
  const allSetsCompleted = currentExercise.sets.every(s => s.completed);
  const totalExercises = activeWorkout.exercises.length;
  
  const activeSetIndex = currentExercise.sets.findIndex(s => !s.completed);
  const isExerciseDone = activeSetIndex === -1;
  const currentSet = !isExerciseDone ? currentExercise.sets[activeSetIndex] : null;

  const cardVariants = {
    initial: (direction) => ({ y: direction > 0 ? '100dvh' : '-100dvh', opacity: 0, scale: 0.9 }),
    animate: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
    exit: (direction) => ({ y: direction > 0 ? '-100dvh' : '100dvh', opacity: 0, scale: 0.8, transition: { duration: 0.3 } })
  };

  const numberVariants = {
    initial: { y: 40, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { y: -40, opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="p-3 md:p-4 flex flex-col h-[100dvh] overflow-hidden relative">
      
      {/* Glow Sfondo Radiale */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-accentBlue/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Header Biometrico Minimalista */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 pb-2 flex justify-between items-start pointer-events-none">
        <div className="flex items-center space-x-4 text-white font-mono">
          <div className="flex flex-col items-center">
            <Heart size={14} className="text-white fill-white animate-pulse mb-1" strokeWidth={2} />
            <span className="font-bold text-xs tracking-wider">124</span>
          </div>
          <div className="flex flex-col items-center">
            <Flame size={14} className="text-accentOrange mb-1" strokeWidth={2} />
            <span className="font-bold text-xs tracking-wider text-accentOrange">{kcal}</span>
          </div>
        </div>

        {/* Timer Elapsed al Centro */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center top-4">
          <span className="text-[9px] text-muted font-bold uppercase tracking-widest mb-0.5">Elapsed</span>
          <span className="font-bold font-mono text-base tracking-wider text-white drop-shadow-md">{formatElapsed(elapsed)}</span>
        </div>

        <div className="flex flex-col items-center text-white font-mono">
          <Dumbbell size={14} className="text-accentBlue mb-1" strokeWidth={2} />
          <span className="font-bold text-xs tracking-wider text-accentBlue">{currentVolume.toLocaleString()}</span>
        </div>
      </div>

      <header className="pt-16 shrink-0 flex flex-col items-center justify-center relative z-10 px-1 mb-2">
        <div className="flex items-center justify-between w-full relative">
          <button onClick={goPrevExercise} disabled={currentExerciseIndex === 0} className={cn("p-2 rounded-full transition-colors absolute left-0 top-1/2 -translate-y-1/2", currentExerciseIndex === 0 ? "opacity-0 pointer-events-none" : "hover:bg-white/10 text-muted hover:text-white z-20 pointer-events-auto")}>
            <ArrowLeft size={20} />
          </button>
          


          <button onClick={() => setIsPaused(true)} className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-white transition-colors absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
            <Pause size={20} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 relative w-full h-full min-h-0 flex items-center justify-center mt-2 pb-4">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div 
            key={currentExerciseIndex}
            custom={direction}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-surface/90 backdrop-blur-xl border border-border/50 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-md h-full max-h-full flex flex-col"
          >
            {/* Media Area Flessibile */}
            <div className="shrink w-full aspect-video max-h-[16vh] bg-black/60 relative flex flex-col items-center justify-center text-muted/30 min-h-[60px]">
               <PlaySquare size={24} className="mb-1" />
               <span className="text-[9px] font-bold uppercase tracking-widest">Media Area</span>
            </div>

            {/* Scrollable Card Body */}
            <div className="p-4 md:p-6 flex-1 flex flex-col overflow-y-auto hide-scrollbar relative">
              
              {currentExercise.isOverload && (
                <div className="self-center bg-[#FFD700] text-black font-black text-[9px] uppercase tracking-widest px-2 py-1 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.3)] z-20 flex items-center mb-4 shrink-0">
                  <Trophy size={10} className="mr-1" /> Progression Unlocked
                </div>
              )}

              <h3 className="font-bold text-xl md:text-2xl leading-tight mb-4 tracking-tight shrink-0 text-center flex items-center justify-center gap-2">
                {currentExercise.exerciseName}
                {currentExercise.notes && (
                  <button
                    onClick={() => setIsNotesOverlayOpen(true)}
                    className="text-accentOrange animate-pulse shrink-0"
                    style={{ lineHeight: 1 }}
                  >
                    <NotebookPen size={18} />
                  </button>
                )}
              </h3>



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
                      <div className="flex items-center justify-center w-full gap-x-6">
                        {/* Peso (Nativo) */}
                        <div className="flex flex-col items-center flex-1" onClick={() => setActivePicker('weight')}>
                          <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Kg</span>
                          <div className="relative group flex justify-center w-full py-2 cursor-pointer active:scale-95 transition-transform">
                            <span className="text-6xl md:text-7xl font-bold font-mono text-white tracking-tighter">
                              {currentExercise.sets[activeSetIndex].weight}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-muted/60 uppercase tracking-widest mt-2">
                            Last: {historicalData[currentExercise.exerciseName.toLowerCase().trim()]?.sets[activeSetIndex] ? `${historicalData[currentExercise.exerciseName.toLowerCase().trim()].sets[activeSetIndex].weight}` : '--'}
                          </span>
                        </div>

                        {/* Moltiplicatore */}
                        <span className="text-3xl text-muted/30 font-light mt-[-1rem] shrink-0">x</span>

                        {/* Ripetizioni (Nativo) */}
                        <div className="flex flex-col items-center flex-1" onClick={() => setActivePicker('reps')}>
                          <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Rep</span>
                          <div className="relative group flex justify-center w-full py-2 cursor-pointer active:scale-95 transition-transform">
                            <span className="text-6xl md:text-7xl font-bold font-mono text-white tracking-tighter">
                              {currentExercise.sets[activeSetIndex].reps}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-muted/60 uppercase tracking-widest mt-2">
                            Last: {historicalData[currentExercise.exerciseName.toLowerCase().trim()]?.sets[activeSetIndex] ? historicalData[currentExercise.exerciseName.toLowerCase().trim()].sets[activeSetIndex].reps : '--'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-10 w-full px-4">
                        <button 
                          onClick={() => completeActiveSet(currentExercise.id, activeSetIndex)}
                          className="w-full bg-gradient-to-r from-accentOrange to-orange-500 text-white font-black text-lg uppercase tracking-widest rounded-2xl py-4 shadow-[0_10px_30px_rgba(255,159,10,0.3)] hover:opacity-90 transition-transform active:scale-[0.98] flex items-center justify-center space-x-2"
                        >
                          <CheckCircle2 size={24} />
                          <span>Check</span>
                        </button>
                      </div>

                    </motion.div>
                  ) : (
                    <motion.div 
                      key="done"
                      variants={numberVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="flex flex-col items-center justify-center space-y-4"
                    >
                      <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={40} className="text-green-500" />
                      </div>
                      <span className="text-xl font-bold text-center leading-tight">Ottimo lavoro!</span>
                      
                      <button 
                        onClick={goNextExercise}
                        className="w-full max-w-[200px] mt-4 bg-white text-black font-bold text-base uppercase tracking-widest rounded-2xl py-4 shadow-[0_5px_20px_rgba(255,255,255,0.2)] hover:bg-neutral-200 transition-transform active:scale-[0.98]"
                      >
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

      {/* Overlay Pausa — Bottom Sheet Design */}
      <AnimatePresence>
        {isPaused && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsPaused(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#1c1c1e] border-t border-white/10 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] px-8 pt-4 pb-12"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Pause size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Sessione Sospesa</h3>
                  <p className="text-muted text-xs">{formatElapsed(elapsed)} trascorsi</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsPaused(false)}
                  className="flex-1 py-4 rounded-2xl bg-white text-black font-bold text-base shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  <PlayIcon size={18} className="fill-black" />
                  <span>Riprendi</span>
                </button>
                <button 
                  onClick={handleStopWorkout}
                  className="flex-1 py-4 rounded-2xl bg-transparent border border-red-500/40 text-red-400 font-bold text-sm hover:bg-red-500/10 active:scale-95 transition-all flex items-center justify-center"
                >
                  Termina
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Pickers */}
      <SingleScrollPicker 
        isOpen={activePicker === 'reps'}
        onClose={() => setActivePicker(null)}
        title="Ripetizioni"
        options={repsArray}
        initialValue={currentSet?.reps}
        onSelect={val => updateSet(currentExercise.id, currentSet.id, 'reps', val)}
      />
      <WeightScrollPicker 
        isOpen={activePicker === 'weight'}
        onClose={() => setActivePicker(null)}
        title="Carico (Kg)"
        initialValue={currentSet?.weight}
        onSelect={val => updateSet(currentExercise.id, currentSet.id, 'weight', val)}
      />

      {/* Notes Reading Overlay */}
      <AnimatePresence>
        {isNotesOverlayOpen && currentExercise.notes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={() => setIsNotesOverlayOpen(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#1c1c1e] border-t border-accentOrange/30 rounded-t-[32px] shadow-[0_-10px_40px_rgba(255,159,10,0.15)] z-10 p-6 pb-10"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-accentOrange">
                  <NotebookPen size={18} />
                  <span className="font-bold text-sm uppercase tracking-widest">Note Tecniche</span>
                </div>
                <button
                  onClick={() => setIsNotesOverlayOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-white text-base leading-relaxed">{currentExercise.notes}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
