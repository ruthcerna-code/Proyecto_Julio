import React, { useState, useMemo } from 'react';
import { DailyLog, UserProfile } from '../types';
import { getCycleDay, getPhaseForDay, PHASE_DETAILS } from '../utils/cycle';

interface SymptomChartProps {
  logs: Record<string, DailyLog>;
  profile: UserProfile;
  onLoadDemoData: () => void;
}

type MetricKey = 'mood' | 'stress' | 'pain' | 'sleepQuality' | 'fatigue';

interface MetricConfig {
  key: MetricKey;
  label: string;
  color: string;
  gradientStart: string;
  gradientEnd: string;
  invert: boolean; // if true, 1 is shown at the top (better) and 5 at the bottom
  getLabel: (val: number) => string;
}

const METRICS: MetricConfig[] = [
  {
    key: 'mood',
    label: 'Estado de Ánimo',
    color: '#0D9488', // Teal
    gradientStart: 'rgba(13, 148, 136, 0.2)',
    gradientEnd: 'rgba(13, 148, 136, 0.0)',
    invert: true, // 1 is Muy Feliz (top), 5 is Muy Triste (bottom)
    getLabel: (val) => {
      const labels = ["Muy feliz", "Feliz", "Neutral", "Triste", "Muy triste"];
      return labels[val - 1] || `Nivel ${val}`;
    }
  },
  {
    key: 'stress',
    label: 'Estrés',
    color: '#E11D48', // Rose
    gradientStart: 'rgba(225, 29, 72, 0.2)',
    gradientEnd: 'rgba(225, 29, 72, 0.0)',
    invert: false, // 1 is Muy Bajo (bottom), 5 is Muy Alto (top)
    getLabel: (val) => {
      const labels = ["Muy bajo", "Bajo", "Moderado", "Alto", "Muy alto"];
      return labels[val - 1] || `Nivel ${val}`;
    }
  },
  {
    key: 'pain',
    label: 'Dolor / Cólicos',
    color: '#D97706', // Amber
    gradientStart: 'rgba(217, 119, 6, 0.2)',
    gradientEnd: 'rgba(217, 119, 6, 0.0)',
    invert: false, // 1 is Ninguno (bottom), 5 is Muy Alto (top)
    getLabel: (val) => {
      const labels = ["Ninguno", "Leve", "Moderado", "Alto", "Muy alto"];
      return labels[val - 1] || `Nivel ${val}`;
    }
  },
  {
    key: 'sleepQuality',
    label: 'Calidad de Sueño',
    color: '#4F46E5', // Indigo
    gradientStart: 'rgba(79, 70, 229, 0.2)',
    gradientEnd: 'rgba(79, 70, 229, 0.0)',
    invert: true, // 1 is Excelente (top), 5 is Muy Mala (bottom)
    getLabel: (val) => {
      const labels = ["Excelente", "Buena", "Regular", "Mala", "Muy mala"];
      return labels[val - 1] || `Nivel ${val}`;
    }
  },
  {
    key: 'fatigue',
    label: 'Cansancio / Fatiga',
    color: '#6B7280', // Gray
    gradientStart: 'rgba(107, 114, 128, 0.2)',
    gradientEnd: 'rgba(107, 114, 128, 0.0)',
    invert: false, // 1 is Ninguna (bottom), 5 is Extrema (top)
    getLabel: (val) => {
      const labels = ["Ninguno", "Leve", "Moderado", "Fuerte", "Extremo"];
      return labels[val - 1] || `Nivel ${val}`;
    }
  }
];

