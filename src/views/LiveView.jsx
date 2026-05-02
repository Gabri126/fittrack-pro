import React, { useState, useEffect, useMemo } from 'react';
import { PlayCircle, CheckCircle2, Trophy, AlertTriangle, ArrowLeft, Heart, Flame, Dumbbell, PlaySquare, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '../App';

export default function LiveView({ library, activeWorkout, setActiveWorkout, setHistory, history, startTimer, resetTimer, setCurrentTab }) {
  const activePlan = library.find(p => p.status === 'active');

  const initialDayIndex = useMemo(() => {
    if (!activePlan || activePlan.days.length === 0) return 0;
    if (history.length > 0) {
      const lastSessionDayId = history[0].dayId;
      const lastIndex = activePlan.days.findIndex(d => d.id === lastSessionDayId);
      if (lastIndex !== -1) return (lastIndex + 1) % activePlan.days.length;
    }
    return 0;
  }, [activePlan, history]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(initialDayIndex);
  useEffect(() => { setSelectedDayIndex(initialDayIndex); }, [initialDayIndex]);

  const [elapsed, setElapsed] = useState(0);

  // Focus View States
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isWorkoutFinished, setIsWorkoutFinished] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    let interval;
    if (activeWorkout && !isWorkoutFinished) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkout, isWorkoutFinished]);

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
    const currentDay = activePlan.days[selectedDayIndex];
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
      dayName: currentDay.name,
      planName: activePlan.name,
      startTime: Date.now(),
      exercises
    });
    setCurrentExerciseIndex(0);
    setIsWorkoutFinished(false);
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

      startTimer();
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

  if (!activeWorkout) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[100dvh] pb-32 space-y-8">
        <div className="w-24 h-24 bg-accentBlue/10 rounded-full flex items-center justify-center border border-accentBlue/20 shadow-[0_0_30px_rgba(10,132,255,0.2)]">
          <PlayCircle size={48} className="text-accentBlue ml-2" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Pronto ad allenarti?</h2>
          <p className="text-muted">Scheda: <strong className="text-white">{activePlan.name}</strong></p>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto max-w-full pb-2 hide-scrollbar w-full justify-start md:justify-center px-4">
          {activePlan.days.map((day, idx) => {
             const hasData = day.exercises && day.exercises.length > 0;
             return (
               <button key={day.id} onClick={() => setSelectedDayIndex(idx)} className={cn("px-5 py-3 rounded-full text-sm font-semibold transition-all border shrink-0", selectedDayIndex === idx ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-surface border-border/50 text-muted hover:text-white", !hasData && "opacity-50")}>
                 {day.name}
               </button>
             )
          })}
        </div>

        <button 
          onClick={startWorkout}
          disabled={!activePlan.days[selectedDayIndex] || activePlan.days[selectedDayIndex].exercises.length === 0}
          className="w-full max-w-sm bg-gradient-to-r from-accentBlue to-blue-500 text-white font-bold text-lg rounded-3xl py-4 shadow-[0_0_20px_rgba(10,132,255,0.4)] disabled:opacity-50 disabled:shadow-none hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          Inizia Allenamento
        </button>
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

  const cardVariants = {
    initial: (direction) => ({
      y: direction > 0 ? '100dvh' : '-100dvh',
      opacity: 0,
      scale: 0.9,
    }),
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 200, damping: 20 }
    },
    exit: (direction) => ({
      y: direction > 0 ? '-100dvh' : '100dvh',
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 }
    })
  };

  const numberVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300 } },
    exit: { y: -20, opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="p-3 md:p-4 pb-[110px] flex flex-col h-[100dvh] overflow-hidden relative">
      
      {/* Header Biometrico Minimalista */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 pb-2 flex justify-between items-center pointer-events-none">
        <div className="flex items-center space-x-4 text-white font-mono">
          <div className="flex items-center space-x-1.5 text-xs">
            <Heart size={12} className="text-white" strokeWidth={2.5} />
            <span className="font-bold">124</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs">
            <Flame size={12} className="text-white" strokeWidth={2.5} />
            <span className="font-bold">{kcal}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 text-white font-mono text-xs">
          <Dumbbell size={12} className="text-white" strokeWidth={2.5} />
          <span className="font-bold">{currentVolume.toLocaleString()}</span>
        </div>
      </div>

      <header className="pt-10 shrink-0 flex items-center justify-between relative z-10 px-1 mb-2">
        <button onClick={goPrevExercise} disabled={currentExerciseIndex === 0} className={cn("p-2 rounded-full transition-colors", currentExerciseIndex === 0 ? "opacity-0" : "hover:bg-white/10 text-muted hover:text-white z-20 pointer-events-auto")}>
          <ArrowLeft size={20} />
        </button>
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
          Esercizio {currentExerciseIndex + 1} / {totalExercises}
        </span>
        <div className="w-9"></div> {/* Spacer */}
      </header>

      {/* Main Container */}
      <div className="flex-1 relative w-full h-full min-h-0">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div 
            key={currentExerciseIndex}
            custom={direction}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-surface border border-border/50 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-full absolute inset-0 flex flex-col"
          >
            {/* Media Area Flessibile */}
            <div className="shrink w-full max-h-[15vh] md:max-h-[20vh] aspect-video bg-black/60 relative flex flex-col items-center justify-center text-muted/30 min-h-[60px]">
               <PlaySquare size={24} className="mb-1" />
               <span className="text-[9px] font-bold uppercase tracking-widest">Media Area</span>
            </div>

            {/* Scrollable Card Body */}
            <div className="p-4 md:p-6 flex-1 flex flex-col overflow-y-auto hide-scrollbar relative">
              
              {currentExercise.isOverload && (
                <div className="self-end bg-[#FFD700] text-black font-black text-[9px] uppercase tracking-widest px-2 py-1 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.3)] z-20 flex items-center mb-2 shrink-0">
                  <Trophy size={10} className="mr-1" /> Progression Unlocked
                </div>
              )}

              <h3 className="font-bold text-xl md:text-2xl leading-tight mb-3 tracking-tight shrink-0">
                {currentExercise.exerciseName}
              </h3>

              {/* Segmented Progress Bar */}
              <div className="flex space-x-1 w-full mb-2 shrink-0">
                {currentExercise.sets.map((s, i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-500", s.completed ? "bg-accentBlue shadow-[0_0_8px_rgba(10,132,255,0.8)]" : "bg-border/50")} />
                ))}
              </div>

              {/* Active Set UI */}
              <div className="flex-1 flex flex-col items-center justify-center min-h-[140px] py-2 shrink-0">
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
                      <h4 className="text-accentBlue font-bold text-[10px] tracking-widest uppercase mb-4">
                        Set {activeSetIndex + 1} di {currentExercise.sets.length}
                      </h4>

                      <div className="flex items-center justify-center w-full gap-x-2">
                        {/* Peso */}
                        <div className="flex flex-col items-center flex-1">
                          <div className="relative group flex justify-center w-full">
                            <input 
                              type="number"
                              value={currentExercise.sets[activeSetIndex].weight}
                              onChange={(e) => updateSet(currentExercise.id, currentExercise.sets[activeSetIndex].id, 'weight', e.target.value)}
                              className="w-full max-w-[100px] bg-transparent text-center text-5xl md:text-6xl font-bold font-mono text-white focus:outline-none focus:ring-0 placeholder:text-white/20 p-0 m-0 border-none hide-scrollbar"
                              step="0.5"
                            />
                            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-muted uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">KG</span>
                          </div>
                          
                          <span className="text-[9px] font-bold text-muted/60 uppercase tracking-widest mt-5">
                            Last: {historicalData[currentExercise.exerciseName.toLowerCase().trim()]?.sets[activeSetIndex] ? `${historicalData[currentExercise.exerciseName.toLowerCase().trim()].sets[activeSetIndex].weight}kg` : '--'}
                          </span>
                        </div>

                        {/* Moltiplicatore */}
                        <span className="text-2xl text-muted/30 font-light mt-[-1.5rem] shrink-0">x</span>

                        {/* Ripetizioni */}
                        <div className="flex flex-col items-center flex-1">
                          <div className="relative group flex justify-center w-full">
                            <input 
                              type="number"
                              value={currentExercise.sets[activeSetIndex].reps}
                              onChange={(e) => updateSet(currentExercise.id, currentExercise.sets[activeSetIndex].id, 'reps', e.target.value)}
                              className="w-full max-w-[100px] bg-transparent text-center text-5xl md:text-6xl font-bold font-mono text-white focus:outline-none focus:ring-0 placeholder:text-white/20 p-0 m-0 border-none hide-scrollbar"
                            />
                            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-muted uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">REP</span>
                          </div>
                          
                          <span className="text-[9px] font-bold text-muted/60 uppercase tracking-widest mt-5">
                            Last: {historicalData[currentExercise.exerciseName.toLowerCase().trim()]?.sets[activeSetIndex] ? historicalData[currentExercise.exerciseName.toLowerCase().trim()].sets[activeSetIndex].reps : '--'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="done"
                      variants={numberVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="flex flex-col items-center justify-center space-y-3"
                    >
                      <CheckCircle2 size={48} className="text-green-500" />
                      <span className="text-lg font-bold">Esercizio Completato</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottoni Fissi Bottom all'interno dello scrollable */}
              <div className="pt-2 shrink-0 mt-auto w-full z-20">
                {!isExerciseDone ? (
                  <button 
                    onClick={() => completeActiveSet(currentExercise.id, activeSetIndex)}
                    className="w-full bg-white text-black font-bold text-base rounded-full py-3.5 shadow-[0_5px_20px_rgba(255,255,255,0.2)] hover:bg-neutral-200 transition-transform active:scale-[0.98]"
                  >
                    Completa Set
                  </button>
                ) : (
                  <button 
                    onClick={goNextExercise}
                    className="w-full bg-accentBlue text-white font-bold text-base rounded-full py-3.5 shadow-[0_5px_20px_rgba(10,132,255,0.4)] hover:opacity-90 transition-transform active:scale-[0.98]"
                  >
                    {currentExerciseIndex === totalExercises - 1 ? "Termina Sessione" : "Prossimo Esercizio"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
