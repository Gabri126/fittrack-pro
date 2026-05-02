import React, { useState, useRef } from 'react';
import { Plus, BrainCircuit, ScanLine, Dumbbell, Calendar, Trash2, Activity, Copy, Archive, CheckCircle2, ChevronRight, ArrowLeft, Image as ImageIcon, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../App';

const initialForm = { exerciseName: '', sets: '', reps: '', weight: '' };

export default function EditorView({ library, setLibrary }) {
  const [route, setRoute] = useState('library'); 
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState(null);

  const [inputMode, setInputMode] = useState('manual');
  const [formData, setFormData] = useState(initialForm);
  const [aiText, setAiText] = useState('');
  
  // Vision states
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // -- HELPERS --
  const activePlan = library.find(p => p.id === selectedPlanId);
  const activeDay = activePlan?.days.find(d => d.id === selectedDayId);
  const currentActivePlan = library.find(p => p.status === 'active');
  
  // -- ACTIVITY RINGS (Global) --
  const TARGET_VOL = 15000;
  const TARGET_DAYS = 4;
  
  let totalWeeklyVolume = 0;
  let plannedDaysCount = 0;
  
  if (currentActivePlan) {
    plannedDaysCount = currentActivePlan.days.length;
    currentActivePlan.days.forEach(day => {
      day.exercises.forEach(ex => {
        totalWeeklyVolume += (ex.sets * ex.reps * ex.weight);
      });
    });
  }

  const volPct = Math.min(totalWeeklyVolume / TARGET_VOL, 1);
  const daysPct = Math.min(plannedDaysCount / TARGET_DAYS, 1);

  const size = 80;
  const strokeWidth = 8;
  const center = size / 2;
  const r1 = center - strokeWidth;
  const r2 = r1 - strokeWidth - 2;
  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;

  // -- LIBRARY ACTIONS --
  const createPlan = () => {
    const name = prompt("Nome della nuova scheda (es. Massa Estiva):");
    if (!name) return;
    const newPlan = { id: `plan-${Date.now()}`, name, status: library.length === 0 ? 'active' : 'archived', days: [] };
    setLibrary(prev => [...prev, newPlan]);
  };

  const duplicatePlan = (plan, e) => {
    e.stopPropagation();
    const newPlan = { ...plan, id: `plan-${Date.now()}`, name: `${plan.name} (Copia)`, status: 'archived' };
    newPlan.days = plan.days.map(d => ({
      ...d, id: `day-${Date.now()}-${Math.random()}`, exercises: d.exercises.map(ex => ({...ex, id: `w-${Date.now()}-${Math.random()}`}))
    }));
    setLibrary(prev => [...prev, newPlan]);
  };

  const togglePlanStatus = (id, e) => {
    e.stopPropagation();
    setLibrary(prev => prev.map(p => {
      if (p.id === id) return { ...p, status: p.status === 'active' ? 'archived' : 'active' };
      return { ...p, status: 'archived' };
    }));
  };

  const deletePlan = (id, e) => {
    e.stopPropagation();
    if(confirm("Sei sicuro di voler eliminare questa scheda?")) {
      setLibrary(prev => prev.filter(p => p.id !== id));
    }
  };

  // -- PLAN DETAILS ACTIONS --
  const addDay = () => {
    const name = prompt("Nome del giorno (es. Giorno 1 - Petto):");
    if (!name) return;
    setLibrary(prev => prev.map(p => {
      if (p.id === selectedPlanId) {
        return { ...p, days: [...p.days, { id: `day-${Date.now()}`, name, exercises: [] }] };
      }
      return p;
    }));
  };

  const deleteDay = (dayId, e) => {
    e.stopPropagation();
    if(confirm("Sei sicuro di voler eliminare questo giorno?")) {
      setLibrary(prev => prev.map(p => {
        if (p.id === selectedPlanId) {
          return { ...p, days: p.days.filter(d => d.id !== dayId) };
        }
        return p;
      }));
    }
  };

  // -- DAY EDIT ACTIONS --
  const addWorkout = (workout) => {
    setLibrary(prev => prev.map(p => {
      if (p.id !== selectedPlanId) return p;
      const newDays = p.days.map(d => {
        if (d.id !== selectedDayId) return d;
        return { ...d, exercises: [...d.exercises, { id: `w-${Date.now()}-${Math.random()}`, ...workout }] };
      });
      return { ...p, days: newDays };
    }));
  };

  const removeWorkout = (workoutId) => {
    setLibrary(prev => prev.map(p => {
      if (p.id !== selectedPlanId) return p;
      const newDays = p.days.map(d => {
        if (d.id !== selectedDayId) return d;
        return { ...d, exercises: d.exercises.filter(w => w.id !== workoutId) };
      });
      return { ...p, days: newDays };
    }));
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const { exerciseName, sets, reps, weight } = formData;
    if (!exerciseName.trim() || !sets || !reps || !weight) return;
    addWorkout({ exerciseName: exerciseName.trim(), sets: parseInt(sets, 10), reps: parseInt(reps, 10), weight: parseFloat(weight) });
    setFormData(initialForm);
  };

  const handleAiSubmit = () => {
    if (!aiText.trim()) return;
    const lines = aiText.split('\n');
    lines.forEach(line => {
      if(!line.trim()) return;
      let exName = "";
      let sets = 0, reps = 0, weight = 0;
      
      const rx1 = /(?:^|\s)(\d+)\s*(?:x|set\s+da)\s*(\d+)(?:\s+(?:di|con))?/i;
      const m1 = line.match(rx1);
      
      if (m1) {
        sets = parseInt(m1[1], 10);
        reps = parseInt(m1[2], 10);
        let remainder = line.replace(m1[0], ' ');
        
        const rxKg = /(\d+(?:\.\d+)?)\s*(?:kg|chili|chilo)/i;
        const mKg = remainder.match(rxKg);
        if (mKg) {
          weight = parseFloat(mKg[1]);
          remainder = remainder.replace(mKg[0], ' ');
        }
        
        exName = remainder.replace(/^[-\s]+|[-\s]+$/g, '').trim();
        if (exName) {
           addWorkout({ exerciseName: exName, sets, reps, weight });
        }
      } else {
        addWorkout({ exerciseName: line.trim(), sets: 3, reps: 10, weight: 0 });
      }
    });
    setAiText('');
  };

  const handleVisionSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewImage(ev.target.result);
        setIsScanning(true);
        setScanMessage('AI Analyzing image...');
        
        setTimeout(() => {
          setIsScanning(false);
          setPreviewImage(null);
          addWorkout({ exerciseName: "Esercizio Scansionato", sets: 3, reps: 12, weight: 40 });
        }, 3000);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // --- RENDER VIEWS ---

  if (route === 'library') {
    return (
      <div className="p-6 space-y-8 pb-32">
        <header className="pt-8 mb-6">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent mb-6">
            Workout Library
          </h1>
          
          <div className="bg-surface/50 border border-border/50 rounded-4xl p-5 mb-8 shadow-soft flex items-center justify-between backdrop-blur-md">
            <div className="space-y-1">
              <h3 className="font-semibold text-white">Scheda Attiva</h3>
              <p className="text-muted text-xs mb-2">{currentActivePlan ? currentActivePlan.name : 'Nessuna scheda attiva'}</p>
              <div className="flex flex-col space-y-1 text-xs font-medium">
                <span className="text-accentBlue flex items-center"><div className="w-2 h-2 rounded-full bg-accentBlue mr-1"></div> {totalWeeklyVolume.toLocaleString()} / {TARGET_VOL.toLocaleString()} kg</span>
                <span className="text-accentOrange flex items-center"><div className="w-2 h-2 rounded-full bg-accentOrange mr-1"></div> {plannedDaysCount} / {TARGET_DAYS} gg</span>
              </div>
            </div>
            
            <div className="relative" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
                <circle cx={center} cy={center} r={r1} fill="transparent" stroke="rgba(10,132,255,0.15)" strokeWidth={strokeWidth} />
                <circle cx={center} cy={center} r={r2} fill="transparent" stroke="rgba(255,159,10,0.15)" strokeWidth={strokeWidth} />
                
                <motion.circle 
                  cx={center} cy={center} r={r1} fill="transparent" stroke="#0A84FF" strokeWidth={strokeWidth} strokeLinecap="round"
                  strokeDasharray={c1}
                  initial={{ strokeDashoffset: c1 }}
                  animate={{ strokeDashoffset: c1 - (c1 * volPct) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <motion.circle 
                  cx={center} cy={center} r={r2} fill="transparent" stroke="#FF9F0A" strokeWidth={strokeWidth} strokeLinecap="round"
                  strokeDasharray={c2}
                  initial={{ strokeDashoffset: c2 }}
                  animate={{ strokeDashoffset: c2 - (c2 * daysPct) }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                />
              </svg>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <button onClick={createPlan} className="w-full bg-surface/30 border-2 border-border border-dashed text-white font-bold rounded-[32px] py-6 hover:bg-surface/50 transition-colors flex flex-col items-center justify-center space-y-2 active:scale-[0.98]">
            <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center"><Plus size={24} /></div>
            <span>Crea Nuova Scheda Master</span>
          </button>

          <AnimatePresence>
            {library.map(plan => (
              <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={plan.id} 
                onClick={() => { setSelectedPlanId(plan.id); setRoute('plan-details'); }}
                className={cn("bg-surface border rounded-3xl p-5 flex flex-col space-y-4 shadow-soft cursor-pointer group hover:border-border/80 transition-all", plan.status === 'active' ? "border-accentBlue/50 bg-accentBlue/5" : "border-border/50")}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                    <div className="flex space-x-2">
                      <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full", plan.status === 'active' ? "bg-accentBlue text-white" : "bg-black text-muted")}>
                        {plan.status === 'active' ? 'Attiva' : 'Archiviata'}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black text-muted">
                        {plan.days.length} Giorni
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="text-muted group-hover:text-white transition-colors" />
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-border/50">
                   <button onClick={(e) => togglePlanStatus(plan.id, e)} className={cn("flex-1 py-2 rounded-2xl text-xs font-semibold flex items-center justify-center space-x-1", plan.status === 'active' ? "text-accentBlue hover:bg-accentBlue/10" : "text-muted hover:text-white hover:bg-white/5")}>
                     <CheckCircle2 size={14} /> <span>{plan.status === 'active' ? 'Disattiva' : 'Attiva'}</span>
                   </button>
                   <button onClick={(e) => duplicatePlan(plan, e)} className="flex-1 py-2 rounded-2xl text-xs font-semibold text-muted hover:text-white hover:bg-white/5 flex items-center justify-center space-x-1">
                     <Copy size={14} /> <span>Duplica</span>
                   </button>
                   <button onClick={(e) => deletePlan(plan.id, e)} className="p-2 rounded-2xl text-muted hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center">
                     <Trash2 size={16} />
                   </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>
      </div>
    );
  }

  if (route === 'plan-details') {
    return (
      <div className="p-6 space-y-8 pb-32">
        <header className="pt-8 mb-6 flex items-center space-x-4">
          <button onClick={() => setRoute('library')} className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{activePlan.name}</h1>
            <p className="text-muted text-sm">Gestisci i giorni di questa scheda</p>
          </div>
        </header>

        <section className="space-y-4">
          <AnimatePresence>
            {activePlan.days.map((day, idx) => (
              <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={day.id} 
                onClick={() => { setSelectedDayId(day.id); setRoute('day-edit'); }}
                className="bg-surface border border-border/50 rounded-3xl p-5 flex justify-between items-center group cursor-pointer hover:border-border transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-border font-bold font-mono">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{day.name}</h3>
                    <p className="text-sm text-muted">{day.exercises.length} Esercizi</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={(e) => deleteDay(day.id, e)} className="w-10 h-10 flex items-center justify-center bg-black/50 text-muted rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight className="text-muted group-hover:text-white transition-colors" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button onClick={addDay} className="w-full bg-surface/30 border border-border border-dashed text-white font-semibold rounded-3xl py-4 hover:bg-surface/50 transition-colors flex items-center justify-center space-x-2 active:scale-[0.98]">
            <Plus size={18} />
            <span>Aggiungi Giorno</span>
          </button>
        </section>
      </div>
    );
  }

  // route === 'day-edit'
  const totalDayVolume = activeDay.exercises.reduce((acc, curr) => acc + (curr.sets * curr.reps * curr.weight), 0);

  return (
    <div className="p-4 md:p-6 pb-32 space-y-6">
      <header className="sticky top-0 z-30 pt-6 pb-4 bg-background/90 backdrop-blur-md border-b border-border/50 flex items-center space-x-4">
        <button onClick={() => setRoute('plan-details')} className="w-10 h-10 shrink-0 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate text-accentBlue">{activePlan.name}</h1>
          <p className="text-xl font-bold truncate">{activeDay.name}</p>
        </div>
      </header>

      {/* DASHBOARD */}
      <section className="bg-gradient-to-br from-surface to-[#0A0A0A] border border-border/50 rounded-[32px] p-6 shadow-soft flex justify-between items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-accentBlue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div>
            <p className="text-sm text-muted font-medium mb-1">Volume Giorno</p>
            <div className="flex items-baseline space-x-1">
              <span className="text-4xl font-bold tracking-tighter">{totalDayVolume.toLocaleString()}</span>
              <span className="text-muted font-medium text-sm">kg</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-accentBlue/10 flex items-center justify-center border border-accentBlue/20 shadow-[0_0_20px_rgba(10,132,255,0.15)]">
            <Dumbbell className="text-accentBlue" size={24} />
          </div>
      </section>

      {/* INPUT */}
      <section className="bg-surface/50 border border-border/50 rounded-[32px] p-2 backdrop-blur-md shadow-soft">
        <div className="flex space-x-1 mb-4 p-1 bg-black/40 rounded-full">
            {['manual', 'ai', 'vision'].map((mode) => (
              <button key={mode} onClick={() => setInputMode(mode)} className={cn("flex-1 py-2.5 rounded-full text-xs font-semibold capitalize transition-all duration-300 flex justify-center items-center space-x-2", inputMode === mode ? "bg-white text-black shadow-sm" : "text-muted hover:text-white")}>
                {mode === 'manual' && <Plus size={14} />}
                {mode === 'ai' && <BrainCircuit size={14} />}
                {mode === 'vision' && <ScanLine size={14} />}
                <span>{mode}</span>
              </button>
            ))}
        </div>
        <div className="p-4">
           {inputMode === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <input type="text" placeholder="Esercizio (es. Panca Piana)" value={formData.exerciseName} onChange={(e) => setFormData({...formData, exerciseName: e.target.value})} className="w-full bg-black/50 border border-border rounded-3xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accentBlue/50 transition-all placeholder:text-muted/60" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative"><span className="absolute left-4 top-4 text-xs text-muted font-medium">Set</span><input type="number" value={formData.sets} onChange={(e) => setFormData({...formData, sets: e.target.value})} className="w-full bg-black/50 border border-border rounded-3xl pl-12 pr-3 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accentBlue/50 transition-all font-mono" min="1" /></div>
                  <div className="relative"><span className="absolute left-4 top-4 text-xs text-muted font-medium">Rep</span><input type="number" value={formData.reps} onChange={(e) => setFormData({...formData, reps: e.target.value})} className="w-full bg-black/50 border border-border rounded-3xl pl-12 pr-3 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accentBlue/50 transition-all font-mono" min="1" /></div>
                  <div className="relative"><span className="absolute left-4 top-4 text-xs text-muted font-medium">Kg</span><input type="number" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="w-full bg-black/50 border border-border rounded-3xl pl-10 pr-3 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accentBlue/50 transition-all font-mono" min="0" step="0.5" /></div>
                </div>
                <button type="submit" className="w-full bg-white text-black font-semibold rounded-3xl py-4 hover:bg-neutral-200 transition-colors flex items-center justify-center space-x-2 active:scale-[0.98]"><Plus size={18} /><span>Aggiungi</span></button>
              </form>
            )}
            {inputMode === 'ai' && (
              <div className="space-y-4">
                <textarea value={aiText} onChange={(e) => setAiText(e.target.value)} placeholder="Incolla qui la tua scheda... (es. Panca piana 3x10 60kg, oppure 3 set da 12 di Squat)" className="w-full bg-black/50 border border-border rounded-3xl px-5 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-accentOrange/50 transition-all placeholder:text-muted/60 min-h-[140px] resize-none leading-relaxed" />
                <button onClick={handleAiSubmit} className="w-full bg-gradient-to-r from-accentOrange to-orange-500 text-white font-semibold rounded-3xl py-4 hover:opacity-90 flex items-center justify-center space-x-2 active:scale-[0.98]"><BrainCircuit size={18} /><span>Genera Blocchi</span></button>
              </div>
            )}
            {inputMode === 'vision' && (
              <div className="space-y-4">
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleVisionSelect} />
                <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleVisionSelect} />

                <div className="h-48 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center bg-black/20 text-muted overflow-hidden relative">
                  {previewImage ? (
                    <>
                      <img src={previewImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                      {isScanning && (
                        <>
                          <motion.div 
                            className="absolute left-0 right-0 h-1 bg-accentBlue shadow-[0_0_20px_rgba(10,132,255,1)]"
                            animate={{ top: ["0%", "100%", "0%"] }}
                            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                          ></motion.div>
                          <div className="flex flex-col items-center space-y-2 z-10 bg-black/70 px-6 py-3 rounded-2xl backdrop-blur-md">
                            <div className="w-6 h-6 border-2 border-accentBlue border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs font-bold animate-pulse text-white">{scanMessage}</span>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <ScanLine size={36} className="mb-3 opacity-50" />
                      <span className="text-sm font-medium">Acquisisci Scheda Cartacea</span>
                    </>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => cameraInputRef.current?.click()} disabled={isScanning} className="flex-1 bg-white text-black font-semibold rounded-3xl py-4 hover:bg-neutral-200 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98]">
                    <Camera size={18} /><span>Scatta Foto</span>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} disabled={isScanning} className="flex-1 bg-surface border border-border text-white font-semibold rounded-3xl py-4 hover:bg-surfaceHover flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98]">
                    <ImageIcon size={18} /><span>Galleria</span>
                  </button>
                </div>
              </div>
            )}
        </div>
      </section>

      {/* LIST */}
      <section className="space-y-4">
          <div className="flex justify-between items-end mb-4 px-2">
            <h2 className="text-xl font-bold tracking-tight">Esercizi Inseriti</h2>
            <span className="text-xs font-medium text-muted bg-surface px-3 py-1.5 rounded-full border border-border">{activeDay.exercises.length} Esercizi</span>
          </div>

          {activeDay.exercises.length === 0 ? (
            <div className="bg-surface/30 border border-border border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center text-center space-y-4 mt-8 backdrop-blur-sm">
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-border/50"><Calendar className="text-muted" size={32} /></div>
              <div><h3 className="text-xl font-semibold text-white mb-2">Giorno Vuoto</h3><p className="text-sm text-muted">Aggiungi esercizi con i form qui sopra.</p></div>
            </div>
          ) : (
            <motion.div layout className="space-y-3">
              <AnimatePresence>
                {activeDay.exercises.map((workout) => (
                  <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={workout.id} className="bg-surface border border-border/50 rounded-3xl p-5 flex items-center justify-between group shadow-soft relative overflow-hidden">
                    <div className="flex items-center space-x-4 relative z-10">
                      <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-border"><Dumbbell size={20} className="text-muted" /></div>
                      <div>
                        <h3 className="font-semibold text-base mb-0.5">{workout.exerciseName}</h3>
                        <div className="flex items-center space-x-3 text-xs text-muted font-mono">
                          <span>{workout.sets} Sets</span><span className="opacity-30">•</span><span>{workout.reps} Reps</span>
                          {workout.weight > 0 && <><span className="opacity-30">•</span><span className="text-accentBlue font-medium px-2 py-0.5 bg-accentBlue/10 rounded-full">{workout.weight} kg</span></>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeWorkout(workout.id)} className="w-10 h-10 flex items-center justify-center bg-black/50 text-muted rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:text-red-400 relative z-10"><Trash2 size={16} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
      </section>
    </div>
  );
}
