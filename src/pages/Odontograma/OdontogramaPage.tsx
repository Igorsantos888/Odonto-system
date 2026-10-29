import React, { useState } from 'react'
import { Smile, Save } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38]

export const OdontogramaPage: React.FC = () => {
  const [selectedTooth, setSelectedTooth] = useState<number>(16)

  // Demonstração de condições dentárias cadastradas
  const mockConditions: Record<number, { condition: string; label: string; faces: string; color: string }> = {
    16: { condition: 'endodontic', label: 'Tratamento Endodôntico', faces: 'O', color: 'bg-amber-500' },
    26: { condition: 'prosthesis', label: 'Coroa Protética', faces: 'Total', color: 'bg-sky-500' },
    36: { condition: 'restoration', label: 'Restauração Resina', faces: 'M-O-D', color: 'bg-teal-500' },
    38: { condition: 'extracted', label: 'Exodontia Indicada', faces: 'Total', color: 'bg-rose-500' },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Odontograma Interativo (FDI)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mapeamento anatômico de dentes, faces coronárias e status de tratamentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="md">
            Paciente: Mariana Ribeiro (C-014)
          </Badge>
          <Button variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />}>
            Salvar Estado
          </Button>
        </div>
      </div>

      <Alert variant="warning" title="Planejado para Etapa 6">
        Estrutura anatômica interativa com padrão numérico internacional (FDI). A manipulação
        vetorial de cada face dentária individual (Vestibular, Lingual/Palatina, Mesial, Distal, Oclusal)
        e histórico de versões serão consolidados na <strong>Etapa 6</strong>.
      </Alert>

      {/* Interactive Odontogram Arc */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-teal-600" />
              Arcada Dentária do Adulto (32 Dentes)
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Restauração</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Canal</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Prótese</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Extração</span>
            </div>
          </CardTitle>
          <CardDescription>
            Clique no dente para inspecionar faces e registrar procedimentos
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 py-6">
          {/* Superior Arc */}
          <div>
            <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Arcada Superior (Maxila)
            </div>
            <div className="flex justify-center items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
              {/* Quadrante 1 (Superior Direito) */}
              <div className="flex gap-1">
                {UPPER_RIGHT.map((tooth) => {
                  const hasCondition = mockConditions[tooth]
                  const isSelected = selectedTooth === tooth
                  return (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => setSelectedTooth(tooth)}
                      className={`w-9 sm:w-11 h-14 rounded-lg flex flex-col items-center justify-between p-1 border text-xs font-mono transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 font-sans">{tooth}</span>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-white font-bold ${
                          hasCondition ? hasCondition.color : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {hasCondition ? tooth.toString().slice(-1) : ''}
                      </div>
                      <span className="text-[9px] text-slate-400">sup</span>
                    </button>
                  )
                })}
              </div>

              {/* Linha Média Superior */}
              <div className="w-px h-12 bg-slate-300 mx-1" />

              {/* Quadrante 2 (Superior Esquerdo) */}
              <div className="flex gap-1">
                {UPPER_LEFT.map((tooth) => {
                  const hasCondition = mockConditions[tooth]
                  const isSelected = selectedTooth === tooth
                  return (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => setSelectedTooth(tooth)}
                      className={`w-9 sm:w-11 h-14 rounded-lg flex flex-col items-center justify-between p-1 border text-xs font-mono transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 font-sans">{tooth}</span>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-white font-bold ${
                          hasCondition ? hasCondition.color : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {hasCondition ? tooth.toString().slice(-1) : ''}
                      </div>
                      <span className="text-[9px] text-slate-400">sup</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Inferior Arc */}
          <div>
            <div className="flex justify-center items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
              {/* Quadrante 4 (Inferior Direito) */}
              <div className="flex gap-1">
                {LOWER_RIGHT.map((tooth) => {
                  const hasCondition = mockConditions[tooth]
                  const isSelected = selectedTooth === tooth
                  return (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => setSelectedTooth(tooth)}
                      className={`w-9 sm:w-11 h-14 rounded-lg flex flex-col items-center justify-between p-1 border text-xs font-mono transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[9px] text-slate-400">inf</span>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-white font-bold ${
                          hasCondition ? hasCondition.color : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {hasCondition ? tooth.toString().slice(-1) : ''}
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans">{tooth}</span>
                    </button>
                  )
                })}
              </div>

              {/* Linha Média Inferior */}
              <div className="w-px h-12 bg-slate-300 mx-1" />

              {/* Quadrante 3 (Inferior Esquerdo) */}
              <div className="flex gap-1">
                {LOWER_LEFT.map((tooth) => {
                  const hasCondition = mockConditions[tooth]
                  const isSelected = selectedTooth === tooth
                  return (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => setSelectedTooth(tooth)}
                      className={`w-9 sm:w-11 h-14 rounded-lg flex flex-col items-center justify-between p-1 border text-xs font-mono transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[9px] text-slate-400">inf</span>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-white font-bold ${
                          hasCondition ? hasCondition.color : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {hasCondition ? tooth.toString().slice(-1) : ''}
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans">{tooth}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mt-3">
              Arcada Inferior (Mandíbula)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected tooth details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes Clínicos do Dente Selecionado: {selectedTooth}</CardTitle>
          <CardDescription>
            Registro de faces coronárias, diagnóstico e procedimentos planejados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mockConditions[selectedTooth] ? (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Condição Atual:
                </span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {mockConditions[selectedTooth].label}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Faces acometidas: <strong>{mockConditions[selectedTooth].faces}</strong>
                </p>
              </div>
              <Badge variant="warning" size="md">
                Em Andamento
              </Badge>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              Dente hígido ou sem procedimentos registrados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
