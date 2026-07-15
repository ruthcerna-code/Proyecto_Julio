import { MenstrualPhase, PhaseInfo } from "../types";

export const PHASE_DETAILS: Record<MenstrualPhase, PhaseInfo> = {
  Menstrual: {
    name: "Menstruación",
    badge: "🟥 Menstrual",
    colorClass: "bg-[#FCA5A5] text-white",
    bgHex: "#FCA5A5",
    textHex: "#ffffff",
    description: "Tu ciclo comienza hoy. El estrógeno y la progesterona están en sus niveles más bajos, invitándote al descanso y a la renovación física y mental.",
    hormones: "Estrógeno y progesterona en niveles mínimos.",
    stats: {
      concentration: 50,
      creativity: 60,
      physicalEnergy: 30
    },
    tips: [
      "Prioriza el descanso y duerme 8-9 horas.",
      "Realiza ejercicios muy suaves como yoga restaurativo o estiramientos.",
      "Mantente bien hidratada y consume infusiones calientes de manzanilla o jengibre.",
      "Reduce compromisos sociales o reuniones intensas si te sientes fatigada."
    ],
    productivity: [
      "Reflexionar sobre el mes anterior",
      "Trabajo individual de baja intensidad",
      "Planificación y establecimiento de intenciones",
      "Organizar carpetas y archivos digitales"
    ]
  },
  Folicular: {
    name: "Fase Folicular",
    badge: "🟩 Folicular",
    colorClass: "bg-[#86EFAC] text-[#1e3a1e]",
    bgHex: "#86EFAC",
    textHex: "#1e3a1e",
    description: "La hormona FSH estimula tus ovarios. Tus niveles de estrógeno comienzan a subir, aumentando tu energía, optimismo, claridad mental y apertura social.",
    hormones: "Incremento progresivo de estrógeno.",
    stats: {
      concentration: 80,
      creativity: 95,
      physicalEnergy: 85
    },
    tips: [
      "Es el momento ideal para iniciar nuevos proyectos y aprender cosas nuevas.",
      "Aprovecha para realizar ejercicio de fuerza o cardio de intensidad moderada-alta.",
      "Tu mente está abierta a nuevas ideas; haz sesiones de lluvia de ideas (brainstorming).",
      "Disfruta de tu alta motivación y socializa."
    ],
    productivity: [
      "Comenzar nuevos proyectos",
      "Planificar estrategias creativas",
      "Tomar cursos, estudiar y aprender rápido",
      "Generar ideas innovadoras y brainstorming"
    ]
  },
  Ovulacion: {
    name: "Ovulación",
    badge: "🟦 Ovulación",
    colorClass: "bg-[#93C5FD] text-[#1e293b]",
    bgHex: "#93C5FD",
    textHex: "#1e293b",
    description: "El pico de LH provoca la liberación del óvulo. Tu estrógeno y testosterona están al máximo. Te sientes sumamente magnética, comunicativa, con gran poder de convicción y vitalidad.",
    hormones: "Pico de estrógeno y hormona luteinizante (LH).",
    stats: {
      concentration: 75,
      creativity: 85,
      physicalEnergy: 95
    },
    tips: [
      "Fase de máxima fertilidad (ventana de 5 días).",
      "Momento perfecto para networking, presentaciones en público y negociaciones difíciles.",
      "Práctica entrenamientos de alta intensidad (HIIT, running duro) si te sientes con fuerza.",
      "Colabora con otros y fomenta el trabajo en equipo."
    ],
    productivity: [
      "Hacer presentaciones y discursos públicos",
      "Reuniones de ventas y negociaciones",
      "Networking y eventos sociales",
      "Liderazgo grupal y trabajo colaborativo"
    ]
  },
  Lutea: {
    name: "Fase Lútea",
    badge: "🟨 Fase Lútea",
    colorClass: "bg-[#FDE047] text-[#451a03]",
    bgHex: "#FDE047",
    textHex: "#451a03",
    description: "El folículo se convierte en cuerpo lúteo y produce progesterona. Esta hormona te invita a replegarte, enfocarte en detalles técnicos, organizar tu espacio, documentar y cerrar pendientes.",
    hormones: "Progesterona en su nivel máximo.",
    stats: {
      concentration: 85,
      creativity: 40,
      physicalEnergy: 60
    },
    tips: [
      "Tu energía física empieza a descender; prioriza comidas ricas en magnesio y fibra.",
      "Excelente momento para análisis críticos, revisión de detalles y tareas individuales.",
      "Organiza tu entorno físico y digital; te dará paz mental.",
      "Sé amable contigo si sientes fluctuaciones de humor o retención de líquidos."
    ],
    productivity: [
      "Revisión minuciosa y auditoría de datos",
      "Cerrar proyectos y tareas pendientes",
      "Organización y limpieza de espacios",
      "Trabajo individual técnico profundo"
    ]
  }
};

/**
 * Calculates the number of days between two dates.
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // Reset times to midnight to calculate exact calendar days
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the cycle day (1 to cycleLength) for a given date based on the last period date.
 */
export function getCycleDay(targetDateStr: string, lastPeriodDateStr: string, cycleLength: number): number {
  const diffDays = getDaysDifference(targetDateStr, lastPeriodDateStr);
  
  if (diffDays < 0) {
    // Return relative cycle day in the past
    const mod = diffDays % cycleLength;
    return mod === 0 ? cycleLength : cycleLength + mod;
  }
  
  return (diffDays % cycleLength) + 1;
}

/**
 * Decides the menstrual phase based on the cycle day.
 */
export function getPhaseForDay(day: number, periodLength: number, cycleLength: number): MenstrualPhase {
  // Menstrual Phase: Days 1 to periodLength
  if (day >= 1 && day <= periodLength) {
    return 'Menstrual';
  }

  // Ovulation fertile window is centered on cycleLength - 14.
  // Fertile window spans 5 days: [ovulation - 2, ovulation + 2], which is [cycleLength - 16, cycleLength - 12].
  const ovulStart = Math.max(periodLength + 1, cycleLength - 16);
  const ovulEnd = cycleLength - 12;

  if (day >= ovulStart && day <= ovulEnd) {
    return 'Ovulacion';
  }

  // Folicular Phase: after menstruation ends, up to the fertile window
  if (day > periodLength && day < ovulStart) {
    return 'Folicular';
  }

  // Lútea Phase: after fertile window ends, until the last day of the cycle
  return 'Lutea';
}

/**
 * Formats a Date object to YYYY-MM-DD string in local time.
 */
export function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date in Spanish friendly format (e.g., "Martes, 22 de Julio").
 */
export function formatFriendlyDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00'); // Prevent timezone offset shift
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  };
  const str = d.toLocaleDateString('es-ES', options);
  // Capitalize first letter
  return str.charAt(0).toUpperCase() + str.slice(1);
}
