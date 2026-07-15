import React, { useState } from 'react';
import { DailyLog } from '../types';
import { formatFriendlyDate } from '../utils/cycle';

interface DailyCheckinProps {
  dateStr: string;
  existingLog?: DailyLog;
  onSave: (log: DailyLog) => void;
  onClose: () => void;
}

const SCALE_LABELS = {
  sleep: ["Excelente", "Buena", "Regular", "Mala", "Muy mala"],
  fatigue: ["Ninguna", "Leve", "Moderada", "Alta", "Extrema"],
  pain: ["Ninguno", "Leve", "Moderado", "Alto", "Muy alto"],
  stress: ["Muy bajo", "Bajo", "Moderado", "Alto", "Muy alto"],
  mood: ["Muy feliz", "Bien", "Neutral", "Triste", "Muy triste"]
};

export default function DailyCheckin({ dateStr, existingLog, onSave, onClose }: DailyCheckinProps) {
  const [step, setStep] = useState<number>(1);
  const [sleepQuality, setSleepQuality] = useState<number>(existingLog?.sleepQuality || 2);
  const [fatigue, setFatigue] = useState<number>(existingLog?.fatigue || 1);
  const [pain, setPain] = useState<number>(existingLog?.pain || 1);
  const [stress, setStress] = useState<number>(existingLog?.stress || 3);
  const [mood, setMood] = useState<number>(existingLog?.mood || 2);
  const [sleepDetails, setSleepDetails] = useState<string>(existingLog?.sleepDetails || '');
  const [additionalNotes, setAdditionalNotes] = useState<string>(existingLog?.additionalNotes || '');
  const [behavior, setBehavior] = useState<string>(existingLog?.behavior || '');

  const handleNext = () => {
    if (step < 8) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    const newLog: DailyLog = {
      date: dateStr,
      sleepQuality,
      fatigue,
      pain,
      stress,
      mood,
      sleepDetails: sleepDetails.trim(),
      additionalNotes: additionalNotes.trim(),
      behavior: behavior.trim(),
      aiAnalysis: existingLog?.aiAnalysis // Keep existing if it was analyzed
    };
    onSave(newLog);
  };

  const renderScaleButtons = (
    currentVal: number,
    setVal: (val: number) => void,
    labels: string[],
    colorScheme: 'sage' | 'amber' | 'coral'
  ) => {
    let activeBorderColor = 'border-[#5A5A40] bg-[#FAF8F5] text-[#5A5A40]';
    let hoverColor = 'hover:bg-[#FAF8F5]';
    
    if (colorScheme === 'amber') {
      activeBorderColor = 'border-[#D97706] bg-[#FFFBEB] text-[#D97706]';
    } else if (colorScheme === 'coral') {
      activeBorderColor = 'border-red-400 bg-red-50 text-red-700';
    }

    return (
      <div className="flex flex-col gap-3">
        {labels.map((label, index) => {
          const optionVal = index + 1;
          const isActive = currentVal === optionVal;
          
          return (
            <button
              key={optionVal}
              onClick={() => setVal(optionVal)}
              className={`py-4 px-5 rounded-2xl border text-sm font-semibold transition-all text-left cursor-pointer flex justify-between items-center ${
                isActive ? activeBorderColor : `border-[#EDE8E0] bg-white text-[#3A3A35] ${hoverColor}`
              }`}
            >
              <span>{label}</span>
              <span className="text-xs font-mono opacity-60">Puntaje: {optionVal}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const getStepHeader = () => {
    switch (step) {
      case 1: return "¿Cómo dormiste anoche?";
      case 2: return "¿Qué nivel de fatiga tienes hoy?";
      case 3: return "¿Qué nivel de dolor muscular/cólicos tienes hoy?";
      case 4: return "¿Cómo describirías tu nivel de estrés hoy?";
      case 5: return "¿Cómo está tu estado de ánimo?";
      case 6: return "¿Cómo dormiste? Describe tu noche";
      case 7: return "¿Hay algo más que quieras comentar sobre cómo te sientes hoy?";
      case 8: return "¿Cómo te comportaste hoy en cuanto a tus hábitos y rutinas?";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-[#3A3A35]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] border border-[#EDE8E0] shadow-xl w-full max-w-lg p-6 md:p-8 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#EDE8E0] mb-6">
          <div>
            <h3 className="font-serif font-semibold text-lg text-[#5A5A40]">Registro Diario</h3>
            <p className="text-xs text-[#9A9A90] font-medium">{formatFriendlyDate(dateStr)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#EDE8E0] text-[#9A9A90] hover:text-[#5A5A40] flex items-center justify-center transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <div
              key={num}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                num <= step ? 'bg-[#5A5A40]' : 'bg-[#F0EDE8]'
              }`}
            ></div>
          ))}
        </div>

        {/* Question Title */}
        <h4 className="text-xl font-serif font-medium text-[#5A5A40] mb-6">
          {getStepHeader()}
        </h4>

        {/* Question Input Areas */}
        <div className="flex-1 overflow-y-auto pr-1 mb-8 min-h-[220px]">
          {step === 1 && renderScaleButtons(sleepQuality, setSleepQuality, SCALE_LABELS.sleep, 'sage')}
          {step === 2 && renderScaleButtons(fatigue, setFatigue, SCALE_LABELS.fatigue, 'amber')}
          {step === 3 && renderScaleButtons(pain, setPain, SCALE_LABELS.pain, 'coral')}
          {step === 4 && renderScaleButtons(stress, setStress, SCALE_LABELS.stress, 'amber')}
          {step === 5 && renderScaleButtons(mood, setMood, SCALE_LABELS.mood, 'sage')}
          
          {step === 6 && (
            <textarea
              autoFocus
              value={sleepDetails}
              onChange={(e) => setSleepDetails(e.target.value)}
              placeholder="Ej. Me costó conciliar el sueño pero luego dormí profundo. Me siento renovada."
              className="w-full h-40 bg-[#FAF8F5] border border-[#EDE8E0] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] text-sm font-medium leading-relaxed"
            />
          )}

          {step === 7 && (
            <textarea
              autoFocus
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Ej. Siento un poco de dolor lumbar pero mi energía mental está muy bien hoy. Lista para planificar la semana."
              className="w-full h-40 bg-[#FAF8F5] border border-[#EDE8E0] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] text-sm font-medium leading-relaxed"
            />
          )}

          {step === 8 && (
            <div className="space-y-4">
              <p className="text-xs text-[#7A7A70]">Registra tus comportamientos y hábitos del día de hoy. Por ejemplo: si realizaste actividad física (caminata, yoga, HIIT), tus elecciones de alimentación, tiempo al aire libre, meditación, hidratación o si lograste seguir las recomendaciones de bienestar de Cyclia.</p>
              <textarea
                autoFocus
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                placeholder="Ej. Seguí la recomendación de caminar 20 minutos por la tarde, me hidraté muy bien con 2 litros de agua, comí saludable y sin gluten, y evité pantallas antes de dormir."
                className="w-full h-32 bg-[#FAF8F5] border border-[#EDE8E0] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] text-sm font-medium leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4 border-t border-[#EDE8E0] pt-4">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`px-6 py-3.5 rounded-full border border-[#EDE8E0] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              step === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#FAF8F5] text-[#7A7A70]'
            }`}
          >
            Atrás
          </button>
          
          <button
            onClick={handleNext}
            className="flex-1 bg-[#5A5A40] hover:bg-[#484833] text-white font-semibold py-3.5 rounded-full shadow-sm transition-all text-sm tracking-wide cursor-pointer text-center"
          >
            {step === 8 ? 'Guardar Registro' : 'Siguiente'}
          </button>
        </div>

      </div>
    </div>
  );
}
