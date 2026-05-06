import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Plus, BrainCircuit, ScanLine, Dumbbell, Calendar, Trash2, Activity, Copy, Archive, CheckCircle2, ChevronRight, ArrowLeft, Image as ImageIcon, Camera, CalendarDays, Flame, Trophy, Play, History as HistoryIcon, Heart, Search, X, Library, Tag, Edit3, Inbox, MoveRight, Minus, GripVertical, Settings2, Timer, NotebookPen, ChevronDown, ChevronUp, ListOrdered } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { cn } from '../App';
import { SingleScrollPicker, WeightScrollPicker, TimeScrollPicker, NotesModal } from '../components/Pickers';

const initialForm = { exerciseName: '', sets: '', reps: '', weight: '' };

const DAY_LABELS = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const HONEYCOMB_LAYOUT = [
  [1, 2],       
  [3, 4, 5],    
  [6, 0]        
];

const AVAILABLE_TAGS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Petto', 'Dorso', 'Gambe', 'Spalle', 'Braccia', 'Core'];

const EXERCISE_DB = [
  // Petto
  { id: 'db-1', name: 'Panca Piana Bilanciere', tags: ['Push', 'Upper', 'Petto'] },
  { id: 'db-2', name: 'Croci Manubri Panca Piana', tags: ['Push', 'Upper', 'Petto'] },
  { id: 'db-3', name: 'Panca Inclinata Manubri', tags: ['Push', 'Upper', 'Petto'] },
  { id: 'db-19', name: 'Panca Piana Manubri', tags: ['Push', 'Upper', 'Petto'] },
  { id: 'db-20', name: 'Panca Declinata Bilanciere', tags: ['Push', 'Upper', 'Petto'] },
  { id: 'db-21', name: 'Chest Press', tags: ['Push', 'Upper', 'Petto'] },
  { id: 'db-22', name: 'Croci ai Cavi', tags: ['Push', 'Upper', 'Petto'] },
  { id: 'db-23', name: 'Dip alle Parallele', tags: ['Push', 'Upper', 'Petto', 'Braccia'] },
  { id: 'db-24', name: 'Panca Inclinata Bilanciere', tags: ['Push', 'Upper', 'Petto'] },
  // Dorso
  { id: 'db-4', name: 'Trazioni Sbarra', tags: ['Pull', 'Upper', 'Dorso'] },
  { id: 'db-5', name: 'Rematore Bilanciere', tags: ['Pull', 'Upper', 'Dorso'] },
  { id: 'db-6', name: 'Lat Machine', tags: ['Pull', 'Upper', 'Dorso'] },
  { id: 'db-25', name: 'Rematore Manubrio', tags: ['Pull', 'Upper', 'Dorso'] },
  { id: 'db-26', name: 'Pulley Basso', tags: ['Pull', 'Upper', 'Dorso'] },
  { id: 'db-27', name: 'Pulldown Cavo Alto', tags: ['Pull', 'Upper', 'Dorso'] },
  { id: 'db-28', name: 'T-Bar Row', tags: ['Pull', 'Upper', 'Dorso'] },
  { id: 'db-29', name: 'Seal Row', tags: ['Pull', 'Upper', 'Dorso'] },
  { id: 'db-30', name: 'Face Pull', tags: ['Pull', 'Upper', 'Dorso', 'Spalle'] },
  // Spalle
  { id: 'db-7', name: 'Military Press', tags: ['Push', 'Upper', 'Spalle'] },
  { id: 'db-8', name: 'Alzate Laterali', tags: ['Push', 'Upper', 'Spalle'] },
  { id: 'db-31', name: 'Lento Avanti Manubri', tags: ['Push', 'Upper', 'Spalle'] },
  { id: 'db-32', name: 'Arnold Press', tags: ['Push', 'Upper', 'Spalle'] },
  { id: 'db-33', name: 'Alzate Laterali ai Cavi', tags: ['Push', 'Upper', 'Spalle'] },
  { id: 'db-34', name: 'Alzate Posteriori', tags: ['Pull', 'Upper', 'Spalle'] },
  { id: 'db-35', name: 'Shoulder Press Macchina', tags: ['Push', 'Upper', 'Spalle'] },
  // Braccia
  { id: 'db-9', name: 'Curl Bilanciere', tags: ['Pull', 'Upper', 'Braccia'] },
  { id: 'db-10', name: 'Pushdown Tricipiti', tags: ['Push', 'Upper', 'Braccia'] },
  { id: 'db-36', name: 'Curl Manubri Alternato', tags: ['Pull', 'Upper', 'Braccia'] },
  { id: 'db-37', name: 'Curl Martello', tags: ['Pull', 'Upper', 'Braccia'] },
  { id: 'db-38', name: 'French Press', tags: ['Push', 'Upper', 'Braccia'] },
  { id: 'db-39', name: 'Kick Back Tricipiti', tags: ['Push', 'Upper', 'Braccia'] },
  { id: 'db-40', name: 'Curl ai Cavi', tags: ['Pull', 'Upper', 'Braccia'] },
  { id: 'db-41', name: 'Curl Panca Scott', tags: ['Pull', 'Upper', 'Braccia'] },
  // Gambe
  { id: 'db-11', name: 'Squat', tags: ['Legs', 'Lower', 'Gambe'] },
  { id: 'db-12', name: 'Leg Press', tags: ['Legs', 'Lower', 'Gambe'] },
  { id: 'db-13', name: 'Stacchi da Terra', tags: ['Pull', 'Lower', 'Gambe', 'Dorso'] },
  { id: 'db-14', name: 'Leg Extension', tags: ['Legs', 'Lower', 'Gambe'] },
  { id: 'db-15', name: 'Leg Curl', tags: ['Legs', 'Lower', 'Gambe'] },
  { id: 'db-42', name: 'Affondi Manubri', tags: ['Legs', 'Lower', 'Gambe'] },
  { id: 'db-43', name: 'Bulgarian Split Squat', tags: ['Legs', 'Lower', 'Gambe'] },
  { id: 'db-44', name: 'Stacco Rumeno', tags: ['Pull', 'Lower', 'Gambe'] },
  { id: 'db-45', name: 'Hip Thrust', tags: ['Legs', 'Lower', 'Gambe'] },
  { id: 'db-46', name: 'Calf Raise', tags: ['Legs', 'Lower', 'Gambe'] },
  { id: 'db-47', name: 'Hack Squat', tags: ['Legs', 'Lower', 'Gambe'] },
  // Core & Full Body
  { id: 'db-16', name: 'Plank', tags: ['Core'] },
  { id: 'db-17', name: 'Crunch', tags: ['Core'] },
  { id: 'db-18', name: 'Burpees', tags: ['Full Body'] },
  { id: 'db-48', name: 'Ab Wheel Rollout', tags: ['Core'] },
];

