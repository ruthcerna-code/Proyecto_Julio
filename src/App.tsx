import React, { useState, useEffect } from 'react';
import { UserProfile, DailyLog, ChatMessage, MenstrualPhase } from './types';
import Onboarding from './components/Onboarding';
import CalendarView from './components/CalendarView';
import DailyCheckin from './components/DailyCheckin';
import ChatPanel from './components/ChatPanel';
import HealthProfileModal from './components/HealthProfileModal';
import SymptomChart from './components/SymptomChart';
import { getCycleDay, getPhaseForDay, formatDateStr, formatFriendlyDate, PHASE_DETAILS } from './utils/cycle';
import { generateActivityForDay } from './utils/activity';

const SCALE_LABELS = {
  sleep: ["Excelente", "Buena", "Regular", "Mala", "Muy mala"],
  fatigue: ["Ninguna", "Leve", "Moderada", "Alta", "Extrema"],
  pain: ["Ninguno", "Leve", "Moderado", "Alto", "Muy alto"],
  stress: ["Muy bajo", "Bajo", "Moderado", "Alto", "Muy alto"],
  mood: ["Muy feliz", "Bien", "Neutral", "Triste", "Muy triste"]
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(formatDateStr(new Date()));
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');
  const [isSidebarChatOpen, setIsSidebarChatOpen] = useState(true);
  const [isEditingHealth, setIsEditingHealth] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('cyclia_profile');
      const storedLogs = localStorage.getItem('cyclia_logs');
      const storedChat = localStorage.getItem('cyclia_chat');

      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      }
      if (storedChat) {
        setChatHistory(JSON.parse(storedChat));
      }
    } catch (e) {
      console.error("Error al cargar local storage:", e);
    }
  }, []);

  // Sync profile to local storage
  const handleSaveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('cyclia_profile', JSON.stringify(newProfile));
    
    // Automatically trigger a welcome chat message from Cyclia
    const welcomeMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `🌸 ¡Hola ${newProfile.name}! He registrado con éxito tu perfil en Cyclia.\n\nHe calculado tu ciclo biológico basándome en tu última fecha menstrual (${newProfile.lastPeriodDate}).\n\nTu calendario ya está actualizado con tus fases. ¿En qué puedo ayudarte hoy?`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
    const updatedHistory = [welcomeMsg];
    setChatHistory(updatedHistory);
    localStorage.setItem('cyclia_chat', JSON.stringify(updatedHistory));
  };

  // Sync logs to local storage
  const handleSaveLog = (log: DailyLog) => {
    // Clear old AI analysis to ensure a brand-new analysis is generated and the loading spinner displays
    const logWithClearedAnalysis = { ...log, aiAnalysis: undefined };
    const updatedLogs = { ...logs, [log.date]: logWithClearedAnalysis };
    setLogs(updatedLogs);
    localStorage.setItem('cyclia_logs', JSON.stringify(updatedLogs));
    setIsCheckinOpen(false);
    
    // Show a quick toast notification
    setNotificationMsg("¡Registro guardado! Generando nuevo análisis...");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);

    // Trigger AI analysis with the cleared log
    triggerAiAnalysis(logWithClearedAnalysis, updatedLogs);

    // Automatically open the analysis modal to show the progress spinner
    setIsAnalysisOpen(true);
  };

  // Automatically trigger AI Analysis after check-in for deep insights
  const triggerAiAnalysis = async (currentLog: DailyLog, allLogs: Record<string, DailyLog>) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          log: currentLog,
          history: Object.values(allLogs)
            .filter(l => l.date !== currentLog.date)
            .slice(-4) // Send recent 4 logs
        })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedLog = { ...currentLog, aiAnalysis: data.analysis };
        const updatedLogs = { ...allLogs, [currentLog.date]: updatedLog };
        setLogs(updatedLogs);
        localStorage.setItem('cyclia_logs', JSON.stringify(updatedLogs));
      }
    } catch (err) {
      console.error("Error auto-generando análisis IA:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Request analysis manually if cached analysis is empty
  const handleRequestAnalysisManually = async () => {
    const activeLog = logs[selectedDateStr];
    if (!activeLog) return;

    setIsAnalyzing(true);
    setAnalysisError('');
    setIsAnalysisOpen(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          log: activeLog,
          history: Object.values(logs)
            .filter(l => l.date !== selectedDateStr)
            .slice(-4)
        })
      });

      if (!response.ok) {
        throw new Error("No se pudo obtener el análisis. Verifica tu conexión.");
      }

      const data = await response.json();
      const updatedLog = { ...activeLog, aiAnalysis: data.analysis };
      const updatedLogs = { ...logs, [selectedDateStr]: updatedLog };
      setLogs(updatedLogs);
      localStorage.setItem('cyclia_logs', JSON.stringify(updatedLogs));
    } catch (err: any) {
      setAnalysisError(err.message || "Error al conectar con la IA de Cyclia.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Chat message callback
  const handleAddMessage = (msg: ChatMessage) => {
    const updatedHistory = [...chatHistory, msg];
    setChatHistory(updatedHistory);
    localStorage.setItem('cyclia_chat', JSON.stringify(updatedHistory));
  };

  // Clear Chat History
  const handleClearHistory = () => {
    if (confirm("¿Estás segura de que deseas limpiar la conversación actual con Cyclia?")) {
      setChatHistory([]);
      localStorage.removeItem('cyclia_chat');
    }
  };

  // Reset all app data (useful for testing)
  const handleResetAppData = () => {
    if (confirm("⚠️ ¿Deseas eliminar todo tu perfil y registros históricos para empezar de nuevo?")) {
      localStorage.clear();
      setProfile(null);
      setLogs({});
      setChatHistory([]);
      setSelectedDateStr(formatDateStr(new Date()));
    }
  };

  // Load 15 days of authentic, phase-aligned historical logs for testing the graph
  const handleLoadDemoData = () => {
    if (!profile) return;
    
    const demoLogs: Record<string, DailyLog> = {};
    const today = new Date();
    
    // Generate logs for the last 15 days to make a gorgeous chart curve!
    for (let i = 15; i >= 1; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = formatDateStr(date);
      
      const cycleDay = getCycleDay(dateStr, profile.lastPeriodDate, profile.cycleLength);
      const phase = getPhaseForDay(cycleDay, profile.periodLength, profile.cycleLength);
      
      let sleepQuality = 2;
      let fatigue = 2;
      let pain = 1;
      let stress = 2;
      let mood = 2;
      let behavior = '';
      
      if (phase === 'Menstrual') {
        sleepQuality = 4; // Mala
        fatigue = 4; // Fuerte fatigue
        pain = 4; // Alto dolor
        stress = 3; // Moderado stress
        mood = 4; // Triste
        behavior = "Hice estiramientos suaves y yoga restaurativo, tomé una infusión de manzanilla caliente y dormí temprano para calmar los cólicos menstruales.";
      } else if (phase === 'Folicular') {
        sleepQuality = 1; // Excelente
        fatigue = 1; // Ninguna fatigue
        pain = 1; // Ninguno
        stress = 1; // Muy bajo
        mood = 1; // Muy feliz
        behavior = "Hice entrenamiento de fuerza pesada, comí alimentos ricos en hierro y fibra, y estuve muy enfocada en mis proyectos de trabajo.";
      } else if (phase === 'Ovulatoria') {
        sleepQuality = 1; // Excelente
        fatigue = 1; // Ninguna
        pain = 1; // Ninguno
        stress = 2; // Bajo
        mood = 1; // Muy feliz
        behavior = "Hice una sesión cardiovascular intensa al aire libre, tomé suficiente agua y me reuní con amigas, sintiéndome con mucha confianza y energía.";
      } else { // Luteal
        sleepQuality = 3; // Regular
        fatigue = 3; // Moderada
        pain = 2; // Leve
        stress = 4; // Alto stress (PMS)
        mood = 3; // Neutral
        behavior = "Opté por una caminata de 30 minutos a paso ligero para drenar la ansiedad, evité la cafeína y medité por la noche antes de dormir.";
      }
      
      // Adapt based on user's illness/health profile to make it even more realistic!
      if (profile.isCeliac) {
        behavior += " Me aseguré de que todas mis comidas fueran 100% libres de gluten.";
      }
      if (profile.hasDiabetes) {
        behavior += " Monitoreé mis niveles de glucosa y evité carbohidratos refinados.";
      }
      if (profile.hasObesity) {
        behavior += " Caminé más de 10,000 pasos hoy y cuidé el tamaño de mis porciones.";
      }
      if (profile.hasDepression) {
        behavior += " Escribí en mi diario de gratitud y tomé mi tiempo de relajación.";
      }

      demoLogs[dateStr] = {
        date: dateStr,
        sleepQuality,
        fatigue,
        pain,
        stress,
        mood,
        sleepDetails: sleepQuality <= 2 ? "Dormí de corrido toda la noche" : "Me costó conciliar el sueño al principio",
        additionalNotes: "Registro automático de demostración histórica.",
        behavior,
        aiAnalysis: `### Análisis de Tendencia - Fase ${phase}
Basado en tus registros de la fase **${phase}** (Día ${cycleDay} del ciclo), tu cuerpo está respondiendo de manera típica. Los niveles de dolor y fatiga se correlacionan directamente con tus fluctuaciones hormonales.`
      };
    }
    
    // Merge with current logs
    const updatedLogs = { ...logs, ...demoLogs };
    setLogs(updatedLogs);
    localStorage.setItem('cyclia_logs', JSON.stringify(updatedLogs));
    
    setNotificationMsg("¡Se han cargado 15 días de registros históricos de demostración!");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);
  };

  // Open Daily Check-in modal to re-register symptoms and trigger a new analysis
  const handleReRegister = () => {
    setIsCheckinOpen(true);
  };

  // Detect Alerts (Consecutive high ratings in stress/pain/fatigue/poor sleep)
  const checkAlerts = (): boolean => {
    const logList = Object.values(logs).sort((a, b) => b.date.localeCompare(a.date));
    if (logList.length < 3) return false;

    // Check last 3 logs
    const recent = logList.slice(0, 3);
    const highStress = recent.every(l => l.stress >= 4);
    const highPain = recent.every(l => l.pain >= 4);
    const highFatigue = recent.every(l => l.fatigue >= 4);
    const poorSleep = recent.every(l => l.sleepQuality >= 4);

    return highStress || highPain || highFatigue || poorSleep;
  };

  // Check if they registered a new period to recalculate lastPeriodDate
  const handleUpdatePeriodStart = (newDateStr: string) => {
    if (!profile) return;
    if (confirm(`¿Confirmas que deseas registrar el primer día de tu ciclo menstrual en la fecha ${newDateStr}? Esto actualizará las fases y cálculos.`)) {
      const updatedProfile = { ...profile, lastPeriodDate: newDateStr };
      handleSaveProfile(updatedProfile);
      
      // Clear old cached AI analyses of the logs to prevent stale advice
      const updatedLogs = { ...logs };
      Object.keys(updatedLogs).forEach(key => {
        delete updatedLogs[key].aiAnalysis;
      });
      setLogs(updatedLogs);
      localStorage.setItem('cyclia_logs', JSON.stringify(updatedLogs));

      setNotificationMsg("¡Ciclo recalculado con éxito!");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto w-full">
          {/* Main Onboarding Setup */}
          <Onboarding onComplete={handleSaveProfile} />
        </div>
      </div>
    );
  }

  // Calculate current state metrics based on active selection date
  const selectedCycleDay = getCycleDay(selectedDateStr, profile.lastPeriodDate, profile.cycleLength);
  const selectedPhase = getPhaseForDay(selectedCycleDay, profile.periodLength, profile.cycleLength);
  const phaseDetails = PHASE_DETAILS[selectedPhase];
  const activeLog = logs[selectedDateStr];

  const selectedActivity = generateActivityForDay(
    profile.name,
    selectedPhase,
    selectedCycleDay,
    {
      isCeliac: profile.isCeliac,
      hasDiabetes: profile.hasDiabetes,
      hasObesity: profile.hasObesity,
      hasDepression: profile.hasDepression
    }
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3A3A35] font-sans flex flex-col relative pb-12">
      
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[#5A5A40] text-white py-3 px-6 rounded-full shadow-lg border border-white/15 text-xs font-semibold tracking-wider uppercase z-50 flex items-center gap-2 animate-fade-in">
          🌸 {notificationMsg}
        </div>
      )}

      {/* Header Navigation */}
      <nav id="header-nav" className="flex justify-between items-center px-6 md:px-10 py-5 bg-white border-b border-[#EDE8E0] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center text-xl shadow-xs">
            🌸
          </div>
          <div>
            <h1 className="text-2xl font-serif font-semibold tracking-tight text-[#5A5A40]">Cyclia</h1>
            <p className="text-[9px] uppercase tracking-widest text-[#9A9A90] font-bold">Bienestar Femenino</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-2 text-xs uppercase tracking-widest text-[#9A9A90] font-bold">
              <span>Hola, {profile.name}</span>
              <button 
                onClick={() => setIsEditingHealth(true)} 
                className="text-[9px] bg-[#5A5A40]/10 text-[#5A5A40] hover:bg-[#5A5A40]/25 font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                title="Editar perfil de salud"
              >
                ⚙️ Editar Salud
              </button>
            </div>
            <p className="text-sm font-semibold text-[#5A5A40] mt-0.5">{formatFriendlyDate(selectedDateStr)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReRegister}
              className="bg-white hover:bg-rose-50 border border-rose-200 text-xs font-bold py-2.5 px-4 rounded-full text-rose-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Realizar nuevo análisis registrando tus datos de bienestar diarios"
            >
              🔄 Volver a Empezar (Check-In)
            </button>
            <button
              onClick={() => setIsSidebarChatOpen(!isSidebarChatOpen)}
              className="bg-[#FAF8F5] hover:bg-[#F2EFE9] border border-[#EDE8E0] text-xs font-bold py-2.5 px-4 rounded-full text-[#5A5A40] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              💬 {isSidebarChatOpen ? 'Cerrar Asistente' : 'Hablar con Cyclia'}
            </button>
            <button
              onClick={handleResetAppData}
              className="w-9 h-9 rounded-full border border-red-200 hover:bg-red-50 text-red-500 flex items-center justify-center text-xs transition-colors cursor-pointer"
              title="Restaurar valores de la App"
            >
              🔄
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto p-4 md:p-8 grid grid-cols-12 gap-6 items-start">
        
        {/* Active Health Profile Badges */}
        {(profile.isCeliac || profile.hasDiabetes || profile.hasObesity || profile.hasDepression) && (
          <div className="col-span-12 bg-white rounded-[24px] p-4 border border-[#EDE8E0] flex flex-wrap items-center gap-2 text-xs shadow-2xs">
            <span className="font-bold text-[#7A7A70] uppercase tracking-wider text-[10px]">Perfil de Salud Activo:</span>
            {profile.isCeliac && (
              <span className="bg-rose-50 border border-rose-100 text-rose-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">🌾 Celíaca</span>
            )}
            {profile.hasDiabetes && (
              <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">🩸 Diabetes / Insulina</span>
            )}
            {profile.hasObesity && (
              <span className="bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">⚖️ Obesidad</span>
            )}
            {profile.hasDepression && (
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">🧠 Depresión</span>
            )}
          </div>
        )}
        
        {/* Alert Banner Detection */}
        {checkAlerts() && (
          <div className="col-span-12 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-amber-900 text-sm leading-relaxed">
            <span>💡</span>
            <div>
              <strong>Aviso de Bienestar:</strong> He observado que durante varios días consecutivos has registrado indicadores de bienestar elevados (fatiga, dolor, estrés o descanso pobre). Si estos síntomas persisten o afectan tu calidad de vida, considera consultar con un profesional de la salud.
            </div>
          </div>
        )}

        {/* Column 1: Current Phase Details */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full">
          <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-[#F0EDE8] flex flex-col flex-1 min-h-[480px]">
            <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 w-fit ${phaseDetails.colorClass}`}>
              {phaseDetails.badge}
            </div>
            
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-[#3A3A35] mb-2">
              Día {selectedCycleDay} del Ciclo
            </h2>
            <p className="text-sm text-[#7A7A70] leading-relaxed mb-6">
              {phaseDetails.description}
            </p>

            {/* Microhormonal details */}
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE8E0] mb-6">
              <p className="text-[10px] font-bold text-[#9A9A90] uppercase tracking-widest mb-1">Estado Hormonal</p>
              <p className="text-xs font-medium text-[#5A5A40]">{phaseDetails.hormones}</p>
            </div>

            {/* Cognitive & Physical Stats Progress Bars */}
            <div className="space-y-5">
              <h4 className="text-[10px] font-bold text-[#9A9A90] uppercase tracking-widest">Indicadores de Fase</h4>
              <div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-[#9A9A90] mb-1.5">
                  <span>Concentración</span>
                  <span className="text-[#5A5A40]">{phaseDetails.stats.concentration}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#F0EDE8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5A5A40] rounded-full transition-all duration-500"
                    style={{ width: `${phaseDetails.stats.concentration}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-[#9A9A90] mb-1.5">
                  <span>Creatividad</span>
                  <span className="text-[#5A5A40]">{phaseDetails.stats.creativity}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#F0EDE8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5A5A40] rounded-full transition-all duration-500"
                    style={{ width: `${phaseDetails.stats.creativity}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-[#9A9A90] mb-1.5">
                  <span>Energía Física</span>
                  <span className="text-[#5A5A40]">{phaseDetails.stats.physicalEnergy}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#F0EDE8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5A5A40] rounded-full transition-all duration-500"
                    style={{ width: `${phaseDetails.stats.physicalEnergy}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Autocuidado Tips */}
            <div className="mt-8 pt-6 border-t border-[#F0EDE8] space-y-3">
              <h5 className="text-[10px] font-bold text-[#9A9A90] uppercase tracking-widest">Consejos de autocuidado</h5>
              <ul className="space-y-1.5">
                {phaseDetails.tips.slice(0, 2).map((tip, idx) => (
                  <li key={idx} className="text-xs text-[#5A5A40] flex items-start gap-1.5">
                    <span className="text-rose-400">✨</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Force start of period & Re-register cycle buttons */}
            <div className="mt-auto pt-6 flex flex-col gap-2.5">
              <button
                onClick={() => handleUpdatePeriodStart(selectedDateStr)}
                className="w-full bg-[#FAF8F5] hover:bg-[#F2EFE9] border border-[#EDE8E0] text-[11px] font-bold uppercase tracking-wider py-3 rounded-full text-rose-500 hover:text-rose-600 transition-all cursor-pointer text-center"
              >
                🔴 Registrar Inicio de Periodo Hoy
              </button>
              <button
                onClick={handleReRegister}
                className="w-full bg-white hover:bg-rose-50/50 border border-dashed border-rose-300 text-[11px] font-bold uppercase tracking-wider py-3 rounded-full text-rose-600 hover:text-rose-700 transition-all cursor-pointer text-center"
              >
                🔄 Volver a Empezar (Check-In Diario)
              </button>
            </div>

          </div>
        </div>

        {/* Column 2: Calendar & Main Dashboard Cards */}
        <div className={`col-span-12 ${isSidebarChatOpen ? 'lg:col-span-5' : 'lg:col-span-8'} flex flex-col gap-6`}>
          
          {/* Interactive Calendar widget */}
          <div className="h-fit">
            <CalendarView
              profile={profile}
              selectedDateStr={selectedDateStr}
              onSelectDate={setSelectedDateStr}
            />
          </div>

          {/* Detailed Recommended Activity for Selected Day */}
          <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-[#F0EDE8] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EDE8]">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏃‍♀️</span>
                <div>
                  <h3 className="font-serif font-semibold text-lg text-[#5A5A40]">Actividad Recomendada</h3>
                  <p className="text-[10px] uppercase tracking-widest text-[#9A9A90] font-bold">Personalizado para ti</p>
                </div>
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 border border-rose-100 text-rose-700">
                Fase: {selectedActivity.phaseName}
              </span>
            </div>

            <div>
              <h4 className="text-base font-serif font-bold text-[#3A3A35] mb-2 leading-tight">
                {selectedActivity.title}
              </h4>
              <p className="text-sm text-[#5A5A40] leading-relaxed mb-4">
                {selectedActivity.description}
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE8E0]">
              <h5 className="text-[10px] font-bold text-[#9A9A90] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <span>💡</span> ¿Por qué es adecuada para ti?
              </h5>
              <p className="text-xs text-[#5A5A40] leading-relaxed">
                {selectedActivity.why}
              </p>
            </div>

            {selectedActivity.illnessNotes.length > 0 && (
              <div className="mt-2 space-y-2">
                <h5 className="text-[10px] font-bold text-[#9A9A90] uppercase tracking-widest flex items-center gap-1 text-amber-700">
                  <span>⚠️</span> Adaptaciones para tus condiciones de salud:
                </h5>
                <div className="grid grid-cols-1 gap-2">
                  {selectedActivity.illnessNotes.map((note, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl text-xs text-[#78350F] leading-relaxed">
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Grid cards: Productivity Suggestions & Wellness Log Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-auto">
            
            {/* Productivity Suggested */}
            <div className="bg-[#5A5A40] rounded-[32px] p-6 text-white flex flex-col justify-between shadow-xs">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-4 flex items-center gap-1.5">
                  💼 Productividad Sugerida
                </h4>
                <ul className="space-y-3">
                  {phaseDetails.productivity.map((task, idx) => (
                    <li key={idx} className="text-xs font-medium flex items-start gap-2 leading-relaxed">
                      <span className="opacity-70">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-[11px] italic opacity-85 leading-relaxed">
                  "Tu foco hoy se orienta al {phaseDetails.name.toLowerCase()}."
                </p>
              </div>
            </div>

            {/* Wellness Checkin summary panel */}
            <div className="bg-[#F2EFE9] rounded-[32px] p-6 flex flex-col justify-between shadow-xs border border-[#E1DCD4]">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#9A9A90] mb-4 flex items-center gap-1.5">
                  ❤️ Registro de Bienestar
                </h4>
                
                {activeLog ? (
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-[#5A5A40]">Sueño:</span>
                      <span className="text-xs font-bold text-[#3A3A35] bg-white px-2.5 py-1 rounded-full border border-[#DED9D0]">
                        {SCALE_LABELS.sleep[activeLog.sleepQuality - 1]}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-[#5A5A40]">Estrés:</span>
                      <span className="text-xs font-bold text-[#3A3A35] bg-white px-2.5 py-1 rounded-full border border-[#DED9D0]">
                        {SCALE_LABELS.stress[activeLog.stress - 1]}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-[#5A5A40]">Energía:</span>
                      <span className="text-xs font-bold text-[#3A3A35] bg-white px-2.5 py-1 rounded-full border border-[#DED9D0]">
                        {SCALE_LABELS.fatigue === undefined ? 'N/A' : (SCALE_LABELS.fatigue[activeLog.fatigue - 1] === 'Ninguna' ? 'Alta' : 'Moderada')}
                      </span>
                    </div>

                    {/* Text logs details including the new behavior log */}
                    {(activeLog.sleepDetails || activeLog.additionalNotes || activeLog.behavior) && (
                      <div className="mt-4 pt-3 border-t border-[#DED9D0]/60 space-y-2">
                        {activeLog.sleepDetails && (
                          <div className="text-xs bg-white/50 p-2.5 rounded-xl border border-[#EDE8E0] leading-relaxed">
                            <span className="font-bold text-[#5A5A40]">🌙 Noche:</span> <span className="text-[#3A3A35]">{activeLog.sleepDetails}</span>
                          </div>
                        )}
                        {activeLog.additionalNotes && (
                          <div className="text-xs bg-white/50 p-2.5 rounded-xl border border-[#EDE8E0] leading-relaxed">
                            <span className="font-bold text-[#5A5A40]">📝 Notas:</span> <span className="text-[#3A3A35]">{activeLog.additionalNotes}</span>
                          </div>
                        )}
                        {activeLog.behavior && (
                          <div className="text-xs bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50 leading-relaxed">
                            <span className="font-bold text-emerald-800">🏃‍♀️ Hábitos y Rutinas:</span> <span className="text-[#3A3A35]">{activeLog.behavior}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-[#9A9A90] font-medium leading-relaxed mb-1">No has completado tu registro diario hoy.</p>
                    <p className="text-[10px] text-[#5A5A40] italic">Tu asistente espera tus datos para dar consejos inteligentes.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-2">
                <button
                  onClick={() => setIsCheckinOpen(true)}
                  className="w-full bg-white hover:bg-white/80 text-[#5A5A40] text-xs font-bold py-3 rounded-full border border-[#DED9D0] shadow-2xs transition-colors cursor-pointer text-center"
                >
                  {activeLog ? '📝 Editar Registro Diario' : '➕ Registrar Bienestar Hoy'}
                </button>
                
                {activeLog && (
                  <button
                    onClick={handleRequestAnalysisManually}
                    disabled={isAnalyzing}
                    className="w-full bg-[#5A5A40] hover:bg-[#484833] text-white text-xs font-bold py-3 rounded-full shadow-2xs transition-all cursor-pointer text-center"
                  >
                    {isAnalyzing ? '✨ Generando análisis...' : '🔍 Ver Análisis Inteligente'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Column 3: Collapsible Chat Panel Sidebar */}
        {isSidebarChatOpen && (
          <div className="col-span-12 lg:col-span-3 h-full">
            <ChatPanel
              profile={{
                ...profile,
                currentPhase: selectedPhase,
                cycleDay: selectedCycleDay
              }}
              logs={Object.values(logs)}
              chatHistory={chatHistory}
              onAddMessage={handleAddMessage}
              onClearHistory={handleClearHistory}
            />
          </div>
        )}

        {/* Full Width Symptom and Habit Evolution Graph */}
        <div className="col-span-12 mt-4">
          <SymptomChart
            logs={logs}
            profile={profile}
            onLoadDemoData={handleLoadDemoData}
          />
        </div>

      </main>

      {/* Daily Check-in Modal */}
      {isCheckinOpen && (
        <DailyCheckin
          dateStr={selectedDateStr}
          existingLog={activeLog}
          onSave={handleSaveLog}
          onClose={() => setIsCheckinOpen(false)}
        />
      )}

      {/* AI Analysis View Modal */}
      {isAnalysisOpen && (
        <div className="fixed inset-0 bg-[#3A3A35]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-[#EDE8E0] shadow-xl w-full max-w-xl p-6 md:p-8 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-4 border-b border-[#EDE8E0] mb-6">
              <div>
                <h3 className="font-serif font-semibold text-lg text-[#5A5A40]">Análisis Inteligente de Cyclia</h3>
                <p className="text-xs text-[#9A9A90] font-medium">{formatFriendlyDate(selectedDateStr)}</p>
              </div>
              <button
                onClick={() => setIsAnalysisOpen(false)}
                className="w-8 h-8 rounded-full border border-[#EDE8E0] text-[#9A9A90] hover:text-[#5A5A40] flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 mb-6">
              {isAnalyzing ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-10 h-10 border-4 border-t-[#5A5A40] border-[#EDE8E0] rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-semibold text-[#5A5A40] animate-pulse">Cyclia está analizando tu registro hormonal e historial diario...</p>
                </div>
              ) : analysisError ? (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  ⚠️ {analysisError}
                  <button
                    onClick={handleRequestAnalysisManually}
                    className="block mt-4 text-xs font-bold underline cursor-pointer"
                  >
                    Reintentar análisis
                  </button>
                </div>
              ) : activeLog?.aiAnalysis ? (
                <div className="space-y-4 text-sm text-[#3A3A35] leading-relaxed">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-4">
                    <p className="text-xs font-bold uppercase text-emerald-800 mb-1">💡 Conclusión Biológica</p>
                    <p className="text-xs text-emerald-950 font-medium leading-normal">
                      Este análisis ha sido personalizado según tu fase menstrual ({selectedPhase}) y el registro de tu estado de ánimo, dolores y calidad de sueño.
                    </p>
                  </div>
                  
                  {/* Parsing sections from response */}
                  <div className="whitespace-pre-wrap leading-relaxed bg-[#FAF8F5] p-5 rounded-2xl border border-[#EDE8E0] max-h-[400px] overflow-y-auto">
                    {activeLog.aiAnalysis}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-[#7A7A70]">No hay análisis disponible aún. Haz clic en el botón de abajo para generarlo por IA.</p>
                  <button
                    onClick={handleRequestAnalysisManually}
                    className="mt-4 bg-[#5A5A40] hover:bg-[#484833] text-white font-semibold py-2.5 px-6 rounded-full text-xs uppercase tracking-wide cursor-pointer"
                  >
                    Generar Análisis por IA
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-[#EDE8E0] pt-4 flex justify-end">
              <button
                onClick={() => setIsAnalysisOpen(false)}
                className="bg-[#5A5A40] hover:bg-[#484833] text-white font-semibold py-2.5 px-6 rounded-full text-xs uppercase tracking-wide cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Health Profile Modal */}
      {isEditingHealth && (
        <HealthProfileModal
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setIsEditingHealth(false)}
        />
      )}

    </div>
  );
}
