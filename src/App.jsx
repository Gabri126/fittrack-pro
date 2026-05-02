import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit3, PlayCircle, History as HistoryIcon, Pause, Play, RotateCcw, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import EditorView from './views/EditorView';
import LiveView from './views/LiveView';
import HistoryView from './views/HistoryView';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const [workoutPlansLibrary, setWorkoutPlansLibrary] = useState(() => {
    const saved = localStorage.getItem('fittrack_ultra_library');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: `plan-${Date.now()}`,
        name: 'Scheda Master Iniziale',
        status: 'active',
        days: []
      }
    ];
  });
  
  const [activeWorkout, setActiveWorkout] = useState(() => JSON.parse(localStorage.getItem('fittrack_ultra_active') || 'null'));
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('fittrack_ultra_history') || '[]'));
  const [currentTab, setCurrentTab] = useState('editor');
  
  const [timerState, setTimerState] = useState({ active: false, time: 0, initialTime: 60 });
  const [isExpandedTimer, setIsExpandedTimer] = useState(false);
  const timerRef = useRef(null);

  // Sync localStorage
  useEffect(() => { localStorage.setItem('fittrack_ultra_library', JSON.stringify(workoutPlansLibrary)); }, [workoutPlansLibrary]);
  useEffect(() => { localStorage.setItem('fittrack_ultra_active', JSON.stringify(activeWorkout)); }, [activeWorkout]);
  useEffect(() => { localStorage.setItem('fittrack_ultra_history', JSON.stringify(history)); }, [history]);

  // Migrate old data
  useEffect(() => {
    const oldWeekly = localStorage.getItem('fittrack_ultra_weekly');
    if (oldWeekly && workoutPlansLibrary.length === 1 && workoutPlansLibrary[0].days.length === 0) {
      const parsed = JSON.parse(oldWeekly);
      const days = [];
      const DAYS_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
      
      Object.keys(parsed).forEach(idx => {
         if (parsed[idx] && parsed[idx].length > 0) {
            days.push({
               id: `day-${idx}-${Date.now()}`,
               name: DAYS_NAMES[parseInt(idx, 10)],
               exercises: parsed[idx]
            });
         }
      });
      
      if (days.length > 0) {
         setWorkoutPlansLibrary([
           {
             id: `plan-migrated-${Date.now()}`,
             name: 'Scheda Migrata',
             status: 'active',
             days: days
           }
         ]);
      }
    }
  }, []);

  // Timer Logic
  useEffect(() => {
    if (timerState.active && timerState.time > 0) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => {
          const newTime = prev.time - 1;
          if (newTime === 15) {
            setIsExpandedTimer(true); // Ritorna full screen a 15s
          }
          if (newTime === 0) {
            setIsExpandedTimer(false);
          }
          return { ...prev, time: newTime };
        });
      }, 1000);
    } else if (timerState.time === 0 && timerState.active) {
      setTimerState(prev => ({ ...prev, active: false }));
      setIsExpandedTimer(false);
    }
    return () => clearInterval(timerRef.current);
  }, [timerState.active, timerState.time]);

  const toggleTimer = () => {
    setTimerState(prev => {
      const isStarting = !prev.active;
      const targetTime = (!prev.active && prev.time === 0) ? prev.initialTime : prev.time;
      if (isStarting) setIsExpandedTimer(true);
      return { ...prev, active: isStarting, time: targetTime };
    });
  };

  const startTimerImplicit = () => {
    setTimerState(prev => {
      setIsExpandedTimer(true);
      return { ...prev, active: true, time: prev.initialTime };
    });
  };

  const resetTimer = (time = 60) => {
    setTimerState({ active: false, time, initialTime: time });
    setIsExpandedTimer(false);
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const isCriticalTime = timerState.time > 0 && timerState.time <= 3;
  const showFullScreen = isExpandedTimer || isCriticalTime;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden relative selection:bg-accentBlue selection:text-white">
      
      {/* Global Timer */}
      <AnimatePresence>
        {(timerState.active || timerState.time > 0) && (
          <motion.div 
            layout
            initial={showFullScreen ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: -50, scale: 0.9 }}
            animate={showFullScreen ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={showFullScreen ? { opacity: 0, scale: 1.05 } : { opacity: 0, y: -50, scale: 0.9 }}
            transition={showFullScreen ? { duration: 0.3, ease: "easeOut" } : { type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "z-[100] flex items-center justify-center cursor-pointer transition-colors duration-500",
              showFullScreen 
                ? cn("fixed inset-0 flex-col", isCriticalTime ? "bg-green-500 text-black" : "bg-black/95 backdrop-blur-2xl text-white")
                : "fixed top-6 right-6 bg-surface/90 backdrop-blur-xl rounded-full p-1 pr-4 pl-1 border border-border/50 text-white space-x-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            )}
            onClick={() => !isCriticalTime && setIsExpandedTimer(!isExpandedTimer)}
          >
            {showFullScreen && !isCriticalTime && (
              <div className="absolute top-8 right-8 bg-black/20 p-2 rounded-full hover:bg-black/40 transition-colors">
                <X size={24} />
              </div>
            )}

            {!showFullScreen && !isCriticalTime && (
              <button onClick={(e) => { e.stopPropagation(); toggleTimer(); }} className="w-10 h-10 shrink-0 rounded-full bg-accentBlue text-white flex items-center justify-center shadow-[0_0_15px_rgba(10,132,255,0.4)] transition-transform active:scale-95">
                {timerState.active ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
              </button>
            )}

            {showFullScreen ? (
              isCriticalTime ? (
                <motion.div key={timerState.time} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                  <span className="text-9xl font-bold tracking-tighter font-mono">{timerState.time}</span>
                  <span className="text-4xl font-black mt-4 tracking-widest uppercase">Via!</span>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center space-y-6">
                  <span className="text-2xl font-semibold tracking-wider uppercase opacity-70 text-accentBlue">Recupero</span>
                  <span className="text-8xl md:text-9xl font-bold tracking-tighter font-mono drop-shadow-[0_0_40px_rgba(10,132,255,0.4)]">{formatTime(timerState.time)}</span>
                  <p className="opacity-50 text-sm mt-8">Tocca per minimizzare</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center min-w-[3.5rem] px-2">
                <span className="text-[10px] font-medium text-accentBlue uppercase tracking-wider leading-none mb-1 w-full text-left">Rest</span>
                <span className={cn("font-bold font-mono leading-none tracking-tight text-base", (!isCriticalTime && timerState.time <= 10 && timerState.time > 0) ? "text-red-400 animate-pulse" : "")}>
                  {formatTime(timerState.time)}
                </span>
              </div>
            )}

            {!showFullScreen && !isCriticalTime && (
              <button onClick={(e) => { e.stopPropagation(); resetTimer(timerState.initialTime === 60 ? 90 : 60); }} className="text-muted hover:text-white p-2 transition-colors rounded-full hover:bg-white/10 shrink-0">
                <RotateCcw size={14} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-2xl mx-auto min-h-screen relative">
        <AnimatePresence mode="wait">
          {currentTab === 'editor' && (
             <motion.div key="editor" initial={{opacity:0, filter:"blur(10px)"}} animate={{opacity:1, filter:"blur(0px)"}} exit={{opacity:0, filter:"blur(10px)"}} transition={{duration:0.3, ease:"easeInOut"}}>
               <EditorView library={workoutPlansLibrary} setLibrary={setWorkoutPlansLibrary} />
             </motion.div>
          )}
          {currentTab === 'live' && (
             <motion.div key="live" initial={{opacity:0, filter:"blur(10px)"}} animate={{opacity:1, filter:"blur(0px)"}} exit={{opacity:0, filter:"blur(10px)"}} transition={{duration:0.3, ease:"easeInOut"}}>
               <LiveView library={workoutPlansLibrary} activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} setHistory={setHistory} history={history} resetTimer={resetTimer} startTimer={startTimerImplicit} setCurrentTab={setCurrentTab} />
             </motion.div>
          )}
          {currentTab === 'history' && (
             <motion.div key="history" initial={{opacity:0, filter:"blur(10px)"}} animate={{opacity:1, filter:"blur(0px)"}} exit={{opacity:0, filter:"blur(10px)"}} transition={{duration:0.3, ease:"easeInOut"}}>
               <HistoryView history={history} />
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6 pt-10 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
        <div className="flex items-center space-x-1 bg-surface/80 backdrop-blur-xl border border-border/50 rounded-[32px] p-2 shadow-[0_0_40px_rgba(0,0,0,0.8)] pointer-events-auto">
           <TabButton active={currentTab === 'editor'} onClick={() => setCurrentTab('editor')} icon={<Edit3 size={20} />} label="Editor" />
           <TabButton active={currentTab === 'live'} onClick={() => setCurrentTab('live')} icon={<PlayCircle size={20} />} label="Live" />
           <TabButton active={currentTab === 'history'} onClick={() => setCurrentTab('history')} icon={<HistoryIcon size={20} />} label="Storico" />
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={cn("relative flex items-center justify-center px-6 py-3.5 rounded-[24px] transition-all duration-300", active ? "bg-white text-black shadow-sm" : "text-muted hover:text-white hover:bg-white/5")}>
       <div className="flex items-center space-x-2">
         {icon}
         {active && <span className="text-sm font-bold tracking-tight">{label}</span>}
       </div>
    </button>
  );
}

export default App;
