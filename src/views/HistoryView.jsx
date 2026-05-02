import React from 'react';
import { Trophy, Clock, CheckCircle2, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../App';

export default function HistoryView({ history }) {
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    return `${m} min`;
  };

  const formatDate = (ts) => {
    return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
  };

  const chartData = [...history].slice(0, 10).reverse();
  const maxVol = Math.max(...chartData.map(h => h.volume), 1);

  const shareResults = async (session) => {
    let text = `🏋️ Allenamento Completato!\n`;
    text += `Volume Totale: ${session.volume.toLocaleString()} kg\n`;
    text += `Esercizi:\n`;
    
    session.exercises.forEach(ex => {
      const completedSets = ex.sets.filter(s => s.completed).length;
      if (completedSets > 0) {
        text += `- ${completedSets}x ${ex.exerciseName}\n`;
      }
    });
    
    text += `\nCreato con FitTrack Ultra 🚀`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Il mio allenamento su FitTrack Ultra',
          text: text,
        });
      } catch (err) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Risultati copiati negli appunti!');
    }
  };

  return (
    <div className="p-6 pb-32 space-y-8">
      <header className="pt-8 mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
          Storico
        </h1>
        <p className="text-muted mt-2">I tuoi progressi nel tempo</p>
      </header>

      {history.length > 0 && (
        <section className="bg-surface/40 border border-border/50 rounded-[32px] p-6 shadow-soft backdrop-blur-md">
          <h3 className="text-sm font-medium text-muted mb-6 flex items-center"><Trophy size={16} className="mr-2 text-accentOrange"/> Trend Volume Totale</h3>
          <div className="h-32 flex items-end space-x-2 w-full">
            {chartData.map((session) => {
              const heightPct = Math.max((session.volume / maxVol) * 100, 5);
              return (
                <div key={session.id} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="absolute -top-8 bg-black border border-border text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono shadow-soft">
                    {session.volume} kg
                  </div>
                  <div 
                    className="w-full bg-gradient-to-t from-accentBlue/20 to-accentBlue rounded-t-md transition-all duration-500 shadow-[0_0_10px_rgba(10,132,255,0.2)]" 
                    style={{ height: `${heightPct}%` }}
                  ></div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <motion.section layout className="space-y-4">
        <AnimatePresence>
          {history.length === 0 ? (
            <motion.div layout className="bg-surface/30 border border-border border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center text-center space-y-4">
              <Trophy className="text-muted/50" size={48} />
              <p className="text-muted">Nessun allenamento registrato.</p>
            </motion.div>
          ) : (
            history.map(session => (
              <motion.div layout key={session.id} className="bg-surface border border-border/50 rounded-3xl p-5 flex flex-col space-y-4 shadow-soft group hover:border-border transition-colors relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-border/50 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-border shadow-inner">
                      <CheckCircle2 className="text-green-500" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{formatDate(session.date)}</h4>
                      <span className="text-xs text-muted flex items-center mt-1"><Clock size={12} className="mr-1 opacity-70"/> {formatTime(session.duration)}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="block text-2xl font-bold tracking-tighter text-accentBlue">{session.volume.toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Kg Vol.</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {session.exercises.map((ex, i) => {
                    const completedSets = ex.sets.filter(s => s.completed).length;
                    if (completedSets === 0) return null;
                    return (
                      <span key={i} className="text-xs bg-black border border-border px-3 py-1.5 rounded-full text-muted flex items-center">
                        <span className="font-semibold text-white mr-1.5">{completedSets}x</span> {ex.exerciseName}
                      </span>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => shareResults(session)}
                    className="w-full mt-2 bg-black/40 border border-border/50 text-white text-xs font-semibold rounded-2xl py-2.5 hover:bg-black transition-colors flex items-center justify-center space-x-2"
                  >
                    <Share size={14} className="text-accentOrange" />
                    <span>Condividi Risultati</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