export default function SymptomChart({ logs, profile, onLoadDemoData }: SymptomChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('mood');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Parse and sort logs chronologically
  const chartData = useMemo(() => {
    const sorted = Object.values(logs)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sorted.map((log) => {
      const cycleDay = getCycleDay(log.date, profile.lastPeriodDate, profile.cycleLength);
      const phase = getPhaseForDay(cycleDay, profile.periodLength, profile.cycleLength);
      
      // Format friendly date: "12 Jul"
      const dateObj = new Date(log.date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

      return {
        ...log,
        cycleDay,
        phase,
        formattedDate,
        phaseDetails: PHASE_DETAILS[phase] || { name: phase, colorClass: 'bg-gray-100 text-gray-700' }
      };
    });
  }, [logs, profile]);

  const activeMetric = METRICS.find(m => m.key === selectedMetric) || METRICS[0];

  // SVG parameters
  const width = 600;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates
  const points = useMemo(() => {
    if (chartData.length === 0) return [];

    return chartData.map((d, index) => {
      // X coordinate
      const x = paddingLeft + (index / (chartData.length - 1 || 1)) * graphWidth;

      // Y coordinate based on value (1-5 scale)
      const val = d[selectedMetric] || 3;
      let percent = 0;
      if (activeMetric.invert) {
        // 1 is at top (100%), 5 is at bottom (0%)
        percent = (5 - val) / 4;
      } else {
        // 5 is at top (100%), 1 is at bottom (0%)
        percent = (val - 1) / 4;
      }

      const y = paddingTop + (1 - percent) * graphHeight;

      return { x, y, val, data: d, index };
    });
  }, [chartData, selectedMetric, activeMetric, graphWidth, graphHeight]);

  // Construct SVG Path
  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, '');
  }, [points]);

  // Construct Area Path for gradient fill
  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const baseLineY = paddingTop + graphHeight;
    return `${linePath} L ${last.x} ${baseLineY} L ${first.x} ${baseLineY} Z`;
  }, [points, linePath, graphHeight]);

  // Insights based on data
  const insights = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const count = chartData.length;
    const values = chartData.map(d => d[selectedMetric] || 3);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / count;

    // For behaviors linked to best status
    let behaviorInsight = '';
    const goodDays = chartData.filter(d => {
      const val = d[selectedMetric] || 3;
      return activeMetric.invert ? val <= 2 : val >= 4; // Good mood is 1-2, high stress/pain is 4-5
    });

    const behaviorsWithGoodStatus = goodDays
      .map(d => d.behavior)
      .filter((b): b is string => !!b && b.trim().length > 0);

    if (behaviorsWithGoodStatus.length > 0) {
      behaviorInsight = `En tus días con mejores registros de "${activeMetric.label}", solías reportar hábitos como: "${behaviorsWithGoodStatus[0].slice(0, 100)}..."`;
    } else {
      behaviorInsight = "Registra tus hábitos diarios de comportamiento para que Cyclia pueda correlacionar tus rutinas con tu bienestar.";
    }

    return {
      avg: avg.toFixed(1),
      count,
      behaviorInsight
    };
  }, [chartData, selectedMetric, activeMetric]);

  return (
    <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-[#F0EDE8] flex flex-col gap-6">
      
      {/* Header and Selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#F0EDE8]">
        <div>
          <h3 className="font-serif font-semibold text-xl text-[#5A5A40] flex items-center gap-2">
            <span>📊</span> Evolución de Bienestar y Hábitos
          </h3>
          <p className="text-xs text-[#9A9A90] font-medium mt-0.5">
            Descubre cómo influyen tus hábitos en tu salud a lo largo de tu ciclo menstrual
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap gap-1 bg-[#FAF8F5] p-1 rounded-full border border-[#EDE8E0] text-xs">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => {
                setSelectedMetric(m.key);
                setHoveredPoint(null);
              }}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                selectedMetric === m.key
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#7A7A70] hover:text-[#5A5A40]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        /* Empty State / Demo Data Trigger */
        <div className="py-12 px-6 bg-[#FAF8F5] rounded-2xl border border-[#EDE8E0] text-center flex flex-col items-center gap-4">
          <span className="text-4xl">🌸</span>
          <div className="max-w-md">
            <h4 className="font-serif font-semibold text-[#5A5A40] text-base mb-1.5">Aún no hay suficientes registros diarios</h4>
            <p className="text-xs text-[#7A7A70] leading-relaxed mb-4">
              Realiza tus registros diarios con el botón de <strong>Check-In Diario</strong> para empezar a ver la gráfica de tu evolución.
            </p>
            <button
              type="button"
              onClick={onLoadDemoData}
              className="bg-[#5A5A40] hover:bg-[#484833] text-white font-semibold py-2.5 px-6 rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
            >
              <span>✨</span> Cargar 7 días de datos demostrativos
            </button>
          </div>
        </div>
      ) : (
        /* Chart Visualization */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column 1: SVG Graph */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            
            {/* Top scale guide */}
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-[#9A9A90] font-bold px-1">
              <span>{activeMetric.invert ? '🔺 Mejor (1)' : '🔺 Mayor nivel (5)'}</span>
              <span>{activeMetric.invert ? '🔻 Peor (5)' : '🔻 Menor nivel (1)'}</span>
            </div>

            {/* Responsive SVG Container */}
            <div className="relative bg-[#FAF8F5] p-2 rounded-2xl border border-[#EDE8E0] overflow-hidden">
              <svg 
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-auto max-h-[260px] overflow-visible"
              >
                <defs>
                  {/* Gradient for Line Fill */}
                  <linearGradient id={`grad-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeMetric.color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={activeMetric.color} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 1, 2, 3, 4].map((gridIndex) => {
                  const y = paddingTop + (gridIndex / 4) * graphHeight;
                  return (
                    <line
                      key={gridIndex}
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="#EDE8E0"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Area Gradient Fill */}
                {points.length >= 2 && (
                  <path
                    d={areaPath}
                    fill={`url(#grad-${selectedMetric})`}
                  />
                )}

                {/* Line Path */}
                {points.length >= 2 && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={activeMetric.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {points.map((p) => {
                  const isHovered = hoveredPoint === p.index;
                  return (
                    <g key={p.index} className="cursor-pointer">
                      {/* Interactive Trigger area */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 12 : 6}
                        fill={activeMetric.color}
                        fillOpacity={isHovered ? 0.2 : 0.0}
                        onMouseEnter={() => setHoveredPoint(p.index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {/* Actual visual point */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 6 : 4}
                        fill={isHovered ? '#FFFFFF' : activeMetric.color}
                        stroke={activeMetric.color}
                        strokeWidth={isHovered ? 3 : 1}
                        onMouseEnter={() => setHoveredPoint(p.index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}

                {/* X-Axis Labels (Dates & Cycle Days) */}
                {points.map((p, i) => {
                  // Only show label for every point if size <= 7, else skip some for clean display
                  const shouldShow = points.length <= 7 || i % Math.ceil(points.length / 6) === 0 || i === points.length - 1;
                  if (!shouldShow) return null;

                  return (
                    <g key={p.index}>
                      <text
                        x={p.x}
                        y={height - paddingBottom + 18}
                        textAnchor="middle"
                        fill="#5A5A40"
                        fontSize="9"
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {p.data.formattedDate}
                      </text>
                      <text
                        x={p.x}
                        y={height - paddingBottom + 30}
                        textAnchor="middle"
                        fill="#9A9A90"
                        fontSize="8"
                        fontWeight="bold"
                        className="font-mono"
                      >
                        D{p.data.cycleDay}
                      </text>
                    </g>
                  );
                })}

                {/* Y-Axis scale label markers */}
                <text x={paddingLeft - 8} y={paddingTop + 4} textAnchor="end" fill="#9A9A90" fontSize="8" fontWeight="bold">
                  {activeMetric.invert ? '1' : '5'}
                </text>
                <text x={paddingLeft - 8} y={paddingTop + graphHeight / 2 + 3} textAnchor="end" fill="#9A9A90" fontSize="8" fontWeight="bold">
                  3
                </text>
                <text x={paddingLeft - 8} y={paddingTop + graphHeight + 2} textAnchor="end" fill="#9A9A90" fontSize="8" fontWeight="bold">
                  {activeMetric.invert ? '5' : '1'}
                </text>
              </svg>
            </div>

            <p className="text-[10px] text-[#9A9A90] font-bold text-center flex items-center justify-center gap-1.5 mt-1">
              <span>💡</span> Haz clic o sitúa el cursor sobre los círculos de la gráfica para ver el detalle y tus hábitos de ese día.
            </p>
          </div>

          {/* Column 2: Selected Point Detail / Interactive Tooltip & Insights */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Interactive Detail Panel */}
            {hoveredPoint !== null && points[hoveredPoint] ? (
              <div className="bg-[#FAF8F5] border border-[#5A5A40] rounded-2xl p-4 flex flex-col gap-3 shadow-xs h-full justify-between transition-all">
                <div>
                  <div className="flex justify-between items-start pb-2 border-b border-[#EDE8E0]">
                    <div>
                      <p className="text-xs font-bold text-[#5A5A40] font-mono">{points[hoveredPoint].data.formattedDate}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-1 ${points[hoveredPoint].data.phaseDetails.colorClass}`}>
                        Fase {points[hoveredPoint].data.phase} (Día {points[hoveredPoint].data.cycleDay})
                      </span>
                    </div>
                    <span className="text-2xl">{points[hoveredPoint].data.phase === 'Menstrual' ? '🩸' : points[hoveredPoint].data.phase === 'Folicular' ? '🌱' : points[hoveredPoint].data.phase === 'Ovulatoria' ? '✨' : '🌸'}</span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#7A7A70]">{activeMetric.label}:</span>
                      <span className="font-bold text-[#3A3A35]">{activeMetric.getLabel(points[hoveredPoint].val)}</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-[#EDE8E0] pt-1">
                      <span className="text-[#7A7A70]">Sueño:</span>
                      <span className="font-semibold text-[#5A5A40]">{METRICS[3].getLabel(points[hoveredPoint].data.sleepQuality)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7A7A70]">Estrés:</span>
                      <span className="font-semibold text-[#5A5A40]">{METRICS[1].getLabel(points[hoveredPoint].data.stress)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7A7A70]">Dolor:</span>
                      <span className="font-semibold text-[#5A5A40]">{METRICS[2].getLabel(points[hoveredPoint].data.pain)}</span>
                    </div>
                  </div>
                </div>

                {/* Behaviors logs for that day */}
                <div className="mt-2 bg-white/70 p-3 rounded-xl border border-[#EDE8E0] text-xs">
                  <span className="block font-bold text-emerald-800 text-[10px] uppercase tracking-wider mb-1">🏃‍♀️ Comportamiento del día:</span>
                  <p className="text-[#5A5A40] leading-relaxed italic text-[11px]">
                    {points[hoveredPoint].data.behavior 
                      ? `"${points[hoveredPoint].data.behavior}"` 
                      : "No se registraron hábitos ni detalles de comportamiento este día."}
                  </p>
                </div>
              </div>
            ) : (
              /* Overall metric summary & Correlative Insight */
              <div className="bg-[#FAF8F5] border border-[#EDE8E0] rounded-2xl p-4 md:p-5 flex flex-col gap-4 h-full justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#9A9A90] mb-3">Análisis de Tendencias</h4>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-xl border border-[#EDE8E0] text-center">
                      <span className="block text-[10px] uppercase tracking-wider text-[#9A9A90] font-bold">Total Días</span>
                      <span className="text-xl font-serif font-bold text-[#5A5A40]">{insights?.count}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-[#EDE8E0] text-center">
                      <span className="block text-[10px] uppercase tracking-wider text-[#9A9A90] font-bold">Promedio</span>
                      <span className="text-xl font-serif font-bold text-[#5A5A40]">{insights?.avg} / 5</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5">
                    <span className="block font-bold text-emerald-800 text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <span>🌿</span> Correlación de Hábitos
                    </span>
                    <p className="text-xs text-[#5A5A40] leading-relaxed">
                      {insights?.behaviorInsight}
                    </p>
                  </div>
                </div>

                {/* Button to reload demo data to extend points */}
                <button
                  type="button"
                  onClick={onLoadDemoData}
                  className="w-full text-center py-2 bg-white hover:bg-[#FAF8F5] border border-[#EDE8E0] rounded-xl text-[10px] font-bold uppercase tracking-wider text-[#7A7A70] hover:text-[#5A5A40] transition-colors cursor-pointer"
                >
                  🔄 Recargar / Actualizar Datos de Demostración
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
