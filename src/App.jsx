import React, { useState, useEffect } from 'react';
import { Settings, Plus, Play, History as HistoryIcon, Home, Activity, Dumbbell, Clock, Timer, Pause, RefreshCcw, CheckCircle2, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import EditorView from './views/EditorView';
import LiveView from './views/LiveView';
import HistoryView from './views/HistoryView';

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function App() {
  const [currentTab, setCurrentTab] = useState('editor'); // 'editor', 'active', 'history'
  const [isTabBarHidden, setIsTabBarHidden] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Library state per ospitare più schede e i loro giorni
  const [library, setLibrary] = useState(() => {
    const saved = localStorage.getItem('fittrack_ultra_library_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing library", e);
      }
    }
    return [
      {
        id: 'plan-1',
        name: 'Ipertrofia Master',
        status: 'active',
        days: Array.from({ length: 7 }, (_, i) => ({
           id: `day-${i}`,
           dayOfWeek: i,
           exercises: i === 1 ? [
             { id: 'ex-1', exerciseName: 'Panca Piana', sets: 4, reps: 8, weight: 80 }
           ] : []
        }))
      }
    ];
  });

  const [activeWorkout, setActiveWorkout] = useState(() => {
    const saved = localStorage.getItem('fittrack_ultra_active_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing active workout", e);
      }
    }
    return null;
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('fittrack_ultra_history_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing history", e);
      }
    }
    return [];
  });

  // Global elapsed timer
  useEffect(() => {
    let interval;
    if (activeWorkout && currentTab !== 'history') {
       interval = setInterval(() => {
         setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
       }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkout, currentTab]);

  useEffect(() => {
    localStorage.setItem('fittrack_ultra_library_v2', JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem('fittrack_ultra_active_v2', JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem('fittrack_ultra_active_v2');
    }
  }, [activeWorkout]);

  useEffect(() => {
    localStorage.setItem('fittrack_ultra_history_v2', JSON.stringify(history));
  }, [history]);

  // Global Timer Logic
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);
  const [isTimerFullscreen, setIsTimerFullscreen] = useState(false);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timerLeft > 0) {
      interval = setInterval(() => {
        setTimerLeft(prev => {
          const next = Math.max(0, prev - 0.01);
          if (next <= 0) {
            if (navigator.vibrate) navigator.vibrate([200, 50, 200]);
            setTimeout(() => {
              setIsTimerRunning(false);
              setIsTimerFullscreen(false);
            }, 800);
            return 0;
          }
          return next;
        });
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerLeft]);

  const startTimer = (seconds = 90) => {
    setTimerTotal(seconds);
    setTimerLeft(seconds);
    setIsTimerRunning(true);
    setIsTimerFullscreen(true);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerLeft(0);
    setTimerTotal(0);
    setIsTimerFullscreen(false);
  };

  const renderActiveSessionBanner = () => {
    if (activeWorkout && currentTab !== 'active') {
      if (!activeWorkout.exercises || !activeWorkout.exercises[currentExerciseIndex]) return null;
      const currentEx = activeWorkout.exercises[currentExerciseIndex];
      const activeSetIdx = currentEx?.sets.findIndex(s => !s.completed);
      const isTimerReady = isTimerRunning && timerLeft <= 0;

      return (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          onClick={() => setCurrentTab('active')}
          className={cn(
            "fixed bottom-[80px] left-4 right-4 z-40 p-4 rounded-3xl backdrop-blur-xl border flex items-center justify-between shadow-2xl transition-colors",
            isTimerReady ? "bg-accentOrange border-white/20 animate-pulse" : "bg-surface/90 border-white/10"
          )}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
             <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center shrink-0">
               <Activity size={20} className={isTimerReady ? "text-white" : "text-accentBlue"} />
             </div>
             <div className="flex flex-col truncate">
               <span className="text-[10px] font-black text-muted uppercase tracking-widest">{currentEx?.exerciseName}</span>
               <span className="text-xs font-bold text-white italic truncate">
                 SET {activeSetIdx !== -1 ? activeSetIdx + 1 : currentEx?.sets.length} / {currentEx?.sets.length}
               </span>
             </div>
          </div>
          
          <div className="flex items-center space-x-4 shrink-0">
             {isTimerRunning && (
               <div className="flex flex-col items-end">
                 <span className="text-xs font-black font-mono text-white tracking-tighter tabular-nums">{Math.ceil(timerLeft)}s</span>
                 <span className="text-[8px] font-black text-muted uppercase">Recupero</span>
               </div>
             )}
             <div className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest", isTimerReady ? "bg-white text-black shadow-lg" : "bg-accentBlue/20 text-accentBlue")}>
               {isTimerReady ? "VAI!" : "TORNA"}
             </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-accentBlue font-sans">

      <AnimatePresence mode="wait">
        {currentTab === 'editor' && (
          <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <EditorView 
              library={library} 
              setLibrary={setLibrary} 
              history={history}
              setCurrentTab={setCurrentTab}
            />
          </motion.div>
        )}
        {currentTab === 'active' && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <LiveView
              library={library}
              activeWorkout={activeWorkout}
              setActiveWorkout={setActiveWorkout}
              setHistory={setHistory}
              history={history}
              startTimer={startTimer}
              resetTimer={resetTimer}
              setCurrentTab={setCurrentTab}
              setIsTabBarHidden={setIsTabBarHidden}
              isTimerRunning={isTimerRunning}
              timerLeft={timerLeft}
              timerTotal={timerTotal}
              isTimerFullscreen={isTimerFullscreen}
              setIsTimerFullscreen={setIsTimerFullscreen}
              elapsed={elapsed}
              setElapsed={setElapsed}
              currentExerciseIndex={currentExerciseIndex}
              setCurrentExerciseIndex={setCurrentExerciseIndex}
            />
          </motion.div>
        )}
        {currentTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <HistoryView history={history} library={library} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Recupero Timer UI */}
      <AnimatePresence>
        {isTimerRunning && isTimerFullscreen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
            onClick={() => setIsTimerFullscreen(false)}
          >
            <div className="text-center">
              <AnimatePresence mode="wait">
                {timerLeft <= 0 ? (
                  <motion.div key="via" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-9xl font-black text-[#34C759] uppercase italic tracking-widest">VIA!</motion.div>
                ) : (
                  <motion.div key="count" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[180px] font-bold font-mono text-white tabular-nums tracking-tighter">
                    {Math.ceil(timerLeft)}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-8 text-muted text-sm font-bold uppercase tracking-widest italic">Recupero Muscolare</div>
              <div className="mt-4 text-xs text-muted/40 uppercase tracking-[0.3em]">Tocca per minimizzare</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {renderActiveSessionBanner()}

      {/* Bottom Navigation */}
      <AnimatePresence>
        {!isTabBarHidden && (
          <motion.nav
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-0 w-full bg-surface/80 backdrop-blur-xl border-t border-border/50 pb-safe pt-1 px-8 z-40 h-20"
          >
            <div className="flex justify-between items-center max-w-sm mx-auto h-full">
              <button onClick={() => setCurrentTab('editor')} className={cn("flex flex-col items-center p-2 transition-all active:scale-90", currentTab === 'editor' ? 'text-white' : 'text-muted')}>
                <Home size={22} className="mb-1" />
                <span className="text-[9px] font-black tracking-wider uppercase">Libreria</span>
              </button>
              
              <button
                onClick={() => setCurrentTab('active')}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg",
                  currentTab === 'active' 
                    ? "bg-accentBlue shadow-accentBlue/30 text-white" 
                    : "bg-white/5 text-muted border border-white/5"
                )}
              >
                <Dumbbell size={24} />
              </button>

              <button onClick={() => setCurrentTab('history')} className={cn("flex flex-col items-center p-2 transition-all active:scale-90", currentTab === 'history' ? 'text-white' : 'text-muted')}>
                <HistoryIcon size={22} className="mb-1" />
                <span className="text-[9px] font-black tracking-wider uppercase">Storico</span>
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