const WIZARD_SPLITS = {
  1: [{ id: '1-fb', name: 'Full Body', tags: ['Full Body'] }],
  2: [
    { id: '2-ul', name: 'Upper / Lower', tags: ['Upper', 'Lower'] },
    { id: '2-fb', name: 'Full Body x2', tags: ['Full Body', 'Full Body'] }
  ],
  3: [
    { id: '3-ppl', name: 'Push / Pull / Legs', tags: ['Push', 'Pull', 'Legs'] },
    { id: '3-fb', name: 'Full Body x3', tags: ['Full Body', 'Full Body', 'Full Body'] },
    { id: '3-ulfb', name: 'Upper / Lower / Full Body', tags: ['Upper', 'Lower', 'Full Body'] }
  ],
  4: [
    { id: '4-ul', name: 'Upper / Lower x2', tags: ['Upper', 'Lower', 'Upper', 'Lower'] },
    { id: '4-bro', name: 'Bro Split', tags: ['Petto', 'Dorso', 'Gambe', 'Spalle+Braccia'] }
  ],
  5: [
    { id: '5-hyb', name: 'Hybrid (Upper/Lower + PPL)', tags: ['Upper', 'Lower', 'Push', 'Pull', 'Legs'], desc: 'Forza + Ipertrofia' },
    { id: '5-bro', name: 'Bro Split Completa', tags: ['Petto', 'Dorso', 'Gambe', 'Spalle', 'Braccia'] }
  ],
  6: [
    { id: '6-ppl', name: 'PPL x2', tags: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'] },
    { id: '6-arn', name: 'Arnold Split', tags: ['Petto+Dorso', 'Spalle+Braccia', 'Gambe', 'Petto+Dorso', 'Spalle+Braccia', 'Gambe'] }
  ],
  7: [
    { id: '7-bst', name: 'Beast Mode', tags: ['Full Body', 'Full Body', 'Full Body', 'Full Body', 'Full Body', 'Full Body', 'Full Body'] }
  ]
};

const SETS_OPTIONS = Array.from({length: 10}, (_, i) => i + 1); // 1-10
const REPS_OPTIONS = Array.from({length: 50}, (_, i) => i + 1); // 1-50
const KG_OPTIONS = Array.from({length: 401}, (_, i) => i * 0.5); // 0-200kg
const REST_OPTIONS = [0, 15, 30, 45, 60, 90, 120, 150, 180, 210, 240, 300, 360];

export default function EditorView({ library, setLibrary, history, setCurrentTab }) {
  const [route, setRoute] = useState('dashboard'); // dashboard, plan-details, day-edit, wizard
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [dayMode, setDayMode] = useState('select'); // select, refine
  const [draftExercises, setDraftExercises] = useState([]);

  const [selectedDateTs, setSelectedDateTs] = useState(new Date().setHours(0,0,0,0));

  const [inputMode, setInputMode] = useState('database'); 
  const [formData, setFormData] = useState(initialForm);
  const [aiText, setAiText] = useState('');
  
  const [dbSearch, setDbSearch] = useState('');
  const [isDbFilterActive, setIsDbFilterActive] = useState(true);

  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState({ name: '', frequency: 3, splitId: null });
  const [globalImportText, setGlobalImportText] = useState('');

  const [isTagOverlayOpen, setIsTagOverlayOpen] = useState(false);
  const [dayToTag, setDayToTag] = useState(null);

  const [isBinOverlayOpen, setIsBinOverlayOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleVisionParsing = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (navigator.vibrate) navigator.vibrate(50);
    
    // Simulate Vision processing
    setTimeout(() => {
      const mockExtracted = [
        { id: `v-${Date.now()}-1`, exerciseName: "Panca Piana", sets: 3, reps: 10, weight: 60 },
        { id: `v-${Date.now()}-2`, exerciseName: "Squat", sets: 4, reps: 8, weight: 100 },
        { id: `v-${Date.now()}-3`, exerciseName: "Croci ai Cavi", sets: 3, reps: 12, weight: 15 },
      ];

      if (selectedPlanId) {
        setLibrary(prev => prev.map(p => {
          if (p.id !== selectedPlanId) return p;
          return { ...p, unassigned: [...(p.unassigned || []), ...mockExtracted] };
        }));
        setIsBinOverlayOpen(true);
      } else {
        createEmptyPlan("Scheda Vision", null, mockExtracted);
      }
      
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    }, 1200);
  };

  // Focus & Picker States
  const [pickerConfig, setPickerConfig] = useState({ isOpen: false, type: 'single' });
  const [notesModalConfig, setNotesModalConfig] = useState({ isOpen: false, workoutId: null, value: '' });
  const [collapsedCards, setCollapsedCards] = useState({});
  const [isReorderMode, setIsReorderMode] = useState(false);

  // Wiggle Mode States (Days)
  const [isWiggleMode, setIsWiggleMode] = useState(false);
  const [draggedDayIdx, setDraggedDayIdx] = useState(null);
  const pressTimer = useRef(null);
  const circleRefs = useRef(new Map());
  const hoverTargetRef = useRef(null);

  // Wiggle Mode States (Exercises)
  const [draggedWorkoutId, setDraggedWorkoutId] = useState(null);
  const exercisePressTimer = useRef(null);

  // Focus Overlay States
  const [isExerciseFocusMode, setIsExerciseFocusMode] = useState(false);
  const [isSetFocusMode, setIsSetFocusMode] = useState(false);
  const [focusExerciseId, setFocusExerciseId] = useState(null);

  // -- HELPERS --
  const activePlan = library.find(p => p.id === selectedPlanId);
  const activeDay = activePlan?.days.find(d => d.id === selectedDayId);
  const currentActivePlan = library.find(p => p.status === 'active');
  
  const timelineDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let i = -15; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.getTime());
    }
    return dates;
  }, []);

  const timelineRef = useRef(null);
  
  useEffect(() => {
    if (route === 'dashboard' && timelineRef.current) {
      const todayIdx = 15;
      const el = timelineRef.current;
      const itemWidth = 64;
      el.scrollLeft = (todayIdx * itemWidth) - (el.clientWidth / 2) + (itemWidth / 2);
    }
  }, [route]);

  const getDayData = (ts) => {
    const d = new Date(ts);
    const dayOfWeek = d.getDay(); 
    const todayTs = new Date().setHours(0,0,0,0);
    const isPast = ts < todayTs;
    const isToday = ts === todayTs;
    
    const historyEntry = history.find(s => new Date(s.date).setHours(0,0,0,0) === ts);
    const isCompleted = !!historyEntry;
    
    let isScheduled = false;
    if (currentActivePlan) {
      const dayData = currentActivePlan.days.find(d => d.dayOfWeek === dayOfWeek);
      if (dayData && (dayData.exercises.length > 0 || (dayData.tags && dayData.tags.length > 0))) isScheduled = true;
    }
    
    return { isPast, isToday, isCompleted, isScheduled, historyEntry, dayOfWeek, dayNum: d.getDate() };
  };

  const selectedDayData = getDayData(selectedDateTs);

  const calculateVolume = (exercises) => {
    if (!exercises) return 0;
    return exercises.reduce((acc, curr) => {
      if (curr.isExpanded && curr.setDetails) {
        const setVol = curr.setDetails.reduce((sAcc, s) => {
          if (s.isWarmup) return sAcc;
          return sAcc + ((parseFloat(s.reps) || 0) * (parseFloat(s.weight) || 0));
        }, 0);
        return acc + setVol;
      }
      return acc + ((parseFloat(curr.sets) || 0) * (parseFloat(curr.reps) || 0) * (parseFloat(curr.weight) || 0));
    }, 0);
  };

  // -- WIZARD ACTIONS --
  const startWizard = () => {
    setWizardData({ name: '', frequency: 3, splitId: null });
    setGlobalImportText('');
    setWizardStep(0);
    setRoute('wizard');
  };

  const skipWizard = () => {
    createEmptyPlan("Nuova Scheda (Freestyle)");
  };

  const createEmptyPlan = (name, mappedDays = null, unassigned = []) => {
    const id = `plan-${Date.now()}`;
    const newPlan = { 
      id, 
      name: name || 'Nuova Scheda', 
      status: library.length === 0 ? 'active' : 'archived', 
      unassigned,
      days: Array.from({ length: 7 }, (_, i) => ({
        id: `day-${Date.now()}-${i}`,
        dayOfWeek: i,
        exercises: [],
        tags: mappedDays && mappedDays[i] ? mappedDays[i].split('+').map(t=>t.trim()) : []
      }))
    };
    setLibrary(prev => [...prev, newPlan]);
    setSelectedPlanId(id);
    setIsWiggleMode(false);
    setRoute('plan-details');
  };

  const finalizeWizard = () => {
    if (!wizardData.splitId) {
      createEmptyPlan(wizardData.name);
      return;
    }
    const splitConfig = WIZARD_SPLITS[wizardData.frequency].find(s => s.id === wizardData.splitId);
    const weekMapping = new Array(7).fill(null);
    const t = splitConfig.tags;

    if (wizardData.frequency === 1) weekMapping[1] = t[0]; 
    else if (wizardData.frequency === 2) { weekMapping[1] = t[0]; weekMapping[4] = t[1]; } 
    else if (wizardData.frequency === 3) { weekMapping[1] = t[0]; weekMapping[3] = t[1]; weekMapping[5] = t[2]; } 
    else if (wizardData.frequency === 4) { weekMapping[1] = t[0]; weekMapping[2] = t[1]; weekMapping[4] = t[2]; weekMapping[5] = t[3]; } 
    else if (wizardData.frequency === 5) { weekMapping[1] = t[0]; weekMapping[2] = t[1]; weekMapping[3] = t[2]; weekMapping[4] = t[3]; weekMapping[5] = t[4]; } 
    else if (wizardData.frequency === 6) { weekMapping[1] = t[0]; weekMapping[2] = t[1]; weekMapping[3] = t[2]; weekMapping[4] = t[3]; weekMapping[5] = t[4]; weekMapping[6] = t[5]; } 
    else if (wizardData.frequency === 7) { t.forEach((tag, i) => { const mapIdx = i === 6 ? 0 : i + 1; weekMapping[mapIdx] = tag; }); }

    createEmptyPlan(wizardData.name, weekMapping);
  };

  const handleGlobalImport = () => {
    if (!globalImportText.trim()) return;
    const lines = globalImportText.split('\n');
    let unassigned = [];
    
    lines.forEach(line => {
      if(!line.trim()) return;
      let exName = "";
      let sets = 3, reps = 10, weight = 0;
      
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
      } else {
        exName = line.trim();
      }
      
      if (exName.length > 2) {
        unassigned.push({ id: `u-${Date.now()}-${Math.random()}`, exerciseName: exName, sets, reps, weight });
      }
    });

    createEmptyPlan("Scheda Importata", null, unassigned);
  };

  const togglePlanStatus = (id, e) => {
    e.stopPropagation();
    setLibrary(prev => prev.map(p => {
      if (p.id === id) return { ...p, status: 'active' };
      return { ...p, status: 'archived' };
    }));
  };

  const deletePlan = (id, e) => {
    e.stopPropagation();
    if(confirm("Sei sicuro di voler eliminare questa scheda?")) {
      setLibrary(prev => prev.filter(p => p.id !== id));
    }
  };

  const enterDayEdit = (dayData) => {
    if (isWiggleMode) {
      if (dayData.exercises.length === 0 && (!dayData.tags || dayData.tags.length === 0)) {
        setDayToTag(dayData);
        setIsTagOverlayOpen(true);
      }
      return;
    }
    setSelectedDayId(dayData.id);
    if (dayData.exercises.length === 0) setDayMode('select');
    else setDayMode('refine');
    setDraftExercises([]);
    setIsReorderMode(false);
    setRoute('day-edit');
  };

  const handleDraftToggle = (exerciseObj) => {
    setDraftExercises(prev => {
      const exists = prev.find(e => e.exerciseName === exerciseObj.name);
      if (exists) return prev.filter(e => e.exerciseName !== exerciseObj.name);
      return [...prev, { id: `draft-${Date.now()}-${Math.random()}`, exerciseName: exerciseObj.name, sets: 3, reps: 10, weight: 0 }];
    });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleDraftManual = (e) => {
    e.preventDefault();
    if (!formData.exerciseName.trim()) return;
    setDraftExercises(prev => [...prev, { 
      id: `draft-${Date.now()}-${Math.random()}`, 
      exerciseName: formData.exerciseName.trim(), 
      sets: parseInt(formData.sets, 10) || 3, 
      reps: parseInt(formData.reps, 10) || 10, 
      weight: parseFloat(formData.weight) || 0 
    }]);
    setFormData(initialForm);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleDraftAi = () => {
    if (!aiText.trim()) return;
    const lines = aiText.split('\n');
    let newDrafts = [];
    lines.forEach(line => {
      if(!line.trim()) return;
      let exName = "";
      let sets = 3, reps = 10, weight = 0;
      
      const rx1 = /(?:^|\s)(\d+)\s*(?:x|set\s+da)\s*(\d+)(?:\s+(?:di|con))?/i;
      const m1 = line.match(rx1);
      
      if (m1) {
        sets = parseInt(m1[1], 10);
        reps = parseInt(m1[2], 10);
        let remainder = line.replace(m1[0], ' ');
        const rxKg = /(\d+(?:\.\d+)?)\s*(?:kg|chili|chilo)/i;
        const mKg = remainder.match(rxKg);
        if (mKg) { weight = parseFloat(mKg[1]); remainder = remainder.replace(mKg[0], ' '); }
        exName = remainder.replace(/^[-\s]+|[-\s]+$/g, '').trim();
      } else { exName = line.trim(); }
      
      if (exName) newDrafts.push({ id: `draft-${Date.now()}-${Math.random()}`, exerciseName: exName, sets, reps, weight });
    });
    setDraftExercises(prev => [...prev, ...newDrafts]);
    setAiText('');
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const confirmSelection = () => {
    setLibrary(prev => prev.map(p => {
      if (p.id !== selectedPlanId) return p;
      const newDays = p.days.map(d => {
        if (d.id !== selectedDayId) return d;
        return { ...d, exercises: [...d.exercises, ...draftExercises] };
      });
      return { ...p, days: newDays };
    }));
    setDayMode('refine');
    setDraftExercises([]);
  };

  // --- LAB ACTIONS (Refine Phase) ---
  const updateExercisesList = (newExercisesList) => {
    setLibrary(prev => prev.map(p => {
      if (p.id !== selectedPlanId) return p;
      const newDays = p.days.map(d => {
        if (d.id !== selectedDayId) return d;
        return { ...d, exercises: newExercisesList };
      });
      return { ...p, days: newDays };
    }));
  };

  const updateWorkout = (workoutId, updates) => {
    const newExList = activeDay.exercises.map(w => w.id === workoutId ? { ...w, ...updates } : w);
    updateExercisesList(newExList);
  };

  const removeWorkout = (workoutId) => {
    updateExercisesList(activeDay.exercises.filter(w => w.id !== workoutId));
  };

  const expandToAdvanced = (workoutId) => {
    if (navigator.vibrate) navigator.vibrate(20);
    const ex = activeDay.exercises.find(w => w.id === workoutId);
    const numSets = parseInt(ex.sets) || 3;
    const reps = parseInt(ex.reps) || 10;
    const weight = parseFloat(ex.weight) || 0;
    const setDetails = Array.from({length: numSets}, (_, i) => ({
      id: `set-${Date.now()}-${i}`, reps, weight, isWarmup: false
    }));
    updateWorkout(workoutId, { isExpanded: true, setDetails, restTime: '', notes: '' });
    // Ensure expanded card is not collapsed
    setCollapsedCards(p => ({...p, [workoutId]: false}));
  };

  const addDetailedRow = (workoutId) => {
    const ex = activeDay.exercises.find(w => w.id === workoutId);
    const lastSet = ex.setDetails[ex.setDetails.length - 1];
    const newSet = {
      id: `set-${Date.now()}`,
      reps: lastSet ? lastSet.reps : 10,
      weight: lastSet ? lastSet.weight : 0,
      isWarmup: false
    };
    updateWorkout(workoutId, { setDetails: [...ex.setDetails, newSet] });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const removeDetailedRow = (workoutId, setId) => {
    const ex = activeDay.exercises.find(w => w.id === workoutId);
    if (ex.setDetails.length <= 1) return;
    updateWorkout(workoutId, { setDetails: ex.setDetails.filter(s => s.id !== setId) });
  };

  const updateDetailedRow = (workoutId, setId, field, value) => {
    const ex = activeDay.exercises.find(w => w.id === workoutId);
    const newSets = ex.setDetails.map(s => s.id === setId ? { ...s, [field]: value } : s);
    updateWorkout(workoutId, { setDetails: newSets });
  };

  const openSinglePicker = (title, options, initialValue, unit, onSelect) => {
    setPickerConfig({
      isOpen: true,
      type: 'single',
      title,
      options,
      initialValue,
      unit,
      onSelect
    });
  };

  const openWeightPicker = (title, initialValue, onSelect) => {
    setPickerConfig({
      isOpen: true,
      type: 'weight',
      title,
      initialValue,
      onSelect
    });
  };

  const openTimePicker = (title, initialValue, onSelect) => {
    setPickerConfig({
      isOpen: true,
      type: 'time',
      title,
      initialValue,
      onSelect
    });
  };

  const toggleCollapse = (id) => setCollapsedCards(p => ({...p, [id]: !p[id]}));

  const handleExercisePointerDown = (workoutId) => {
    exercisePressTimer.current = setTimeout(() => {
      setIsExerciseFocusMode(true);
      if (navigator.vibrate) navigator.vibrate(20);
    }, 500);
  };

  const handleSetPointerDown = (workoutId) => {
    exercisePressTimer.current = setTimeout(() => {
      setFocusExerciseId(workoutId);
      setIsSetFocusMode(true);
      if (navigator.vibrate) navigator.vibrate(20);
    }, 500);
  };

  const handleExercisePointerUp = () => {
    if (exercisePressTimer.current) clearTimeout(exercisePressTimer.current);
  };

  const updateDayTags = (dayId, tags) => {
    setLibrary(prev => prev.map(p => {
      if (p.id !== selectedPlanId) return p;
      const newDays = p.days.map(d => {
        if (d.id !== dayId) return d;
        return { ...d, tags };
      });
      return { ...p, days: newDays };
    }));
  };

  const handleDayExit = () => {
    if (activeDay && activeDay.exercises.length === 0 && activeDay.tags && activeDay.tags.length > 0) {
      if (confirm("Sembra un giorno di riposo, confermi? (Se confermi i tag verranno rimossi)")) {
        updateDayTags(activeDay.id, []);
      }
    }
    setRoute('plan-details');
  };

  const assignBinExercise = (exId, dayOfWeekIdx) => {
    setLibrary(prev => prev.map(p => {
      if (p.id !== selectedPlanId) return p;
      const exToMove = p.unassigned.find(u => u.id === exId);
      if (!exToMove) return p;
      const newDays = p.days.map(d => {
        if (d.dayOfWeek === dayOfWeekIdx) return { ...d, exercises: [...d.exercises, exToMove] };
        return d;
      });
      return { ...p, days: newDays, unassigned: p.unassigned.filter(u => u.id !== exId) };
    }));
  };

  // -- WIGGLE DRAG AND DROP LOGIC --
  const handlePointerDown = () => {
    if (!isWiggleMode) {
      pressTimer.current = setTimeout(() => {
        setIsWiggleMode(true);
        if (navigator.vibrate) navigator.vibrate(20);
      }, 500);
    }
  };

  const handlePointerUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleDragStart = (e, info, idx) => {
    setDraggedDayIdx(idx);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleDrag = (sourceIdx, info) => {
    let dropTargetIdx = null;
    for (let [idx, ref] of circleRefs.current.entries()) {
      if (ref && idx !== sourceIdx) {
        const rect = ref.getBoundingClientRect();
        const padding = 30;
        if (
          info.point.x >= rect.left - padding && info.point.x <= rect.right + padding &&
          info.point.y >= rect.top - padding && info.point.y <= rect.bottom + padding
        ) {
          dropTargetIdx = idx;
          break;
        }
      }
    }

    if (hoverTargetRef.current !== dropTargetIdx) {
      if (navigator.vibrate && dropTargetIdx !== null) navigator.vibrate(15);
      
      if (hoverTargetRef.current !== null) {
         const prevEl = circleRefs.current.get(hoverTargetRef.current);
         if (prevEl) prevEl.classList.remove('ring-4', 'ring-accentOrange', 'scale-110', 'shadow-[0_0_30px_rgba(255,159,10,0.8)]', 'animate-pulse');
      }
      
      if (dropTargetIdx !== null) {
         const newEl = circleRefs.current.get(dropTargetIdx);
         if (newEl) newEl.classList.add('ring-4', 'ring-accentOrange', 'scale-110', 'shadow-[0_0_30px_rgba(255,159,10,0.8)]', 'animate-pulse', 'transition-all');
      }
      
      hoverTargetRef.current = dropTargetIdx;
    }
  };

  const handleDragEnd = (sourceIdx, info) => {
    setDraggedDayIdx(null);
    const dropTargetIdx = hoverTargetRef.current;
    
    if (hoverTargetRef.current !== null) {
       const el = circleRefs.current.get(hoverTargetRef.current);
       if (el) el.classList.remove('ring-4', 'ring-accentOrange', 'scale-110', 'shadow-[0_0_30px_rgba(255,159,10,0.8)]', 'animate-pulse');
       hoverTargetRef.current = null;
    }

    if (dropTargetIdx !== null) {
      if (navigator.vibrate) navigator.vibrate(50);
      setLibrary(prev => prev.map(p => {
        if (p.id !== selectedPlanId) return p;
        const d1 = p.days.find(d => d.dayOfWeek === sourceIdx);
        const d2 = p.days.find(d => d.dayOfWeek === dropTargetIdx);
        
        const newDays = p.days.map(d => {
           if (d.dayOfWeek === sourceIdx) return { ...d, tags: d2.tags, exercises: d2.exercises };
           if (d.dayOfWeek === dropTargetIdx) return { ...d, tags: d1.tags, exercises: d1.exercises };
           return d;
        });
        return { ...p, days: newDays };
      }));
    }
  };

  const resetDay = (dayOfWeekIdx) => {
    setLibrary(prev => prev.map(p => {
      if (p.id !== selectedPlanId) return p;
      const newDays = p.days.map(d => {
        if (d.dayOfWeek === dayOfWeekIdx) return { ...d, exercises: [], tags: [] };
        return d;
      });
      return { ...p, days: newDays };
    }));
  };

  // -- RENDER WIZARD --
  if (route === 'wizard') {
    return (
      <div className="flex flex-col h-[100dvh] bg-black text-white px-6 py-10 relative">
        <div className="absolute top-10 right-6 z-10">
           <button onClick={skipWizard} className="text-sm font-bold text-muted hover:text-white uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full backdrop-blur-md">
             Skip / Freestyle
           </button>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <AnimatePresence mode="wait">
            
            {wizardStep === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="w-16 h-16 bg-accentBlue/10 rounded-full flex items-center justify-center border border-accentBlue/30 mb-4 shadow-[0_0_30px_rgba(10,132,255,0.2)]">
                  <Plus size={32} className="text-accentBlue" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-2">Nuova Scheda</h2>
                  <p className="text-muted">Come vuoi procedere?</p>
                </div>
                
                <div className="space-y-4">
                  <button onClick={() => setWizardStep(1)} className="w-full bg-surface border border-border p-6 rounded-3xl text-left hover:border-white/50 transition-all group">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-accentBlue">Start from Scratch</h3>
                    <p className="text-sm text-muted">Costruisci una scheda da zero, scegliendo i giorni e i target.</p>
                  </button>
                  <button onClick={() => setWizardStep('import')} className="w-full bg-surface border border-border p-6 rounded-3xl text-left hover:border-white/50 transition-all group">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-accentOrange">Import via Text/Photo</h3>
                    <p className="text-sm text-muted">Incolla o scansiona una scheda esistente e lascia fare all'AI.</p>
                  </button>
                </div>
              </motion.div>
            )}

            {wizardStep === 'import' && (
              <motion.div key="import" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-2">Importa Scheda</h2>
                  <p className="text-muted text-sm">Incolla qui tutto il testo della tua scheda. Gli esercizi verranno messi in un cestino globale pronti per essere assegnati ai giorni.</p>
                </div>
                <textarea 
                  autoFocus
                  value={globalImportText} 
                  onChange={(e) => setGlobalImportText(e.target.value)} 
                  placeholder="Lunedì: Panca piana 3x10...&#10;Martedì: Squat 4x8..." 
                  className="w-full bg-surface border border-border rounded-3xl p-5 text-sm focus:outline-none focus:border-accentOrange focus:ring-1 focus:ring-accentOrange transition-colors min-h-[250px] resize-none"
                />
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => setWizardStep(0)} className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center shrink-0"><ArrowLeft size={20} /></button>
                  <button 
                    onClick={handleGlobalImport}
                    disabled={!globalImportText.trim()}
                    className="flex-1 bg-gradient-to-r from-accentOrange to-orange-500 text-white font-bold text-lg rounded-full py-4 shadow-[0_0_20px_rgba(255,159,10,0.4)] disabled:opacity-50 transition-all active:scale-95 flex justify-center items-center"
                  >
                    Estrai & Importa
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleVisionParsing} accept="image/*" className="hidden" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-full bg-accentBlue/20 border border-accentBlue/40 flex items-center justify-center shrink-0 text-accentBlue hover:bg-accentBlue/30 transition-all"
                  >
                    <Camera size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {wizardStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-2">Costruiamo.</h2>
                  <p className="text-muted">Come vuoi chiamare questo piano di allenamento?</p>
                </div>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="es. Massa Estiva" 
                  value={wizardData.name} 
                  onChange={e => setWizardData({...wizardData, name: e.target.value})}
                  className="w-full bg-surface border border-border/50 rounded-2xl p-5 text-xl font-bold focus:outline-none focus:border-accentBlue focus:ring-1 focus:ring-accentBlue transition-colors" 
                />
                <div className="flex space-x-3 pt-8">
                  <button onClick={() => setWizardStep(0)} className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center shrink-0"><ArrowLeft size={20} /></button>
                  <button 
                    onClick={() => setWizardStep(2)}
                    disabled={!wizardData.name.trim()}
                    className="flex-1 bg-white text-black font-bold text-lg rounded-full py-4 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 transition-all active:scale-95 flex justify-center items-center"
                  >
                    Continua <ChevronRight size={20} className="ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {wizardStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-2">Frequenza</h2>
                  <p className="text-muted">Quanti giorni a settimana vuoi allenarti?</p>
                </div>
                
                <div className="flex justify-center items-center space-x-6">
                   <button onClick={() => setWizardData({...wizardData, frequency: Math.max(1, wizardData.frequency - 1)})} className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center text-2xl font-bold hover:bg-white/10 active:scale-95">-</button>
                   <span className="text-7xl font-bold font-mono tracking-tighter w-24 text-center">{wizardData.frequency}</span>
                   <button onClick={() => setWizardData({...wizardData, frequency: Math.min(7, wizardData.frequency + 1)})} className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center text-2xl font-bold hover:bg-white/10 active:scale-95">+</button>
                </div>

                <div className="flex space-x-3 pt-8">
                  <button onClick={() => setWizardStep(1)} className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center shrink-0"><ArrowLeft size={20} /></button>
                  <button onClick={() => setWizardStep(3)} className="flex-1 bg-white text-black font-bold text-lg rounded-full py-4 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all active:scale-95 flex justify-center items-center">
                    Avanti <ChevronRight size={20} className="ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {wizardStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-2">Split Suggerite</h2>
                  <p className="text-muted">Ho trovato queste combinazioni per {wizardData.frequency} giorni.</p>
                </div>
                
                <div className="space-y-3">
                  {WIZARD_SPLITS[wizardData.frequency].map(split => (
                    <div key={split.id} onClick={() => setWizardData({...wizardData, splitId: split.id})} className={cn("p-5 rounded-3xl border cursor-pointer transition-all active:scale-95", wizardData.splitId === split.id ? "bg-accentBlue/20 border-accentBlue shadow-[0_0_20px_rgba(10,132,255,0.2)]" : "bg-surface border-border hover:border-white/30")}>
                      <h3 className="font-bold text-lg mb-1 flex items-center justify-between">{split.name}{wizardData.splitId === split.id && <CheckCircle2 size={18} className="text-accentBlue" />}</h3>
                      {split.desc && <p className="text-xs font-bold text-accentOrange uppercase tracking-widest mb-3">{split.desc}</p>}
                      <div className="flex flex-wrap gap-1">{split.tags.map((t, i) => <span key={i} className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-black/50 rounded-full text-muted">{t}</span>)}</div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button onClick={() => setWizardStep(2)} className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center shrink-0"><ArrowLeft size={20} /></button>
                  <button onClick={finalizeWizard} disabled={!wizardData.splitId} className="flex-1 bg-white text-black font-bold text-lg rounded-full py-4 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 transition-all active:scale-95 flex justify-center items-center">
                    Genera Scheda <BrainCircuit size={20} className="ml-2" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // -- RENDER DASHBOARD --
  if (route === 'dashboard') {
    return (
      <div className="flex flex-col h-[100dvh] pb-24 overflow-hidden bg-black text-white">
        <header className="px-4 pt-8 pb-2 shrink-0">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        </header>

        <div className="shrink-0 w-full mb-6">
          <div ref={timelineRef} className="flex space-x-2 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-4 py-2">
            {timelineDates.map(ts => {
              const data = getDayData(ts);
              const isSelected = selectedDateTs === ts;

              return (
                <div key={ts} onClick={() => setSelectedDateTs(ts)} className="snap-center shrink-0 w-16 flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95">
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-2", isSelected ? "text-white" : "text-muted")}>
                    {DAY_LABELS[data.dayOfWeek]}
                  </span>
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative", isSelected ? "bg-surface border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-transparent border border-transparent")}>
                    {data.isCompleted ? (
                      <div className="w-8 h-8 rounded-full bg-green-500 shadow-[0_0_15px_rgba(52,199,89,0.5)] flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-black" />
                      </div>
                    ) : (data.isScheduled && !data.isPast) ? (
                      <div className={cn(
                        "w-8 h-8 rounded-full border-2 border-dashed border-accentOrange bg-accentOrange/10 shadow-[0_0_10px_rgba(255,159,10,0.2)] flex items-center justify-center"
                      )}>
                        <span className="text-sm font-bold text-accentOrange">{data.dayNum}</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-surface border border-border/50 flex items-center justify-center">
                         <span className={cn("text-sm font-medium", isSelected ? "text-white" : "text-muted")}>{data.dayNum}</span>
                      </div>
                    )}
                    {data.isToday && !isSelected && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 space-y-8">
          <AnimatePresence mode="wait">
            <motion.div key={selectedDateTs} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {selectedDayData.isCompleted && selectedDayData.historyEntry ? (
                <div className="bg-surface/50 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-soft relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><HistoryIcon size={120} /></div>
                  <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-1 flex items-center"><CheckCircle2 size={14} className="mr-1" /> Completato</h3>
                  <h2 className="text-2xl font-bold tracking-tight mb-6">{selectedDayData.historyEntry.planName}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 rounded-2xl p-4 border border-border/50">
                      <div className="flex items-center space-x-2 text-muted mb-2"><Dumbbell size={16} /> <span className="text-xs uppercase font-bold tracking-widest">Volume</span></div>
                      <span className="text-2xl font-bold font-mono">{selectedDayData.historyEntry.volume.toLocaleString()} <span className="text-sm text-muted">kg</span></span>
                    </div>
                    <div className="bg-black/30 rounded-2xl p-4 border border-border/50">
                      <div className="flex items-center space-x-2 text-muted mb-2"><Flame size={16} className="text-accentOrange" /> <span className="text-xs uppercase font-bold tracking-widest">Kcal</span></div>
                      <span className="text-2xl font-bold font-mono">{Math.floor((selectedDayData.historyEntry.volume * 0.05) + ((selectedDayData.historyEntry.duration || 0) / 60) * 5)} <span className="text-sm text-muted">kcal</span></span>
                    </div>
                  </div>
                </div>
              ) : selectedDayData.isToday && selectedDayData.isScheduled ? (
                <div className="bg-gradient-to-br from-accentOrange/20 to-surface backdrop-blur-xl border border-accentOrange/30 rounded-3xl p-6 shadow-[0_20px_50px_rgba(255,159,10,0.15)] relative overflow-hidden">
                  <h3 className="text-sm font-bold text-accentOrange uppercase tracking-widest mb-1 flex items-center"><CalendarDays size={14} className="mr-1" /> Pianificato per Oggi</h3>
                  <h2 className="text-3xl font-bold tracking-tight mb-2">{currentActivePlan?.name}</h2>
                  <p className="text-muted text-sm mb-8">Oggi è {DAY_NAMES[selectedDayData.dayOfWeek]}. L'allenamento corretto verrà caricato automaticamente.</p>
                  <button onClick={() => setCurrentTab('active')} className="w-full bg-accentOrange text-white font-black text-lg uppercase tracking-widest rounded-2xl py-4 shadow-[0_10px_30px_rgba(255,159,10,0.4)] hover:opacity-90 transition-transform active:scale-[0.98] flex items-center justify-center space-x-2">
                    <Play size={24} className="fill-white" /><span>Inizia Sessione</span>
                  </button>
                </div>
              ) : selectedDayData.isToday && !selectedDayData.isScheduled ? (
                <div className="bg-surface border border-border/50 rounded-3xl p-6 shadow-soft flex flex-col items-center justify-center text-center py-10">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><Heart size={28} className="text-muted" /></div>
                  <h3 className="text-xl font-bold mb-2">Giorno di Riposo</h3>
                  <p className="text-sm text-muted mb-6">Il recupero è parte dell'allenamento. Goditi la pausa o anticipa la sessione di domani.</p>
                  <button onClick={() => setCurrentTab('active')} className="px-6 py-3 bg-white/10 text-white text-sm font-bold uppercase tracking-widest rounded-full hover:bg-white/20 transition-colors">Vai alla LiveView</button>
                </div>
              ) : selectedDayData.isPast ? (
                <div className="bg-surface/30 border border-border/50 border-dashed rounded-3xl p-6 shadow-soft flex items-center justify-center py-10"><span className="text-muted font-medium text-sm">Giorno di riposo trascorso.</span></div>
              ) : (
                <div className="bg-surface/30 border border-border/50 border-dashed rounded-3xl p-6 shadow-soft flex items-center justify-center py-10"><span className="text-muted font-medium text-sm">{selectedDayData.isScheduled ? 'Allenamento Programmato.' : 'Riposo Programmato.'}</span></div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Master Library */}
          <div className="pt-4 border-t border-border/50 pb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight">Libreria Master</h2>
              <button onClick={startWizard} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {library.map(plan => {
                const totalExercises = plan.days.reduce((acc, d) => acc + d.exercises.length, 0);
                const activeDays = plan.days.filter(d => d.exercises.length > 0 || (d.tags && d.tags.length > 0)).length;
                return (
                  <div key={plan.id} className="bg-surface/80 backdrop-blur-md border border-border/50 rounded-3xl p-5 flex flex-col space-y-4 group transition-all hover:border-border cursor-pointer" onClick={() => { setSelectedPlanId(plan.id); setIsWiggleMode(false); setRoute('plan-details'); }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg mb-2 group-hover:text-accentOrange transition-colors">{plan.name}</h3>
                        <div className="flex space-x-2">
                          {plan.status === 'active' && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-accentBlue text-white">Attiva</span>}
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black border border-border text-muted flex items-center">{activeDays}/7 Giorni</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black border border-border text-muted flex items-center">{totalExercises} Esercizi</span>
                        </div>
                      </div>
                      <ChevronRight className="text-muted" />
                    </div>

                    <div className="flex items-center space-x-2 pt-4 border-t border-border/20">
                      <button onClick={(e) => togglePlanStatus(plan.id, e)} className="flex-1 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center space-x-1">
                        <CheckCircle2 size={16} className={plan.status === 'active' ? "text-accentBlue" : ""} />
                        <span className={plan.status === 'active' ? "text-accentBlue" : "text-muted"}>Attiva</span>
                      </button>
                      <button onClick={(e) => deletePlan(plan.id, e)} className="p-2.5 rounded-2xl text-muted bg-white/5 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- WIGGLE ANIMATION VARIANT ---
  const wiggleVariants = {
    animate: {
      rotate: [-2, 2, -2],
      transition: { repeat: Infinity, duration: 0.3, ease: 'linear' }
    },
    idle: { rotate: 0 }
  };

  // --- CIRCLE PLAN DETAILS VIEW ---
  if (route === 'plan-details') {
    return (
      <div className="h-[100dvh] flex flex-col bg-black text-white overflow-hidden relative" onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
        <header className="pt-10 px-6 mb-2 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-4">
            <button onClick={() => { setIsWiggleMode(false); setRoute('dashboard'); }} className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-accentOrange">{activePlan.name}</h1>
              <p className="text-muted text-sm">Pianificazione Settimanale</p>
            </div>
          </div>
          
          <AnimatePresence>
            {isWiggleMode && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setIsWiggleMode(false)}
                className="bg-accentBlue text-white font-bold px-4 py-1.5 rounded-full text-sm shadow-[0_0_15px_rgba(10,132,255,0.4)] active:scale-95 transition-all"
              >
                Fatto
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        {activePlan.unassigned && activePlan.unassigned.length > 0 && (
          <div className="px-4 mt-4 z-10 relative">
            <div onClick={() => setIsBinOverlayOpen(true)} className="bg-accentOrange/10 border border-accentOrange/30 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-accentOrange/20 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-accentOrange/20 flex items-center justify-center text-accentOrange"><Inbox size={18}/></div>
                <div><h3 className="font-bold text-accentOrange">Cestino Importazioni</h3><p className="text-xs text-accentOrange/80">{activePlan.unassigned.length} Esercizi in attesa</p></div>
              </div>
              <ChevronRight className="text-accentOrange" />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-0">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accentOrange/10 blur-[100px] rounded-full pointer-events-none" />
           
           <div className="flex flex-col items-center gap-y-10 mt-8 select-none" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }} onContextMenu={(e) => { e.preventDefault(); return false; }}>
              {HONEYCOMB_LAYOUT.map((row, rowIdx) => (
                <div key={rowIdx} className={cn("flex gap-x-8", row.length === 2 ? "px-8" : "")}>
                  {row.map(dayOfWeekIdx => {
                    const dayData = activePlan.days.find(d => d.dayOfWeek === dayOfWeekIdx);
                    const hasExercises = dayData?.exercises?.length > 0;
                    const hasTags = dayData?.tags?.length > 0;
                    const hasData = hasExercises || hasTags;
                    
                    let tagLabel = 'Riposo';
                    if (hasTags) {
                      tagLabel = dayData.tags.length > 1 ? `${dayData.tags[0]} +${dayData.tags.length - 1}` : dayData.tags[0];
                    } else if (hasExercises) {
                      tagLabel = 'Tag da assegnare';
                    }

                    const totalSets = dayData?.exercises?.reduce((acc, ex) => acc + (parseInt(ex.isExpanded && ex.setDetails ? ex.setDetails.length : ex.sets) || 0), 0) || 0;

                    return (
                      <div key={dayOfWeekIdx} className="relative flex flex-col items-center group">
                        
                        {/* Ghost Placeholder */}
                        <div className="absolute top-0 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center opacity-20 pointer-events-none rounded-full border border-dashed border-white/20" style={{ borderRadius: '9999px' }}>
                          <span className="font-black text-xl sm:text-2xl tracking-tighter">{DAY_LABELS[dayOfWeekIdx]}</span>
                        </div>

                        <motion.div
                          ref={el => circleRefs.current.set(dayOfWeekIdx, el)}
                          layoutId={`honeycomb-day-${dayOfWeekIdx}`}
                          variants={wiggleVariants}
                          animate={isWiggleMode ? "animate" : "idle"}
                          onPointerDown={handlePointerDown}
                          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
                          drag={isWiggleMode}
                          dragSnapToOrigin
                          onDragStart={(e, info) => handleDragStart(e, info, dayOfWeekIdx)}
                          onDrag={(e, info) => handleDrag(dayOfWeekIdx, info)}
                          whileDrag={{ scale: 1.2, zIndex: 9999, opacity: 0.9, boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}
                          onDragEnd={(e, info) => handleDragEnd(dayOfWeekIdx, info)}
                          onClick={() => enterDayEdit(dayData)}
                          className={cn(
                            "w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center cursor-pointer transition-colors duration-300 relative z-10",
                            hasData 
                              ? "bg-white/10 backdrop-blur-md text-white hover:bg-white/20" 
                              : "bg-surface text-muted hover:border-white/30",
                            isWiggleMode ? "border-dashed border-2 border-white/40" : "border-solid border border-white/20"
                          )}
                          style={{ borderRadius: '9999px', boxShadow: hasData ? '0 0 20px rgba(255,255,255,0.1)' : 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
                        >
                          {/* Floating Balloon during Drag */}
                          <AnimatePresence>
                            {draggedDayIdx === dayOfWeekIdx && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                className="absolute -top-16 bg-accentOrange text-white font-bold px-4 py-2 rounded-full shadow-[0_10px_20px_rgba(255,159,10,0.5)] whitespace-nowrap z-[10000] pointer-events-none"
                              >
                                {tagLabel}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Refined Sets Counter */}
                          {totalSets > 0 && draggedDayIdx !== dayOfWeekIdx && (
                            <div className="absolute -top-2 -right-2 bg-black/80 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-full z-20 pointer-events-none shadow-lg" style={{ borderRadius: '9999px' }}>
                              <span className="text-[10px] font-bold text-white/90 whitespace-nowrap">{totalSets} serie</span>
                            </div>
                          )}

                          <AnimatePresence mode="wait">
                            <motion.div
                              key={draggedDayIdx === dayOfWeekIdx ? 'dragged' : (dayData?.tags?.join(',') || 'empty')}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                              className="flex flex-col items-center justify-center w-full h-full pointer-events-none"
                            >
                              {draggedDayIdx === dayOfWeekIdx ? (
                                <span className="font-bold text-xs sm:text-sm tracking-widest text-accentOrange uppercase text-center leading-tight">
                                  Sposta
                                </span>
                              ) : (
                                <>
                                  <span className="font-black text-xl sm:text-2xl tracking-tighter">{DAY_LABELS[dayOfWeekIdx]}</span>
                                  <span className="text-[9px] font-bold mt-0.5 uppercase tracking-widest opacity-60">{DAY_NAMES[dayOfWeekIdx].substring(0, 3)}</span>
                                </>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </motion.div>
                        
                        {isWiggleMode && hasData && (
                          <motion.button 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            onClick={(e) => { e.stopPropagation(); resetDay(dayOfWeekIdx); }} 
                            className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white border-2 border-black z-30 shadow-lg active:scale-95 transition-transform"
                          >
                            <Minus size={14}/>
                          </motion.button>
                        )}

                        <AnimatePresence mode="wait">
                          <motion.div 
                            key={tagLabel}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => { setDayToTag(dayData); setIsTagOverlayOpen(true); }}
                            className={cn(
                              "absolute -bottom-6 cursor-pointer z-20 px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center shadow-lg transition-transform active:scale-95 hover:bg-white/20 whitespace-nowrap",
                              hasData ? "border border-white/20 backdrop-blur-md" : "bg-transparent text-muted",
                              tagLabel === 'Tag da assegnare' ? "text-accentOrange border-accentOrange/50 bg-accentOrange/10" : (hasData ? "text-white bg-white/15" : "")
                            )}
                            style={{ borderRadius: '9999px' }}
                          >
                            {tagLabel} <ChevronRight size={10} className="ml-1 opacity-50" />
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              ))}
           </div>
           
           <p className="text-center text-muted text-xs sm:text-sm mt-16 max-w-xs px-4">
             {isWiggleMode 
               ? "Trascina per scambiare i giorni. Premi Fatto per terminare." 
               : "Tieni premuto un cerchio per riordinare. Tocca per programmare."}
           </p>
        </div>

        {/* Bin Overlay */}
        <AnimatePresence>
          {isBinOverlayOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBinOverlayOpen(false)} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-surface/95 backdrop-blur-xl rounded-t-[32px] p-6 pb-12 border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 max-h-[80vh] flex flex-col">
                 <div className="flex justify-between items-center mb-6 shrink-0">
                   <h3 className="font-bold text-xl">Esercizi Non Assegnati</h3>
                   <button onClick={() => setIsBinOverlayOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><X size={16}/></button>
                 </div>
                 <div className="flex-1 overflow-y-auto space-y-3 hide-scrollbar">
                   {activePlan.unassigned.map(ex => (
                     <div key={ex.id} className="bg-black/50 p-4 rounded-2xl border border-border/50 flex flex-col space-y-3">
                       <div className="font-bold text-sm">{ex.exerciseName}</div>
                       <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-1">
                         {DAY_NAMES.map((d, i) => (
                           <button key={i} onClick={() => assignBinExercise(ex.id, i)} className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold shrink-0 hover:bg-accentOrange hover:text-white transition-colors">{d.substring(0,3)}</button>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Tag Overlay */}
        <AnimatePresence>
          {isTagOverlayOpen && dayToTag && (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsTagOverlayOpen(false)} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-surface/95 backdrop-blur-xl rounded-t-[32px] p-6 pb-12 border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-xl">Target Muscolare</h3>
                   <button onClick={() => setIsTagOverlayOpen(false)} className="text-white font-bold bg-white/10 px-6 py-2 rounded-full hover:bg-white/20 active:scale-95 transition-all">Fine</button>
                 </div>
                 <p className="text-sm text-muted mb-6">Seleziona i target per <strong className="text-white">{DAY_NAMES[dayToTag.dayOfWeek]}</strong>. Puoi sceglierne più di uno.</p>
                 <div className="flex flex-wrap gap-2">
                   {AVAILABLE_TAGS.map(t => {
                     const isSelected = dayToTag.tags?.includes(t);
                     return (
                       <button 
                         key={t}
                         onClick={() => {
                           const currentTags = dayToTag.tags || [];
                           const newTags = isSelected ? currentTags.filter(tag => tag !== t) : [...currentTags, t];
                           updateDayTags(dayToTag.id, newTags);
                           setDayToTag({...dayToTag, tags: newTags});
                         }}
                         className={cn(
                           "px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase transition-all active:scale-95 border",
                           isSelected ? "bg-accentBlue text-white border-accentBlue shadow-[0_0_15px_rgba(10,132,255,0.4)]" : "bg-black text-muted border-border hover:border-white/50"
                         )}
                       >
                         {t}
                       </button>
                     )
                   })}
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    );
  }

  // --- FULLSCREEN DAY EDIT VIEW (Shared Element) ---
  const totalDayVolume = calculateVolume(activeDay.exercises);
  const totalEstimatedMinutes = (() => {
    const exs = activeDay.exercises;
    let totalSecs = 0;
    exs.forEach(ex => {
      const numSets = ex.isExpanded && ex.setDetails ? ex.setDetails.length : (parseInt(ex.sets) || 0);
      totalSecs += numSets * 60;
      if (ex.restTime) totalSecs += (parseInt(ex.restTime) || 0) * numSets;
    });
    return Math.round(totalSecs / 60);
  })();
  const dbSearchLower = dbSearch.toLowerCase().trim();
  const dayTags = activeDay.tags || [];
  const filteredDbExercises = EXERCISE_DB.filter(ex => {
    if (dbSearchLower) return ex.name.toLowerCase().includes(dbSearchLower) || ex.tags.some(t => t.toLowerCase().includes(dbSearchLower));
    if (isDbFilterActive && dayTags.length > 0) return ex.tags.some(t => dayTags.includes(t));
    return true; 
  });
  // Destructure pickerConfig so spread never overrides explicit isOpen prop
  const { isOpen: _pickerIsOpen, type: _pickerType, ...restPickerConfig } = pickerConfig;

  return (
    <motion.div 
      layoutId={`honeycomb-day-${activeDay.dayOfWeek}`} 
      className="absolute inset-0 bg-black z-50 p-4 md:p-6 pb-32 space-y-6 overflow-y-auto hide-scrollbar flex flex-col"
      initial={{ borderRadius: '9999px' }}
      animate={{ borderRadius: '0px' }}
      exit={{ borderRadius: '9999px' }}
      style={{ originX: 0.5, originY: 0.5 }}
    >
      <SingleScrollPicker 
        isOpen={pickerConfig.isOpen && pickerConfig.type === 'single'} 
        onClose={() => setPickerConfig({ ...pickerConfig, isOpen: false })} 
        {...restPickerConfig} 
      />
      <WeightScrollPicker 
        isOpen={pickerConfig.isOpen && pickerConfig.type === 'weight'} 
        onClose={() => setPickerConfig({ ...pickerConfig, isOpen: false })} 
        {...restPickerConfig} 
      />
      <TimeScrollPicker 
        isOpen={pickerConfig.isOpen && pickerConfig.type === 'time'} 
        onClose={() => setPickerConfig({ ...pickerConfig, isOpen: false })} 
        {...restPickerConfig} 
      />
      <NotesModal
        isOpen={notesModalConfig.isOpen}
        onClose={() => setNotesModalConfig(p => ({ ...p, isOpen: false }))}
        initialValue={notesModalConfig.value}
        onSave={(text) => updateWorkout(notesModalConfig.workoutId, { notes: text })}
      />


      <header className="sticky top-0 z-30 pt-6 pb-4 bg-black/90 backdrop-blur-md border-b border-border/50 flex items-center space-x-4 shrink-0">
        <button onClick={handleDayExit} className="w-10 h-10 shrink-0 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold tracking-tight truncate text-accentOrange">{activePlan.name}</h1>
          <div className="flex items-center space-x-2">
            <p className="text-xl font-bold truncate">{DAY_NAMES[activeDay.dayOfWeek]}</p>
            {dayTags.map((t, i) => <span key={i} className="text-[9px] uppercase font-bold px-2 py-0.5 bg-accentOrange/20 text-accentOrange rounded-full" style={{ borderRadius: '9999px' }}>{t}</span>)}
          </div>
        </div>
      </header>

      {/* DRAFT SELECTION MODE */}
      {dayMode === 'select' && (
        <>
          <section className="bg-surface/50 border border-border/50 rounded-[32px] p-2 backdrop-blur-md shadow-soft shrink-0 mb-6">
            <div className="flex space-x-1 mb-4 p-1 bg-black/40 rounded-full overflow-x-auto hide-scrollbar">
                {['database', 'manual', 'ai'].map((mode) => (
                  <button key={mode} onClick={() => setInputMode(mode)} className={cn("flex-1 py-2.5 px-4 rounded-full text-xs font-semibold capitalize transition-all duration-300 flex justify-center items-center space-x-2 shrink-0", inputMode === mode ? "bg-white text-black shadow-sm" : "text-muted hover:text-white")} style={{ borderRadius: '9999px' }}>
                    {mode === 'database' && <Library size={14} />}
                    {mode === 'manual' && <Plus size={14} />}
                    {mode === 'ai' && <BrainCircuit size={14} />}
                    <span>{mode}</span>
                  </button>
                ))}
            </div>
            
            <div className="p-4">
               {inputMode === 'database' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input type="text" placeholder="Cerca esercizio..." value={dbSearch} onChange={e => setDbSearch(e.target.value)} className="w-full bg-black/50 border border-border rounded-3xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accentOrange/50 transition-all placeholder:text-muted/60" />
                      {dbSearch && <button onClick={() => setDbSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-white"><X size={16}/></button>}
                    </div>

                    {!dbSearch && dayTags.length > 0 && (
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center space-x-2">
                           <Tag size={14} className="text-accentOrange" />
                           <span className="text-xs font-bold text-muted uppercase tracking-widest">Filtro Smart</span>
                        </div>
                        {isDbFilterActive ? (
                           <button onClick={() => setIsDbFilterActive(false)} className="text-xs font-bold text-accentBlue bg-accentBlue/10 px-3 py-1 flex items-center" style={{ borderRadius: '9999px' }}><X size={12} className="mr-1"/> Libera Tutti</button>
                        ) : (
                           <button onClick={() => setIsDbFilterActive(true)} className="text-xs font-bold text-muted bg-white/5 px-3 py-1 border border-border" style={{ borderRadius: '9999px' }}>Riattiva Filtro</button>
                        )}
                      </div>
                    )}

                    <div className="max-h-[300px] overflow-y-auto space-y-2 hide-scrollbar mt-2 pr-1 pb-10">
                       {filteredDbExercises.length > 0 ? (
                         filteredDbExercises.map(ex => {
                           const isSelected = draftExercises.some(d => d.exerciseName === ex.name);
                           return (
                             <div key={ex.id} onClick={() => handleDraftToggle(ex)} className={cn("flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border", isSelected ? "bg-accentBlue/10 border-accentBlue shadow-[0_0_15px_rgba(10,132,255,0.2)]" : "bg-surface border-border/50 hover:border-accentOrange/50")}>
                               <div>
                                 <h4 className="font-bold text-sm">{ex.name}</h4>
                                 <div className="flex gap-1 mt-1">{ex.tags.map(t => <span key={t} className="text-[8px] uppercase tracking-widest text-muted bg-black px-1.5 py-0.5 rounded-sm">{t}</span>)}</div>
                               </div>
                               <button className={cn("w-8 h-8 flex items-center justify-center transition-colors", isSelected ? "bg-accentBlue text-white" : "bg-white/5 text-muted hover:bg-white/10")} style={{ borderRadius: '9999px' }}>
                                 {isSelected ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                               </button>
                             </div>
                           )
                         })
                       ) : (
                         <div className="text-center py-8">
                           <p className="text-muted text-sm mb-4">Nessun esercizio trovato.</p>
                           <button onClick={() => { setFormData({...formData, exerciseName: dbSearch}); setInputMode('manual'); }} className="px-6 py-3 bg-white text-black font-bold text-sm" style={{ borderRadius: '9999px' }}>Aggiungi Manualmente</button>
                         </div>
                       )}
                    </div>
                  </div>
               )}

               {inputMode === 'manual' && (
                  <form onSubmit={handleDraftManual} className="space-y-4">
                    <input type="text" placeholder="Esercizio (es. Panca Piana)" value={formData.exerciseName} onChange={(e) => setFormData({...formData, exerciseName: e.target.value})} className="w-full bg-black/50 border border-border rounded-3xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accentOrange/50 transition-all placeholder:text-muted/60" />
                    <button type="submit" className="w-full bg-white text-black font-semibold rounded-3xl py-4 flex items-center justify-center space-x-2"><Plus size={18} /><span>Aggiungi alla Bozza</span></button>
                  </form>
               )}

               {inputMode === 'ai' && (
                  <div className="space-y-4">
                     <textarea value={aiText} onChange={(e) => setAiText(e.target.value)} placeholder="Incolla qui la tua scheda..." className="w-full bg-black/50 border border-border rounded-3xl px-5 py-5 text-sm focus:outline-none min-h-[140px] resize-none" />
                     <div className="flex space-x-3">
                       <button onClick={handleDraftAi} className="flex-1 bg-accentOrange text-white font-semibold rounded-3xl py-4 flex items-center justify-center space-x-2"><BrainCircuit size={18} /><span>Genera Bozza</span></button>
                       <input type="file" ref={fileInputRef} onChange={handleVisionParsing} accept="image/*" className="hidden" />
                       <button onClick={() => fileInputRef.current?.click()} className="w-14 bg-white/5 border border-border rounded-3xl flex items-center justify-center text-white hover:bg-white/10 transition-all"><Camera size={20}/></button>
                     </div>
                   </div>
               )}
            </div>
          </section>

          {/* Selection Bar */}
          <AnimatePresence>
            {draftExercises.length > 0 && (
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 p-4 bg-surface/95 backdrop-blur-xl border-t border-border z-40 pb-safe">
                <div className="flex items-center justify-between max-w-sm mx-auto">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted font-bold uppercase tracking-widest">In Bozza</span>
                    <span className="text-xl font-bold">{draftExercises.length} Esercizi</span>
                  </div>
                  <button onClick={confirmSelection} className="bg-white text-black font-bold px-8 py-3 flex items-center shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95" style={{ borderRadius: '9999px' }}>
                    Avanti <MoveRight size={18} className="ml-2"/>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* REFINEMENT MODE (The Lab) */}
      {dayMode === 'refine' && (
        <div className="flex flex-col flex-1 h-full relative">
          
          <section className="bg-gradient-to-br from-surface to-[#0A0A0A] border border-border/50 rounded-[32px] p-6 shadow-soft flex justify-between items-center relative overflow-hidden group shrink-0 mb-6">
            <div className="absolute inset-0 bg-accentOrange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex gap-8 relative z-10">
              <div>
                <p className="text-sm text-muted font-medium mb-1">Volume Previsto</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-bold tracking-tighter">{totalDayVolume.toLocaleString()}</span>
                  <span className="text-muted font-medium text-sm">kg</span>
                </div>
              </div>
              <div className="w-px bg-white/10 self-stretch"></div>
              <div>
                <p className="text-sm text-muted font-medium mb-1">Tempo Stimato</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-bold tracking-tighter">{totalEstimatedMinutes}</span>
                  <span className="text-muted font-medium text-sm">min</span>
                </div>
              </div>
            </div>
            <div className="w-14 h-14 bg-accentOrange/10 flex items-center justify-center border border-accentOrange/20 shadow-[0_0_20px_rgba(255,159,10,0.15)]" style={{ borderRadius: '9999px' }}>
              <Dumbbell className="text-accentOrange" size={24} />
            </div>
          </section>

          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">Laboratorio</h2>
              <p className="text-muted text-sm">{activeDay.exercises.length} Esercizi Programmati</p>
              {dayTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {dayTags.map((t, i) => (
                    <span key={i} className="text-[9px] uppercase font-bold px-2 py-0.5 bg-accentOrange/15 text-accentOrange border border-accentOrange/30" style={{ borderRadius: '9999px' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <AnimatePresence mode="wait">
                {isReorderMode ? (
                  <motion.button
                    key="fatto"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setIsReorderMode(false)}
                    className="px-5 py-2 text-xs font-bold bg-accentBlue text-white border border-accentBlue shadow-[0_0_15px_rgba(10,132,255,0.4)] active:scale-95 transition-all"
                    style={{ borderRadius: '9999px' }}
                  >
                    Fatto
                  </motion.button>
                ) : (
                  <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex space-x-2">
                    <button
                      onClick={() => setDayMode('select')}
                      className="text-xs font-bold text-accentOrange bg-accentOrange/10 px-4 py-2 border border-accentOrange/30 hover:bg-accentOrange/20 active:scale-95 transition-all flex items-center"
                      style={{ borderRadius: '9999px' }}
                    >
                      <Plus size={14} className="mr-1"/> Aggiungi
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-4 pb-32">
            {activeDay.exercises.length === 0 && (
              <div className="text-center py-10 border border-dashed border-border rounded-3xl text-muted">Nessun esercizio nel laboratorio.</div>
            )}
            
            <Reorder.Group
              axis="y"
              values={activeDay.exercises}
              onReorder={updateExercisesList}
              className="space-y-3"
              style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
            >
              {activeDay.exercises.map((workout, idx) => {
                const isCollapsed = collapsedCards[workout.id];
                const forceCollapsed = isReorderMode;
                const isDragging = draggedWorkoutId === workout.id;
                return (
                  <Reorder.Item
                    key={workout.id}
                    value={workout}
                    dragListener={isReorderMode}
                    onDragStart={() => { setDraggedWorkoutId(workout.id); if (navigator.vibrate) navigator.vibrate(20); }}
                    onDragEnd={() => setDraggedWorkoutId(null)}
                    whileDrag={{ scale: 1.05, zIndex: 9999, transition: { duration: 0 } }}
                    animate={{ scale: 1, zIndex: 0 }}
                    transition={{ type: 'spring', stiffness: 800, damping: 40, mass: 0.5 }}
                    className="relative"
                    style={{ originX: 0.5, originY: 0.5 }}
                  >
                    <motion.div
                      variants={wiggleVariants}
                      animate={isReorderMode && !isDragging ? 'animate' : 'idle'}
                      className={cn(
                        "bg-surface border rounded-[32px] overflow-hidden shadow-soft flex flex-col relative z-0 transition-colors",
                        isReorderMode ? "border-dashed border-2 border-white/40 cursor-grab active:cursor-grabbing" : "border-border"
                      )}
                    >
                      {/* Header Esercizio */}
                      <div
                        className={cn("p-5 flex items-center justify-between border-b border-border/50 bg-white/5 transition-colors", !isReorderMode && "cursor-pointer hover:bg-white/10")}
                        onClick={() => !isReorderMode && toggleCollapse(workout.id)}
                        onPointerDown={(e) => { e.stopPropagation(); handleExercisePointerDown(workout.id); }}
                        onPointerUp={handleExercisePointerUp}
                        onPointerMove={handleExercisePointerUp}
                        onPointerLeave={handleExercisePointerUp}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {isReorderMode && <GripVertical size={18} className="text-muted shrink-0" />}
                          <span className="text-muted font-bold w-6 text-right text-lg shrink-0">{idx + 1}.</span>
                          <div className="min-w-0">
                            <h3 className="font-bold text-lg leading-tight truncate">
                              {workout.exerciseName}
                              {isReorderMode && (
                                <span className="text-muted font-normal text-base ml-2">
                                  ({workout.isExpanded && workout.setDetails ? workout.setDetails.length : (parseInt(workout.sets) || 0)} serie)
                                </span>
                              )}
                            </h3>
                            {workout.isExpanded && !forceCollapsed && !isCollapsed && (
                              <span className="text-[10px] font-bold text-accentOrange uppercase tracking-widest bg-accentOrange/10 px-2 py-0.5 inline-block mt-1" style={{ borderRadius: '9999px' }}>Avanzato</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          {!isReorderMode && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); removeWorkout(workout.id); }} className="text-muted hover:text-red-400 p-2"><Trash2 size={16}/></button>
                              <div className="p-2 text-muted">{(isCollapsed) ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}</div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Body — nascosto in wiggle mode */}
                      {!forceCollapsed && !isCollapsed && (
                        <div className="p-5">
                          {!workout.isExpanded ? (
                            <div className="flex flex-col space-y-4">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
                                  <span className="absolute left-3 top-3 text-[10px] text-muted font-bold uppercase pointer-events-none">Set</span>
                                  <div onClick={() => openSinglePicker('Set', SETS_OPTIONS, workout.sets || 3, '', (val) => updateWorkout(workout.id, {sets: val}))} className="w-full bg-black/50 border border-border rounded-2xl pl-10 pr-2 py-3 text-sm focus:outline-none hover:border-accentOrange font-mono cursor-pointer flex items-center h-12 transition-colors">{workout.sets || 3}</div>
                                </div>
                                <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
                                  <span className="absolute left-3 top-3 text-[10px] text-muted font-bold uppercase pointer-events-none">Rep</span>
                                  <div onClick={() => openSinglePicker('Ripetizioni', REPS_OPTIONS, workout.reps || 10, '', (val) => updateWorkout(workout.id, {reps: val}))} className="w-full bg-black/50 border border-border rounded-2xl pl-10 pr-2 py-3 text-sm focus:outline-none hover:border-accentOrange font-mono cursor-pointer flex items-center h-12 transition-colors">{workout.reps || 10}</div>
                                </div>
                                <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
                                  <span className="absolute left-3 top-3 text-[10px] text-muted font-bold uppercase pointer-events-none">Kg</span>
                                  <div onClick={() => openWeightPicker('Carico (Kg)', workout.weight || 0, (val) => updateWorkout(workout.id, {weight: val}))} className="w-full bg-black/50 border border-border rounded-2xl pl-8 pr-2 py-3 text-sm focus:outline-none hover:border-accentOrange font-mono cursor-pointer flex items-center h-12 transition-colors">{workout.weight || 0}</div>
                                </div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); expandToAdvanced(workout.id); }} onPointerDown={(e) => e.stopPropagation()} className="w-full py-2.5 text-xs font-bold text-accentBlue bg-accentBlue/10 rounded-2xl flex justify-center items-center hover:bg-accentBlue/20 transition-colors">
                                <Settings2 size={14} className="mr-2"/> Dettaglio Serie Singole
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="flex flex-col space-y-3 p-2 rounded-3xl"
                              onPointerDown={(e) => { e.stopPropagation(); handleSetPointerDown(workout.id); }}
                              onPointerUp={handleExercisePointerUp}
                              onPointerMove={handleExercisePointerUp}
                              onPointerLeave={handleExercisePointerUp}
                            >
                              <div className="flex text-[10px] uppercase font-bold text-muted px-2 mb-1">
                                <div className="w-8 text-center">Set</div>
                                <div className="w-10 text-center">Warm</div>
                                <div className="flex-1 text-center">Reps</div>
                                <div className="flex-1 text-center">Kg</div>
                                <div className="w-8"></div>
                              </div>
                              {workout.setDetails.map((set, sIdx) => (
                                <div key={set.id} className={cn("flex items-center space-x-2 p-2 rounded-2xl border transition-colors", set.isWarmup ? "bg-accentOrange/5 border-accentOrange/20" : "bg-black/30 border-border")}>
                                  <div className="w-8 text-center font-bold text-muted">{sIdx + 1}</div>
                                  <div className="w-10 flex justify-center" onPointerDown={(e) => e.stopPropagation()}>
                                    <button onClick={() => updateDetailedRow(workout.id, set.id, 'isWarmup', !set.isWarmup)} className={cn("w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] transition-colors", set.isWarmup ? "bg-accentOrange text-white" : "bg-white/10 text-muted")}>W</button>
                                  </div>
                                  <div className="flex-1" onPointerDown={(e) => e.stopPropagation()}>
                                    <div onClick={() => openSinglePicker('Ripetizioni', REPS_OPTIONS, set.reps, '', (val) => updateDetailedRow(workout.id, set.id, 'reps', val))} className="w-full h-9 bg-black/50 border border-border/50 rounded-lg flex items-center justify-center font-mono text-sm cursor-pointer hover:border-white/30 transition-colors">{set.reps}</div>
                                  </div>
                                  <div className="flex-1" onPointerDown={(e) => e.stopPropagation()}>
                                    <div onClick={() => openWeightPicker('Carico (Kg)', set.weight, (val) => updateDetailedRow(workout.id, set.id, 'weight', val))} className="w-full h-9 bg-black/50 border border-border/50 rounded-lg flex items-center justify-center font-mono text-sm cursor-pointer hover:border-white/30 transition-colors">{set.weight}</div>
                                  </div>
                                  <div className="w-8 flex justify-center" onPointerDown={(e) => e.stopPropagation()}>
                                    <button onClick={() => removeDetailedRow(workout.id, set.id)} className="text-muted hover:text-red-400"><X size={14}/></button>
                                  </div>
                                </div>
                              ))}
                              <div className="flex space-x-2 pt-2">
                                <button onClick={() => addDetailedRow(workout.id)} className="flex-1 py-2 text-xs font-bold text-muted bg-white/5 rounded-xl border border-dashed border-border flex justify-center items-center hover:text-white transition-colors">
                                  <Plus size={14} className="mr-1"/> Nuova Serie
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border/30">
                                <div className="relative cursor-pointer" onPointerDown={(e) => e.stopPropagation()} onClick={() => openTimePicker('Recupero', workout.restTime || 0, (val) => updateWorkout(workout.id, {restTime: val}))}>
                                  <Timer size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                  <div className="w-full bg-black/30 border border-border rounded-xl pl-9 pr-3 py-2 text-xs hover:border-white/50 transition-colors flex items-center h-9 text-muted/80">
                                    {workout.restTime ? `${Math.floor(workout.restTime / 60)}m ${workout.restTime % 60}s` : 'Recupero...'}
                                  </div>
                                </div>
                                <button
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={() => setNotesModalConfig({ isOpen: true, workoutId: workout.id, value: workout.notes || '' })}
                                  className={cn(
                                    "relative w-full bg-black/30 border rounded-xl pl-9 pr-3 py-2 text-xs h-9 flex items-center transition-colors hover:border-white/30 active:scale-95",
                                    workout.notes ? "border-accentOrange/40 text-accentOrange" : "border-border text-muted/60"
                                  )}
                                >
                                  <NotebookPen size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
                                  <span className="truncate">{workout.notes || 'Note tecniche...'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
            
          </div>

          {!isReorderMode && (
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-center z-40 pb-safe">
              <button onClick={() => setRoute('plan-details')} className="w-full max-w-sm bg-accentOrange text-white font-bold text-lg py-4 shadow-[0_0_30px_rgba(255,159,10,0.4)] hover:opacity-90 transition-all active:scale-95 flex items-center justify-center" style={{ borderRadius: '9999px' }}>
                <CheckCircle2 size={20} className="mr-2"/> Fatto
              </button>
            </div>
          )}
        </div>
      )}

      {/* EXERCISE FOCUS MODE OVERLAY */}
      <AnimatePresence>
        {isExerciseFocusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-6 touch-none"
          >
            <div className="flex flex-col space-y-2 mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Ordina Esercizi</h2>
              <p className="text-muted text-sm">Trascina per cambiare l'ordine cronologico</p>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">
              <Reorder.Group
                axis="y"
                values={activeDay.exercises}
                onReorder={(newList) => {
                  if (JSON.stringify(newList) !== JSON.stringify(activeDay.exercises)) {
                    if (navigator.vibrate) navigator.vibrate(20);
                  }
                  updateExercisesList(newList);
                }}
                className="space-y-4"
              >
                {activeDay.exercises.map((workout, idx) => (
                  <Reorder.Item
                    key={workout.id}
                    value={workout}
                    whileDrag={{ scale: 1.05, zIndex: 9999 }}
                    animate={{ scale: 1, zIndex: 0 }}
                    transition={{ duration: 0 }}
                    className="relative"
                  >
                    <div className="bg-surface border-2 border-dashed border-white/40 rounded-[28px] p-5 flex items-center space-x-4">
                      <GripVertical size={20} className="text-muted shrink-0" />
                      <span className="text-muted font-bold w-6 text-right text-lg shrink-0">{idx + 1}.</span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg leading-tight truncate">{workout.exerciseName}</h3>
                        <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">
                          {workout.isExpanded && workout.setDetails ? workout.setDetails.length : (parseInt(workout.sets) || 0)} serie
                        </p>
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>

            <div className="absolute bottom-10 left-0 right-0 flex justify-center px-6">
              <button 
                onClick={() => setIsExerciseFocusMode(false)}
                className="w-full max-w-sm bg-accentOrange text-white font-bold text-lg py-4 shadow-[0_0_30px_rgba(255,159,10,0.4)] active:scale-95 transition-all flex items-center justify-center"
                style={{ borderRadius: '9999px' }}
              >
                Fatto
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SET FOCUS MODE OVERLAY */}
      <AnimatePresence>
        {isSetFocusMode && focusExerciseId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-6 touch-none"
          >
            {(() => {
              const workout = activeDay.exercises.find(ex => ex.id === focusExerciseId);
              if (!workout) return null;
              return (
                <>
                  <div className="flex flex-col space-y-2 mb-8">
                    <h2 className="text-2xl font-bold tracking-tight truncate">{workout.exerciseName}</h2>
                    <p className="text-muted text-sm">Sposta le serie per cambiare la sequenza</p>
                  </div>

                  <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">
                    <Reorder.Group
                      axis="y"
                      values={workout.setDetails}
                      onReorder={(newSets) => {
                        if (JSON.stringify(newSets) !== JSON.stringify(workout.setDetails)) {
                          if (navigator.vibrate) navigator.vibrate(20);
                        }
                        updateWorkout(workout.id, { setDetails: newSets });
                      }}
                      className="space-y-3"
                    >
                      {workout.setDetails.map((set, sIdx) => (
                        <Reorder.Item
                          key={set.id}
                          value={set}
                          whileDrag={{ scale: 1.05, zIndex: 9999 }}
                          animate={{ scale: 1, zIndex: 0 }}
                          transition={{ duration: 0 }}
                          className="relative"
                        >
                          <div className={cn(
                            "flex items-center space-x-4 p-4 rounded-2xl border-2 border-dashed transition-all",
                            set.isWarmup ? "bg-accentOrange/10 border-accentOrange/30" : "bg-white/5 border-white/20"
                          )}>
                            <GripVertical size={18} className="text-muted shrink-0" />
                            <div className="w-8 text-center font-bold text-muted text-lg">{sIdx + 1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", set.isWarmup ? "bg-accentOrange text-white" : "bg-white/10 text-muted")}>
                                  {set.isWarmup ? 'Warm' : 'Work'}
                                </span>
                                <span className="font-mono text-white text-lg">{set.reps} x {set.weight}kg</span>
                              </div>
                            </div>
                          </div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>

                  <div className="absolute bottom-10 left-0 right-0 flex justify-center px-6">
                    <button 
                      onClick={() => setIsSetFocusMode(false)}
                      className="w-full max-w-sm bg-accentOrange text-white font-bold text-lg py-4 shadow-[0_0_30px_rgba(255,159,10,0.4)] active:scale-95 transition-all flex items-center justify-center"
                      style={{ borderRadius: '9999px' }}
                    >
                      Fatto
                    </button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
