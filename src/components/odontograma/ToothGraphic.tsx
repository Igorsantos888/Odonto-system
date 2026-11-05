import React from 'react'
import type { DentalFace, DentalCondition, ProcedureStatus } from '../../services/odontogramService'

export interface ToothGraphicProps {
  toothNumber: number
  condition: DentalCondition
  affectedFaces: DentalFace[]
  status?: ProcedureStatus
  isSelected: boolean
  onClick: () => void
  onFaceClick?: (face: DentalFace) => void
}

export const ToothGraphic: React.FC<ToothGraphicProps> = ({
  toothNumber,
  condition,
  affectedFaces,
  status = 'planned',
  isSelected,
  onClick,
  onFaceClick,
}) => {
  const isUpper = toothNumber >= 11 && toothNumber <= 28
  const lingualLabel = isUpper ? 'P' : 'L'

  // Determina cor de preenchimento conforme condição e status
  const getFaceColor = (face: DentalFace) => {
    const isAffected = affectedFaces.includes(face)
    if (!isAffected) return '#f8fafc' // Slate 50

    switch (condition) {
      case 'caries':
        return '#f43f5e' // Rose 500 (Cárie ativa)
      case 'restoration_done':
        return '#10b981' // Emerald 500 (Restauração realizada)
      case 'restoration_needed':
        return '#0284c7' // Sky 600 (Restauração necessária)
      case 'endodontic':
        return '#f59e0b' // Amber 500 (Canal / Endodontia)
      case 'prosthesis':
        return '#8b5cf6' // Violet 500 (Coroa / Prótese)
      case 'implant':
        return '#0d9488' // Teal 600 (Implante)
      default:
        return '#cbd5e1'
    }
  }

  // Cor geral da coroa quando afeta dente todo
  const isWholeTooth =
    condition === 'prosthesis' ||
    condition === 'implant' ||
    condition === 'endodontic'

  const wholeColor =
    condition === 'prosthesis'
      ? '#8b5cf6'
      : condition === 'implant'
      ? '#0d9488'
      : condition === 'endodontic'
      ? '#f59e0b'
      : undefined

  const handleFaceClickInternal = (e: React.MouseEvent, face: DentalFace) => {
    e.stopPropagation()
    if (onFaceClick) {
      onFaceClick(face)
    } else {
      onClick()
    }
  }

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-between p-1 rounded-xl cursor-pointer select-none transition-all ${
        isSelected
          ? 'bg-teal-50 ring-2 ring-teal-600 shadow-sm'
          : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
      } ${condition === 'extracted' ? 'opacity-40' : ''}`}
      style={{ width: '46px', height: '68px' }}
      title={`Dente ${toothNumber} • Condição: ${condition} • Faces: ${affectedFaces.join(', ') || 'Nenhuma'}`}
    >
      {/* FDI Tooth Number */}
      <span className="text-[10px] font-mono font-bold text-slate-700">
        {toothNumber}
      </span>

      {/* SVG Interactive Faces Diagram */}
      <div className="relative w-8 h-8">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-2xs"
          shapeRendering="geometricPrecision"
        >
          {/* Face Superior: Vestibular (V) */}
          <polygon
            points="0,0 100,0 75,25 25,25"
            fill={isWholeTooth && wholeColor ? wholeColor : getFaceColor('V')}
            stroke="#94a3b8"
            strokeWidth="3"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => handleFaceClickInternal(e, 'V')}
          />

          {/* Face Direita: Distal/Mesial (D) */}
          <polygon
            points="100,0 100,100 75,75 75,25"
            fill={isWholeTooth && wholeColor ? wholeColor : getFaceColor('D')}
            stroke="#94a3b8"
            strokeWidth="3"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => handleFaceClickInternal(e, 'D')}
          />

          {/* Face Inferior: Lingual / Palatina (L / P) */}
          <polygon
            points="100,100 0,100 25,75 75,75"
            fill={isWholeTooth && wholeColor ? wholeColor : getFaceColor(lingualLabel as DentalFace)}
            stroke="#94a3b8"
            strokeWidth="3"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => handleFaceClickInternal(e, lingualLabel as DentalFace)}
          />

          {/* Face Esquerda: Mesial/Distal (M) */}
          <polygon
            points="0,100 0,0 25,25 25,75"
            fill={isWholeTooth && wholeColor ? wholeColor : getFaceColor('M')}
            stroke="#94a3b8"
            strokeWidth="3"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => handleFaceClickInternal(e, 'M')}
          />

          {/* Face Central: Oclusal (O) ou Incisal (I) */}
          <polygon
            points="25,25 75,25 75,75 25,75"
            fill={isWholeTooth && wholeColor ? wholeColor : getFaceColor('O')}
            stroke="#94a3b8"
            strokeWidth="3"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => handleFaceClickInternal(e, 'O')}
          />

          {/* Dente Extraído (X vermelho sobreposto) */}
          {condition === 'extracted' && (
            <g stroke="#e11d48" strokeWidth="10" strokeLinecap="round">
              <line x1="10" y1="10" x2="90" y2="90" />
              <line x1="90" y1="10" x2="10" y2="90" />
            </g>
          )}

          {/* Implante (marca central de parafuso de titânio) */}
          {condition === 'implant' && (
            <circle cx="50" cy="50" r="14" fill="#0f766e" stroke="#ffffff" strokeWidth="3" />
          )}
        </svg>
      </div>

      {/* Status indicator dot */}
      <div className="flex items-center gap-1">
        {condition !== 'healthy' && condition !== 'extracted' && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === 'completed'
                ? 'bg-emerald-500'
                : status === 'in_progress'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-sky-500'
            }`}
          />
        )}
        <span className="text-[8px] uppercase font-bold text-slate-400">
          {condition === 'healthy' ? 'híg' : condition.slice(0, 3)}
        </span>
      </div>
    </div>
  )
}
