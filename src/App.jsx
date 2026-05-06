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
    const saved = localStorage.getItem('fittrack_ultra_library_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing library", e);
      }
    }
    // Dati di default V2 (7 slots)
    return [
      {
        id: 'plan-1',
        name: 'Ipertrofia Master',
        status: 'active',
        days: Array.from({ length: 7 }, (_, i) => ({
           id: `day-${i}`,
           dayOfWeek: i, // 0 = Sun, 1 = Mon, ..., 6 = Sat
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

  // Salva stato al cambiamento
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
          
          const currentSec = Math.ceil(prev);
          const nextSec = Math.ceil(next);
          if (nextSec < currentSec && nextSec <= 3 && nextSec >= 1) {
            if (navigator.vibrate) navigator.vibrate(10);
          }
          
          if (nextSec === 15 && currentSec === 16) {
            setIsTimerFullscreen(true);
          }
          return next;
        });
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

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
        {isTimerRunning && (
          <>


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
                isTimerFullscreen ? "inset-0 bg-black/95 backdrop-blur-xl" : "top-4 right-4 bg-surface/90 backdrop-blur-md border border-border/50 shadow-2xl p-1 rounded-full"
              )}
              onClick={() => setIsTimerFullscreen(!isTimerFullscreen)}
            >
              {isTimerFullscreen ? (
                <div className="text-center w-full px-6 flex flex-col items-center justify-center h-full">
                  <AnimatePresence mode="wait">
                    {timerLeft === 0 ? (
                      <motion.div
                        key="via"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-[120px] leading-none font-black text-[#34C759] uppercase tracking-widest drop-shadow-[0_0_40px_rgba(52,199,89,0.5)]"
                      >
                        VIA!
                      </motion.div>
                    ) : Math.ceil(timerLeft) <= 3 ? (
                      <motion.div
                        key={`count-${Math.ceil(timerLeft)}`}
                        initial={{ opacity: 0, scale: 1.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3 }}
                        className="text-[200px] leading-none font-bold font-mono text-white tabular-nums tracking-tighter"
                      >
                        {Math.ceil(timerLeft)}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="timer-normal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[180px] leading-none font-bold font-mono text-white tabular-nums tracking-tighter"
                      >
                        {Math.ceil(timerLeft)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {timerLeft > 3 && (
                    <div className="absolute bottom-12 text-muted text-sm font-bold uppercase tracking-widest">
                      Tap per minimizzare
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {/* SVG Circular Progress Ring with seconds centered */}
                  <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#333" strokeWidth="3" />
                    <circle
                      cx="22" cy="22" r="18" fill="none"
                      stroke="#FF9F0A"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 18}
                      strokeDashoffset={2 * Math.PI * 18 * (1 - (timerTotal > 0 ? timerLeft / timerTotal : 0))}
                      style={{ transition: 'stroke-dashoffset 0.01s linear' }}
                    />
                  </svg>
                  <span className="absolute font-bold font-mono text-white tabular-nums text-xs">{Math.ceil(timerLeft)}</span>
                </div>
              )}
            </motion.div>
          </>
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

