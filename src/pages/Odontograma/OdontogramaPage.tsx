import React, { useState, useEffect, useCallback } from 'react'
import {
  Smile,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { ToothGraphic } from '../../components/odontograma/ToothGraphic'
import { useAuth } from '../../contexts/AuthContext'
import { patientService } from '../../services/patientService'
import {
  odontogramService,
  type DentalFace,
  type DentalCondition,
  type ProcedureStatus,
  type ToothState,
  type OdontogramData,
} from '../../services/odontogramService'
import type { Patient, Procedure } from '../../types'
import { formatCurrency, maskCpf } from '../../utils/formatters'

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38]

export const OdontogramaPage: React.FC = () => {
  const { activeClinic, user } = useAuth()

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01')
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [odontogramData, setOdontogramData] = useState<OdontogramData>({})
  const [selectedTooth, setSelectedTooth] = useState<number>(16)

  // Editor states
  const [selectedCondition, setSelectedCondition] = useState<DentalCondition>('endodontic')
  const [selectedFaces, setSelectedFaces] = useState<DentalFace[]>(['O'])
  const [selectedStatus, setSelectedStatus] = useState<ProcedureStatus>('in_progress')
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('')
  const [toothNotes, setToothNotes] = useState<string>('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Carrega pacientes e catálogo de procedimentos
  useEffect(() => {
    if (!activeClinic) return
    Promise.all([
      patientService.listPatients(activeClinic.id),
      odontogramService.listProcedures(activeClinic.id),
    ]).then(([pts, procs]) => {
      setPatients(pts)
      setProcedures(procs)
      if (pts.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pts[0].id)
      }
    })
  }, [activeClinic, selectedPatientId])

  // Carrega o odontograma do paciente selecionado
  const loadOdontogram = useCallback(async () => {
    if (!activeClinic || !selectedPatientId) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const data = await odontogramService.getLatestOdontogram(activeClinic.id, selectedPatientId)
      setOdontogramData(data)
    } catch (err: any) {
      console.error(err)
      setErrorMessage('Falha ao carregar odontograma: ' + (err.message || ''))
    } finally {
      setIsLoading(false)
    }
  }, [activeClinic, selectedPatientId])

  useEffect(() => {
    loadOdontogram()
  }, [loadOdontogram])

  // Sincroniza formulário do editor ao mudar o dente selecionado
  useEffect(() => {
    const tooth = odontogramData[selectedTooth]
    if (tooth) {
      setSelectedCondition(tooth.condition)
      setSelectedFaces(tooth.affected_faces || [])
      setSelectedStatus(tooth.status || 'planned')
      setSelectedProcedureId(tooth.procedure_id || '')
      setToothNotes(tooth.notes || '')
    } else {
      setSelectedCondition('healthy')
      setSelectedFaces([])
      setSelectedStatus('planned')
      setSelectedProcedureId('')
      setToothNotes('')
    }
  }, [selectedTooth, odontogramData])

  // Alterna face selecionada
  const toggleFace = (face: DentalFace) => {
    setSelectedFaces((prev) =>
      prev.includes(face) ? prev.filter((f) => f !== face) : [...prev, face]
    )
  }

  // Atualiza estado do dente no odontograma em memória
  const handleApplyToothChanges = () => {
    const procedure = procedures.find((p) => p.id === selectedProcedureId)

    const updatedTooth: ToothState = {
      tooth_number: selectedTooth,
      condition: selectedCondition,
      affected_faces: selectedCondition === 'healthy' || selectedCondition === 'extracted' ? [] : selectedFaces,
      status: selectedStatus,
      procedure_id: selectedProcedureId || undefined,
      procedure_name: procedure ? procedure.name : odontogramData[selectedTooth]?.procedure_name,
      notes: toothNotes || undefined,
    }

    setOdontogramData((prev) => ({
      ...prev,
      [selectedTooth]: updatedTooth,
    }))

    setSuccessMessage(`Dente ${selectedTooth} atualizado no odontograma.`)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Limpa dente voltando para Hígido
  const handleResetTooth = () => {
    setSelectedCondition('healthy')
    setSelectedFaces([])
    setSelectedStatus('planned')
    setSelectedProcedureId('')
    setToothNotes('')
    setOdontogramData((prev) => {
      const copy = { ...prev }
      delete copy[selectedTooth]
      return copy
    })
  }

  // Salva versão persistente no Supabase
  const handleSaveOdontogram = async () => {
    if (!activeClinic || !selectedPatientId) return
    setIsSaving(true)
    setErrorMessage(null)

    try {
      const currentUserId = user?.id || 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'
      await odontogramService.saveOdontogramVersion(
        activeClinic.id,
        selectedPatientId,
        odontogramData,
        currentUserId
      )
      setSuccessMessage('Versão do odontograma gravada com sucesso no histórico clínico.')
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao salvar odontograma.')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  // Lista de procedimentos ativos no odontograma
  const activeProceduresList = Object.values(odontogramData).filter(
    (t) => t.condition !== 'healthy'
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Odontograma Interativo Anatômico (FDI)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mapeamento individual de faces, diagnóstico coronário e procedimentos • Paciente: <strong>{selectedPatient?.full_name || '...'}</strong> • {activeClinic?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveOdontogram}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Gravar Versão do Odontograma
          </Button>
        </div>
      </div>

      {/* Patient Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Paciente:
          </span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} (CPF: {maskCpf(p.cpf)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Notação Internacional FDI (32 dentes permanentes)</span>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-600 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main Interactive Dental Arch Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-teal-600" />
              <span>Arcada Dentária Interativa</span>
            </CardTitle>
            <CardDescription>
              Clique diretamente no dente ou em suas faces geométricas para inspecionar e alterar condições
            </CardDescription>
          </div>
          <Badge variant="neutral" size="sm">
            {activeProceduresList.length} dente(s) com registros clínicos
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6 py-6">
          {/* Legenda de Cores e Símbolos */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-400" /> Hígido
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" /> Cárie Ativa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" /> Restauração Realizada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-500" /> Restauração a Fazer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" /> Canal / Endodontia
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-violet-500" /> Prótese / Coroa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-600" /> Implante
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-rose-600">✕</span> Extraído
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
              <span className="text-xs">Carregando mapa dentário anatômico...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* ARCADA SUPERIOR (Maxila) */}
              <div>
                <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Arcada Superior (Maxila)
                </div>
                <div className="flex justify-center items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
                  {/* Quadrante 1 (Superior Direito) */}
                  <div className="flex gap-1">
                    {UPPER_RIGHT.map((num) => (
                      <ToothGraphic
                        key={num}
                        toothNumber={num}
                        condition={odontogramData[num]?.condition || 'healthy'}
                        affectedFaces={odontogramData[num]?.affected_faces || []}
                        status={odontogramData[num]?.status}
                        isSelected={selectedTooth === num}
                        onClick={() => setSelectedTooth(num)}
                        onFaceClick={(face) => {
                          setSelectedTooth(num)
                          toggleFace(face)
                        }}
                      />
                    ))}
                  </div>

                  {/* Linha Média */}
                  <div className="w-0.5 h-16 bg-slate-300 mx-1 rounded" />

                  {/* Quadrante 2 (Superior Esquerdo) */}
                  <div className="flex gap-1">
                    {UPPER_LEFT.map((num) => (
                      <ToothGraphic
                        key={num}
                        toothNumber={num}
                        condition={odontogramData[num]?.condition || 'healthy'}
                        affectedFaces={odontogramData[num]?.affected_faces || []}
                        status={odontogramData[num]?.status}
                        isSelected={selectedTooth === num}
                        onClick={() => setSelectedTooth(num)}
                        onFaceClick={(face) => {
                          setSelectedTooth(num)
                          toggleFace(face)
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* ARCADA INFERIOR (Mandíbula) */}
              <div>
                <div className="flex justify-center items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
                  {/* Quadrante 4 (Inferior Direito) */}
                  <div className="flex gap-1">
                    {LOWER_RIGHT.map((num) => (
                      <ToothGraphic
                        key={num}
                        toothNumber={num}
                        condition={odontogramData[num]?.condition || 'healthy'}
                        affectedFaces={odontogramData[num]?.affected_faces || []}
                        status={odontogramData[num]?.status}
                        isSelected={selectedTooth === num}
                        onClick={() => setSelectedTooth(num)}
                        onFaceClick={(face) => {
                          setSelectedTooth(num)
                          toggleFace(face)
                        }}
                      />
                    ))}
                  </div>

                  {/* Linha Média */}
                  <div className="w-0.5 h-16 bg-slate-300 mx-1 rounded" />

                  {/* Quadrante 3 (Inferior Esquerdo) */}
                  <div className="flex gap-1">
                    {LOWER_LEFT.map((num) => (
                      <ToothGraphic
                        key={num}
                        toothNumber={num}
                        condition={odontogramData[num]?.condition || 'healthy'}
                        affectedFaces={odontogramData[num]?.affected_faces || []}
                        status={odontogramData[num]?.status}
                        isSelected={selectedTooth === num}
                        onClick={() => setSelectedTooth(num)}
                        onFaceClick={(face) => {
                          setSelectedTooth(num)
                          toggleFace(face)
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">
                  Arcada Inferior (Mandíbula)
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tooth Inspector & Editor Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-teal-900">
                  Edição Clínica do Dente {selectedTooth}
                </CardTitle>
                <CardDescription>
                  Selecione as faces anatômicas acometidas, o diagnóstico e o procedimento vinculado
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetTooth}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Tornar Hígido
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* 1. Seleção de Faces Coronárias */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                1. Faces Coronárias Acometidas
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: 'V', label: 'Vestibular (V)' },
                  { code: 'O', label: 'Oclusal / Incisal (O)' },
                  {
                    code: selectedTooth <= 28 ? 'P' : 'L',
                    label: selectedTooth <= 28 ? 'Palatina (P)' : 'Lingual (L)',
                  },
                  { code: 'M', label: 'Mesial (M)' },
                  { code: 'D', label: 'Distal (D)' },
                ].map((face) => {
                  const isChecked = selectedFaces.includes(face.code as DentalFace)
                  return (
                    <button
                      key={face.code}
                      type="button"
                      onClick={() => toggleFace(face.code as DentalFace)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                        isChecked
                          ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {face.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Condição / Diagnóstico */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                2. Diagnóstico / Condição
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'healthy', label: 'Hígido', color: 'border-slate-300 text-slate-700' },
                  { id: 'caries', label: 'Cárie Ativa', color: 'border-rose-400 bg-rose-50 text-rose-800' },
                  { id: 'restoration_done', label: 'Restauração Realizada', color: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
                  { id: 'restoration_needed', label: 'Restauração Necessária', color: 'border-sky-400 bg-sky-50 text-sky-800' },
                  { id: 'endodontic', label: 'Tratamento de Canal', color: 'border-amber-400 bg-amber-50 text-amber-800' },
                  { id: 'prosthesis', label: 'Coroa / Prótese Fixa', color: 'border-violet-400 bg-violet-50 text-violet-800' },
                  { id: 'implant', label: 'Implante Dentário', color: 'border-teal-400 bg-teal-50 text-teal-800' },
                  { id: 'extracted', label: 'Dente Extraído / Ausente', color: 'border-slate-400 bg-slate-100 text-slate-800' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCondition(item.id as DentalCondition)}
                    className={`text-xs p-2 rounded-lg font-semibold border text-left transition-all ${
                      selectedCondition === item.id
                        ? 'ring-2 ring-teal-600 shadow-xs'
                        : 'opacity-70 hover:opacity-100'
                    } ${item.color}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Procedimento Vinculado e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  3. Procedimento do Catálogo
                </label>
                <select
                  value={selectedProcedureId}
                  onChange={(e) => setSelectedProcedureId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Selecione o procedimento...</option>
                  {procedures.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.default_price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Status do Procedimento
                </label>
                <div className="flex gap-1.5">
                  {[
                    { id: 'planned', label: 'Planejado', variant: 'info' },
                    { id: 'in_progress', label: 'Em Andamento', variant: 'warning' },
                    { id: 'completed', label: 'Realizado', variant: 'success' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStatus(s.id as ProcedureStatus)}
                      className={`flex-1 text-xs py-2 rounded-lg font-semibold border transition-all ${
                        selectedStatus === s.id
                          ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Observações Clínicas do Dente */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Observações Clínicas do Dente
              </label>
              <input
                type="text"
                value={toothNotes}
                onChange={(e) => setToothNotes(e.target.value)}
                placeholder="Ex: Lesão profunda próxima à polpa, cúspide fraturada..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApplyToothChanges}
              className="w-full sm:w-auto"
            >
              Atualizar Dente {selectedTooth} no Odontograma
            </Button>
          </CardContent>
        </Card>

        {/* Resumo do Dente Selecionado */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Ficha do Dente {selectedTooth}</CardTitle>
            <CardDescription>Resumo dos achados e faces</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Número FDI:</span>
                <span className="font-mono font-bold text-slate-800">{selectedTooth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Condição:</span>
                <span className="font-semibold capitalize text-slate-900">{selectedCondition}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Faces Acometidas:</span>
                <span className="font-mono font-bold text-teal-700">
                  {selectedFaces.length > 0 ? selectedFaces.join(' - ') : 'Nenhuma (Hígido)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge
                  variant={
                    selectedStatus === 'completed'
                      ? 'success'
                      : selectedStatus === 'in_progress'
                      ? 'warning'
                      : 'info'
                  }
                  size="sm"
                >
                  {selectedStatus}
                </Badge>
              </div>
            </div>

            {toothNotes && (
              <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-lg text-xs text-teal-950">
                <strong>Notas:</strong> {toothNotes}
              </div>
            )}
          </CardContent>
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              As alterações são consolidadas ao clicar em <em>Gravar Versão</em>.
            </span>
          </div>
        </Card>
      </div>

      {/* Tabela de Procedimentos Registrados na Arcada */}
      <Card>
        <CardHeader>
          <CardTitle>Procedimentos Registrados na Arcada</CardTitle>
          <CardDescription>
            Relação completa de dentes com intervenções planejadas, em andamento ou concluídas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {activeProceduresList.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhum procedimento ou dente alterado no odontograma deste paciente.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dente</TableHead>
                  <TableHead>Faces</TableHead>
                  <TableHead>Condição Clínica</TableHead>
                  <TableHead>Procedimento Vinculado</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeProceduresList.map((item) => (
                  <TableRow key={item.tooth_number}>
                    <TableCell className="font-mono font-bold text-xs text-slate-900">
                      {item.tooth_number}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-teal-700 font-semibold">
                      {item.affected_faces.length > 0 ? item.affected_faces.join(', ') : '-'}
                    </TableCell>
                    <TableCell className="text-xs font-semibold capitalize text-slate-800">
                      {item.condition}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {item.procedure_name || 'Procedimento manual'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {item.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'completed'
                            ? 'success'
                            : item.status === 'in_progress'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                      >
                        {item.status === 'completed'
                          ? 'Realizado'
                          : item.status === 'in_progress'
                          ? 'Em Andamento'
                          : 'Planejado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedTooth(item.tooth_number)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
