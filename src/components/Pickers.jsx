import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SingleScrollPicker = ({ isOpen, onClose, title, options = [], initialValue, onSelect, unit }) => {
  const scrollRef = useRef(null);
  const [selectedValue, setSelectedValue] = useState(initialValue);
  const lastVibratedValue = useRef(initialValue);
  const itemHeight = 56;

  useEffect(() => {
    // Inizializzazione unica al montaggio (quando il picker viene aperto tramite AnimatePresence)
    if (scrollRef.current && options.length > 0) {
      const parsedInitial = parseFloat(initialValue);
      const idx = options.findIndex(o => parseFloat(o) === parsedInitial);
      if (idx !== -1) {
        // Timeout per permettere al DOM di stabilizzarsi prima dello scroll
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = idx * itemHeight;
            setSelectedValue(options[idx]);
            lastVibratedValue.current = options[idx];
          }
        }, 50);
      } else {
        setSelectedValue(options[0]);
      }
    }
  }, []); // Eseguito solo al mount

  const handleScroll = (e) => {
    if (!scrollRef.current || options.length === 0) return;
    const scrollY = e.target.scrollTop;
    const idx = Math.round(scrollY / itemHeight);
    const validIdx = Math.max(0, Math.min(idx, options.length - 1));
    const newVal = options[validIdx];
    
    if (String(newVal) !== String(lastVibratedValue.current)) {
      if (navigator.vibrate) navigator.vibrate(5);
      lastVibratedValue.current = newVal;
      setSelectedValue(newVal);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedValue);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }} onContextMenu={(e) => { e.preventDefault(); return false; }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-[#1c1c1e] border-t border-border/50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 flex flex-col overflow-hidden pb-safe">
            <div className="flex justify-between items-center p-5 shrink-0 bg-[#2c2c2e]">
               <h3 className="font-bold text-lg text-white">{title}</h3>
               <button onClick={handleConfirm} className="text-white font-bold bg-accentOrange px-5 py-1.5 rounded-full hover:bg-orange-500 active:scale-95 transition-all">Fatto</button>
            </div>
            
            <div className="relative h-[250px] w-full flex items-center justify-center bg-[#1c1c1e]">
               <div className="absolute top-0 w-full h-[97px] bg-gradient-to-b from-[#1c1c1e] to-transparent z-10 pointer-events-none" />
               <div className="absolute bottom-0 w-full h-[97px] bg-gradient-to-t from-[#1c1c1e] to-transparent z-10 pointer-events-none" />
               <div className="absolute top-1/2 -translate-y-1/2 w-full h-14 bg-white/5 border-y border-white/10 z-0 pointer-events-none flex items-center justify-center">
                  {unit && <span className="absolute ml-[120px] text-sm font-bold text-muted">{unit}</span>}
               </div>
               
               <div 
                 ref={scrollRef}
                 onScroll={handleScroll}
                 className="w-full h-full overflow-y-auto hide-scrollbar snap-y-mandatory px-4 relative z-20 text-center"
               >
                  <div className="h-[97px] shrink-0" />
                  {options.map((opt, i) => (
                    <div key={i} className="h-14 flex items-center justify-center snap-center-item shrink-0 text-3xl font-bold font-mono">
                      <span className={String(selectedValue) === String(opt) ? "text-white" : "text-white/30"}>{opt}</span>
                    </div>
                  ))}
                  <div className="h-[97px] shrink-0" />
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const WeightScrollPicker = ({ isOpen, onClose, title, initialValue, onSelect }) => {
  const hScrollRef = useRef(null); 
  const tScrollRef = useRef(null); 
  const uScrollRef = useRef(null); 
  const dScrollRef = useRef(null); 
  
  const digitOptions = Array.from({length: 10}, (_, i) => i); // 0-9
  const decOptions = ['.00', '.25', '.50', '.75'];

  const [selH, setSelH] = useState(0);
  const [selT, setSelT] = useState(0);
  const [selU, setSelU] = useState(0);
  const [selD, setSelD] = useState('.00');
  
  const lastVib = useRef({ h: 0, t: 0, u: 0, d: '.00' });
  const itemHeight = 56;

  useEffect(() => {
    if (isOpen) {
      const val = parseFloat(initialValue) || 0;
      const intVal = Math.floor(val);
      const decValNum = val - intVal;
      
      const h = Math.floor(intVal / 100) % 10;
      const t = Math.floor(intVal / 10) % 10;
      const u = intVal % 10;
      
      const decRounded = Math.round(decValNum * 100) / 100;
      let dStr = '.00';
      if (decRounded === 0.25) dStr = '.25';
      else if (decRounded === 0.5) dStr = '.50';
      else if (decRounded === 0.75) dStr = '.75';

      setTimeout(() => {
        if (hScrollRef.current) { hScrollRef.current.scrollTop = h * itemHeight; setSelH(h); lastVib.current.h = h; }
        if (tScrollRef.current) { tScrollRef.current.scrollTop = t * itemHeight; setSelT(t); lastVib.current.t = t; }
        if (uScrollRef.current) { uScrollRef.current.scrollTop = u * itemHeight; setSelU(u); lastVib.current.u = u; }
        if (dScrollRef.current) { 
           const dIdx = decOptions.indexOf(dStr);
           dScrollRef.current.scrollTop = Math.max(0, dIdx) * itemHeight; 
           setSelD(dStr); lastVib.current.d = dStr; 
        }
      }, 10);
    }
  }, [isOpen, initialValue]);

  const handleScroll = (ref, options, setter, key) => (e) => {
    if (!ref.current) return;
    const idx = Math.max(0, Math.min(Math.round(e.target.scrollTop / itemHeight), options.length - 1));
    const newVal = options[idx];
    if (newVal !== lastVib.current[key]) {
      if (navigator.vibrate) navigator.vibrate(5);
      lastVib.current[key] = newVal;
      setter(newVal);
    }
  };

  const handleConfirm = () => {
    const finalValue = parseFloat(`${selH}${selT}${selU}${selD}`);
    onSelect(finalValue);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }} onContextMenu={(e) => { e.preventDefault(); return false; }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-[#1c1c1e] border-t border-border/50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 flex flex-col overflow-hidden pb-safe">
            <div className="flex justify-between items-center p-5 shrink-0 bg-[#2c2c2e]">
               <h3 className="font-bold text-lg text-white">{title}</h3>
               <button onClick={handleConfirm} className="text-white font-bold bg-accentOrange px-5 py-1.5 rounded-full hover:bg-orange-500 active:scale-95 transition-all">Fatto</button>
            </div>
            
            <div className="relative h-[250px] w-full flex items-center justify-center bg-[#1c1c1e]">
               <div className="absolute top-0 w-full h-[97px] bg-gradient-to-b from-[#1c1c1e] to-transparent z-10 pointer-events-none" />
               <div className="absolute bottom-0 w-full h-[97px] bg-gradient-to-t from-[#1c1c1e] to-transparent z-10 pointer-events-none" />
               
               {/* Centro Lente & Etichetta */}
               <div className="absolute top-1/2 -translate-y-1/2 w-full h-14 bg-white/5 border-y border-white/10 z-0 pointer-events-none flex items-center justify-end pr-[20px]">
                 <span className="text-sm font-bold text-muted">kg</span>
               </div>
               
               <div className="w-full h-full flex relative z-20 justify-center pl-[20px] pr-[50px] space-x-1">
                 {/* 100s */}
                 <div ref={hScrollRef} onScroll={handleScroll(hScrollRef, digitOptions, setSelH, 'h')} className="w-12 h-full overflow-y-auto hide-scrollbar snap-y-mandatory relative text-center">
                    <div className="h-[97px] shrink-0" />
                    {digitOptions.map((opt, i) => (
                      <div key={i} className="h-14 flex items-center justify-center snap-center-item shrink-0 text-4xl font-bold font-mono">
                        <span className={selH === opt ? "text-white" : "text-white/30"}>{opt}</span>
                      </div>
                    ))}
                    <div className="h-[97px] shrink-0" />
                 </div>

                 {/* 10s */}
                 <div ref={tScrollRef} onScroll={handleScroll(tScrollRef, digitOptions, setSelT, 't')} className="w-12 h-full overflow-y-auto hide-scrollbar snap-y-mandatory relative text-center">
                    <div className="h-[97px] shrink-0" />
                    {digitOptions.map((opt, i) => (
                      <div key={i} className="h-14 flex items-center justify-center snap-center-item shrink-0 text-4xl font-bold font-mono">
                        <span className={selT === opt ? "text-white" : "text-white/30"}>{opt}</span>
                      </div>
                    ))}
                    <div className="h-[97px] shrink-0" />
                 </div>

                 {/* 1s */}
                 <div ref={uScrollRef} onScroll={handleScroll(uScrollRef, digitOptions, setSelU, 'u')} className="w-12 h-full overflow-y-auto hide-scrollbar snap-y-mandatory relative text-center">
                    <div className="h-[97px] shrink-0" />
                    {digitOptions.map((opt, i) => (
                      <div key={i} className="h-14 flex items-center justify-center snap-center-item shrink-0 text-4xl font-bold font-mono">
                        <span className={selU === opt ? "text-white" : "text-white/30"}>{opt}</span>
                      </div>
                    ))}
                    <div className="h-[97px] shrink-0" />
                 </div>
                 
                 {/* Decimals */}
                 <div ref={dScrollRef} onScroll={handleScroll(dScrollRef, decOptions, setSelD, 'd')} className="w-[84px] h-full overflow-y-auto hide-scrollbar snap-y-mandatory relative text-center">
                    <div className="h-[97px] shrink-0" />
                    {decOptions.map((opt, i) => (
                      <div key={i} className="h-14 flex items-center justify-center snap-center-item shrink-0 text-4xl font-bold font-mono">
                        <span className={selD === opt ? "text-white" : "text-white/30"}>{opt}</span>
                      </div>
                    ))}
                    <div className="h-[97px] shrink-0" />
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const TimeScrollPicker = ({ isOpen, onClose, title, initialValue, onSelect }) => {
  const minScrollRef = useRef(null);
  const secScrollRef = useRef(null);
  
  const minOptions = Array.from({length: 60}, (_, i) => i);
  const secOptions = Array.from({length: 12}, (_, i) => i * 5); // 0, 5, 10... 55

  const [selectedMin, setSelectedMin] = useState(0);
  const [selectedSec, setSelectedSec] = useState(0);
  
  const lastVibMin = useRef(0);
  const lastVibSec = useRef(0);
  
  const itemHeight = 56;

  useEffect(() => {
    if (isOpen) {
      const totalSecs = parseInt(initialValue) || 0;
      const initialMin = Math.floor(totalSecs / 60);
      const initialSec = totalSecs % 60;
      const closestSec = secOptions.reduce((prev, curr) => Math.abs(curr - initialSec) < Math.abs(prev - initialSec) ? curr : prev);

      setTimeout(() => {
        if (minScrollRef.current) {
          minScrollRef.current.scrollTop = initialMin * itemHeight;
          setSelectedMin(initialMin);
          lastVibMin.current = initialMin;
        }
        if (secScrollRef.current) {
          secScrollRef.current.scrollTop = secOptions.indexOf(closestSec) * itemHeight;
          setSelectedSec(closestSec);
          lastVibSec.current = closestSec;
        }
      }, 10);
    }
  }, [isOpen, initialValue]);

  const handleMinScroll = (e) => {
    if (!minScrollRef.current) return;
    const idx = Math.max(0, Math.min(Math.round(e.target.scrollTop / itemHeight), minOptions.length - 1));
    const newVal = minOptions[idx];
    if (newVal !== lastVibMin.current) {
      if (navigator.vibrate) navigator.vibrate(5);
      lastVibMin.current = newVal;
      setSelectedMin(newVal);
    }
  };

  const handleSecScroll = (e) => {
    if (!secScrollRef.current) return;
    const idx = Math.max(0, Math.min(Math.round(e.target.scrollTop / itemHeight), secOptions.length - 1));
    const newVal = secOptions[idx];
    if (newVal !== lastVibSec.current) {
      if (navigator.vibrate) navigator.vibrate(5);
      lastVibSec.current = newVal;
      setSelectedSec(newVal);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedMin * 60 + selectedSec);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }} onContextMenu={(e) => { e.preventDefault(); return false; }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-[#1c1c1e] border-t border-border/50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 flex flex-col overflow-hidden pb-safe">
            <div className="flex justify-between items-center p-5 shrink-0 bg-[#2c2c2e]">
               <h3 className="font-bold text-lg text-white">{title}</h3>
               <button onClick={handleConfirm} className="text-white font-bold bg-accentOrange px-5 py-1.5 rounded-full hover:bg-orange-500 active:scale-95 transition-all">Fatto</button>
            </div>
            
            <div className="relative h-[250px] w-full flex items-center justify-center bg-[#1c1c1e]">
               <div className="absolute top-0 w-full h-[97px] bg-gradient-to-b from-[#1c1c1e] to-transparent z-10 pointer-events-none" />
               <div className="absolute bottom-0 w-full h-[97px] bg-gradient-to-t from-[#1c1c1e] to-transparent z-10 pointer-events-none" />
               
               {/* Centro Lente & Etichette */}
               <div className="absolute top-1/2 -translate-y-1/2 w-full h-14 bg-white/5 border-y border-white/10 z-0 pointer-events-none flex items-center">
                 <div className="flex-1 relative h-full"><span className="absolute right-[15px] top-1/2 -translate-y-1/2 text-sm font-bold text-muted">min</span></div>
                 <div className="flex-1 relative h-full"><span className="absolute right-[15px] top-1/2 -translate-y-1/2 text-sm font-bold text-muted">sec</span></div>
               </div>
               
               <div className="w-full h-full flex relative z-20">
                 {/* Minuti */}
                 <div ref={minScrollRef} onScroll={handleMinScroll} className="flex-1 h-full overflow-y-auto hide-scrollbar snap-y-mandatory relative text-center">
                    <div className="h-[97px] shrink-0" />
                    {minOptions.map((opt, i) => (
                      <div key={i} className="h-14 flex items-center justify-center pr-4 snap-center-item shrink-0 text-4xl font-bold font-mono">
                        <span className={selectedMin === opt ? "text-white" : "text-white/30"}>{opt}</span>
                      </div>
                    ))}
                    <div className="h-[97px] shrink-0" />
                 </div>
                 
                 {/* Secondi */}
                 <div ref={secScrollRef} onScroll={handleSecScroll} className="flex-1 h-full overflow-y-auto hide-scrollbar snap-y-mandatory relative text-center">
                    <div className="h-[97px] shrink-0" />
                    {secOptions.map((opt, i) => (
                      <div key={i} className="h-14 flex items-center justify-center pr-4 snap-center-item shrink-0 text-4xl font-bold font-mono">
                        <span className={selectedSec === opt ? "text-white" : "text-white/30"}>{opt}</span>
                      </div>
                    ))}
                    <div className="h-[97px] shrink-0" />
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const NotesModal = ({ isOpen, onClose, initialValue, onSave }) => {
  const [text, setText] = useState(initialValue || '');

  useEffect(() => {
    if (isOpen) setText(initialValue || '');
  }, [isOpen, initialValue]);

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ WebkitTouchCallout: 'none' }}
          onContextMenu={(e) => { e.preventDefault(); return false; }}
        >
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-[#1c1c1e] border-t border-border/50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center p-5 shrink-0 bg-[#2c2c2e]">
              <h3 className="font-bold text-lg text-white">Note Tecniche</h3>
              <button
                onClick={handleSave}
                className="text-white font-bold bg-accentOrange px-5 py-1.5 rounded-full hover:bg-orange-500 active:scale-95 transition-all"
              >
                Salva
              </button>
            </div>
            <div className="p-5 pb-10" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Es: Mantieni le scapole retratte. Pausa di 1s in fondo. Non rimbalzare sul petto..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accentOrange/60 transition-colors resize-none min-h-[200px] leading-relaxed"
                style={{ userSelect: 'text', WebkitUserSelect: 'text', touchAction: 'auto' }}
              />
              {text.length > 0 && (
                <button
                  onClick={() => setText('')}
                  className="mt-3 text-xs text-muted/60 hover:text-red-400 transition-colors"
                >
                  Cancella nota
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
