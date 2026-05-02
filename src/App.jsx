import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit3, PlayCircle, History as HistoryIcon, Pause, Play, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import EditorView from './views/EditorView';
import LiveView from './views/LiveView';
import HistoryView from './views/HistoryView';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const [weeklyData, setWeeklyData] = useState(() => JSON.parse(localStorage.getItem('fittrack_ultra_weekly') || '{}'));
  const [activeWorkout, setActiveWorkout] = useState(() => JSON.parse(localStorage.getItem('fittrack_ultra_active') || 'null'));
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('fittrack_ultra_history') || '[]'));
  const [currentTab, setCurrentTab] = useState('editor');
  
  const [timerState, setTimerState] = useState({ active: false, time: 0, initialTime: 60 });
  const timerRef = useRef(null);

  // Sync localStorage
  useEffect(() => { localStorage.setItem('fittrack_ultra_weekly', JSON.stringify(weeklyData)); }, [weeklyData]);
  useEffect(() => { localStorage.setItem('fittrack_ultra_active', JSON.stringify(activeWorkout)); }, [activeWorkout]);
  useEffect(() => { localStorage.setItem('fittrack_ultra_history', JSON.stringify(history)); }, [history]);

  // Migrate old data if present and new is empty
  useEffect(() => {
    const oldData = localStorage.getItem('fittrack_ultra_data');
    if (oldData && Object.keys(weeklyData).length === 0) {
       setWeeklyData(JSON.parse(oldData));
    }
  }, []);

  // Timer Logic
  useEffect(() => {
    if (timerState.active && timerState.time > 0) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => ({ ...prev, time: prev.time - 1 }));
      }, 1000);
    } else if (timerState.time === 0 && timerState.active) {
      setTimerState(prev => ({ ...prev, active: false }));
    }
    return () => clearInterval(timerRef.current);
  }, [timerState.active, timerState.time]);

  const toggleTimer = () => {
    setTimerState(prev => ({ ...prev, active: !prev.active, time: (!prev.active && prev.time === 0) ? prev.initialTime : prev.time }));
  };
  const resetTimer = (time = 60) => setTimerState({ active: false, time, initialTime: time });
  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden relative selection:bg-accentBlue selection:text-white">
      
      {/* Global Timer Float if active or has time */}
      <AnimatePresence>
        {(timerState.active || timerState.time > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-6 right-6 z-50 flex items-center space-x-2 bg-surface/90 backdrop-blur-xl rounded-full p-1 pr-4 pl-1 border border-border/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          >
             <button onClick={toggleTimer} className="w-10 h-10 rounded-full bg-accentBlue text-white flex items-center justify-center shadow-[0_0_15px_rgba(10,132,255,0.4)] transition-transform active:scale-95">
              {timerState.active ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
            </button>
            <div className="flex flex-col items-start min-w-[3.5rem]">
              <span className="text-[10px] font-medium text-accentBlue uppercase tracking-wider leading-none mb-1">Rest</span>
              <span className={cn("text-base font-bold font-mono leading-none tracking-tight", timerState.time <= 10 && timerState.time > 0 ? "text-red-400 animate-pulse" : "")}>{formatTime(timerState.time)}</span>
            </div>
            <button onClick={() => resetTimer(timerState.initialTime === 60 ? 90 : 60)} className="text-muted hover:text-white p-2 transition-colors rounded-full hover:bg-white/10">
              <RotateCcw size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-2xl mx-auto min-h-screen relative">
        <AnimatePresence mode="wait">
          {currentTab === 'editor' && (
             <motion.div key="editor" initial={{opacity:0, filter:"blur(10px)"}} animate={{opacity:1, filter:"blur(0px)"}} exit={{opacity:0, filter:"blur(10px)"}} transition={{duration:0.3, ease:"easeInOut"}}>
               <EditorView weeklyData={weeklyData} setWeeklyData={setWeeklyData} />
             </motion.div>
          )}
          {currentTab === 'live' && (
             <motion.div key="live" initial={{opacity:0, filter:"blur(10px)"}} animate={{opacity:1, filter:"blur(0px)"}} exit={{opacity:0, filter:"blur(10px)"}} transition={{duration:0.3, ease:"easeInOut"}}>
               <LiveView weeklyData={weeklyData} activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} setHistory={setHistory} resetTimer={resetTimer} startTimer={() => setTimerState(prev => ({...prev, active: true, time: prev.initialTime}))} setCurrentTab={setCurrentTab} />
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
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pt-10 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
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
