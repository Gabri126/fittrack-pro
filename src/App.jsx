import React, { useState, useEffect } from 'react';
import { Settings, Plus, Play, History as HistoryIcon, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import EditorView from './views/EditorView';
import LiveView from './views/LiveView';
import HistoryView from './views/HistoryView';

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function App() {
  const [currentTab, setCurrentTab] = useState('editor'); // 'editor', 'active', 'history'
  const [isTabBarHidden, setIsTabBarHidden] = useState(false);

  // Library state per ospitare più schede e i loro giorni
  const [library, setLibrary] = useState(() => {
    const saved = localStorage.getItem('fittrack_ultra_library');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing library", e);
      }
    }
    // Dati di default
    return [
      {
        id: 'plan-1',
        name: 'Ipertrofia Master',
        status: 'active', // 'active' o 'archived'
        days: [
          {
            id: 'day-1',
            name: 'Giorno 1',
            exercises: [
              { id: 'ex-1', exerciseName: 'Panca Piana', sets: 4, reps: 8, weight: 80 },
              { id: 'ex-2', exerciseName: 'Spinte Manubri Panca Inclinata', sets: 3, reps: 10, weight: 30 }
            ]
          }
        ]
      }
    ];
  });

  const [activeWorkout, setActiveWorkout] = useState(() => {
    const saved = localStorage.getItem('fittrack_ultra_active');
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
    const saved = localStorage.getItem('fittrack_ultra_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing history", e);
      }
    }
    return [];
  });

  // Salva stato al cambiamento
  useEffect(() => {
    localStorage.setItem('fittrack_ultra_library', JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem('fittrack_ultra_active', JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem('fittrack_ultra_active');
    }
  }, [activeWorkout]);

  useEffect(() => {
    localStorage.setItem('fittrack_ultra_history', JSON.stringify(history));
  }, [history]);

  // Global Timer Logic
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0); // 90 secondi default
  const [isTimerFullscreen, setIsTimerFullscreen] = useState(false);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timerLeft > 0) {
      interval = setInterval(() => {
        setTimerLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setIsTimerFullscreen(false);
            return 0;
          }
          if (prev === 16) {
            setIsTimerFullscreen(true);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerLeft]);

  const startTimer = (seconds = 90) => {
    setTimerLeft(seconds);
    setIsTimerRunning(true);
    setIsTimerFullscreen(true);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerLeft(0);
    setIsTimerFullscreen(false);
  };

  const renderActiveSessionBanner = () => {
    if (activeWorkout && currentTab !== 'active') {
      return (
        <div
          className="fixed top-0 left-0 right-0 z-50 bg-accentBlue/90 backdrop-blur-md border-b border-white/10 text-white px-4 py-2.5 flex justify-between items-center shadow-lg text-xs font-bold animate-in slide-in-from-top cursor-pointer"
          onClick={() => setCurrentTab('active')}
        >
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <span className="uppercase tracking-widest">Sessione In Pausa</span>
          </div>
          <span className="uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full">Riprendi &rarr;</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-accentBlue font-sans">

      {renderActiveSessionBanner()}

      <AnimatePresence mode="wait">
        {currentTab === 'editor' && (
          <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <EditorView library={library} setLibrary={setLibrary} />
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
            />
          </motion.div>
        )}
        {currentTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <HistoryView history={history} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Recupero Timer UI */}
      <AnimatePresence>
        {isTimerRunning && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={
              isTimerFullscreen
                ? { opacity: 1, y: 0, scale: 1, inset: 0, borderRadius: 0 }
                : { opacity: 1, y: 16, x: -16, scale: 1, top: 16, right: 16, bottom: 'auto', left: 'auto', width: 'auto', height: 'auto', borderRadius: 9999 }
            }
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "fixed z-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden",
              isTimerFullscreen ? "inset-0 bg-black/95 backdrop-blur-xl" : "top-4 right-4 bg-surface/90 backdrop-blur-md border border-border/50 shadow-2xl px-4 py-2 rounded-full flex-row"
            )}
            onClick={() => setIsTimerFullscreen(!isTimerFullscreen)}
          >
            {isTimerFullscreen ? (
              <div className="text-center w-full px-6 transition-colors duration-500 flex flex-col items-center justify-center h-full">
                <div className={cn("text-[180px] leading-none font-bold font-mono tracking-tighter tabular-nums", timerLeft <= 3 ? "text-[#34C759]" : "text-white")}>
                  {timerLeft}
                </div>
                {timerLeft <= 3 && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-5xl font-black text-[#34C759] mt-4 uppercase tracking-widest">
                    Via!
                  </motion.div>
                )}
                <div className="absolute bottom-12 text-muted text-sm font-bold uppercase tracking-widest">
                  Tap per minimizzare
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-accentOrange animate-pulse" />
                <span className="font-bold font-mono text-white tabular-nums">{timerLeft}s</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <AnimatePresence>
        {!isTabBarHidden && (
          <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 w-full bg-surface/80 backdrop-blur-xl border-t border-border/50 pb-6 pt-2 px-6 z-40"
          >
            <div className="flex justify-between items-center max-w-sm mx-auto relative">
              <button onClick={() => setCurrentTab('editor')} className={cn("flex flex-col items-center p-2 transition-colors", currentTab === 'editor' ? 'text-white' : 'text-muted hover:text-white/70')}>
                <Home size={24} className="mb-1" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Libreria</span>
              </button>

              <button
                onClick={() => setCurrentTab('active')}
                className="absolute left-1/2 -translate-x-1/2 -top-6 w-16 h-16 bg-accentBlue rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.4)] text-white hover:scale-105 transition-transform active:scale-95"
              >
                <Play size={28} className="ml-1" />
              </button>

              <button onClick={() => setCurrentTab('history')} className={cn("flex flex-col items-center p-2 transition-colors", currentTab === 'history' ? 'text-white' : 'text-muted hover:text-white/70')}>
                <HistoryIcon size={24} className="mb-1" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Storico</span>
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

    </div>
  );
}

