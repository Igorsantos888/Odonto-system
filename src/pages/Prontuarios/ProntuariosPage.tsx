import React, { useState, useEffect, useCallback } from 'react'
import {
  Clock,
  Plus,
  User,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { clinicalRecordService } from '../../services/clinicalRecordService'
import { patientService } from '../../services/patientService'
import type { Patient } from '../../types'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatDateTime, maskCpf } from '../../utils/formatters'

interface EncounterMock {
  id: string
  data: string
  dentista: string
  cro: string
  titulo: string
  evolucao: string
  prescricao?: string
}

const MOCK_ENCOUNTERS: Record<string, EncounterMock[]> = {
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01': [
    {
      id: 'enc-1',
      data: '2026-10-29T09:30:00Z',
      dentista: 'Dr. Mateus Silva',
      cro: 'CRO-SP 104.821',
      titulo: 'Endodontia - Dente 16 (Sessão 2 / Instrumentação e Medicação)',
      evolucao:
        'Realizada odontometria eletrônica. Canais MV, DV e P instrumentados com sistema rotatório até lima 25/.06. Irrigação com NaOCl 2,5%. Curativo de demora com hidróxido de cálcio (Calen). Selamento provisório com ionômero de vidro.',
      prescricao: 'Prescrito analgésico não-penicilínico caso haja desconforto mastigatório leve.',
    },
    {
      id: 'enc-2',
      data: '2026-10-15T14:15:00Z',
      dentista: 'Dr. Mateus Silva',
      cro: 'CRO-SP 104.821',
      titulo: 'Urgência Odontológica - Dente 16 (Abertura Coronária)',
      evolucao:
        'Paciente compareceu com dor espontânea pulsátil no dente 16. Teste de sensibilidade térmico positivo aumentado. Diagnóstico: Pulpite Irreversível Sintomática. Anestesia infiltrativa com Mepivacaína 2%. Abertura e pulpotomia de alívio.',
      prescricao: 'Alerta médico registrado: Hipersensibilidade a Penicilina.',
    },
  ],
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02': [
    {
      id: 'enc-3',
      data: '2026-10-22T11:00:00Z',
      dentista: 'Dr. Mateus Silva',
      cro: 'CRO-SP 104.821',
      titulo: 'Moldagem de Trabalho para Prótese Fixa - Dente 26',
      evolucao:
        'Preparo protético do dente 26 refinado com chanfro largo. Fio retrator #000 + silicone de adição por técnica de dupla mistura. Registro oclusal. Trabalho enviado ao laboratório parceiro DentalArt com previsão para 30/10.',
    },
  ],
}

export const ProntuariosPage: React.FC = () => {
  const { activeClinic } = useAuth()
  const navigate = useNavigate()

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01')
  const [medicalRecord, setMedicalRecord] = useState<any>(null)
  const [anamnese, setAnamnese] = useState<any>(null)
  const [encounters, setEncounters] = useState<EncounterMock[]>([])

  // Modal para nova anotação clínica
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')

  // Carrega pacientes
  useEffect(() => {
    if (!activeClinic) return
    patientService.listPatients(activeClinic.id).then((pts) => {
      setPatients(pts)
      if (pts.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pts[0].id)
      }
    })
  }, [activeClinic, selectedPatientId])

  // Carrega prontuário e anamnese do paciente selecionado
  const loadPatientData = useCallback(async () => {
    if (!activeClinic || !selectedPatientId) return
    try {
      const [rec, anam] = await Promise.all([
        clinicalRecordService.getMedicalRecordByPatient(selectedPatientId, activeClinic.id),
        clinicalRecordService.getAnamnese(selectedPatientId, activeClinic.id),
      ])
      setMedicalRecord(rec)
      setAnamnese(anam)
      setEncounters(MOCK_ENCOUNTERS[selectedPatientId] || [])
    } catch (err) {
      console.error(err)
    }
  }, [activeClinic, selectedPatientId])

  useEffect(() => {
    loadPatientData()
  }, [loadPatientData])

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  const handleAddEncounter = () => {
    if (!noteTitle || !noteContent) return
    const newEnc: EncounterMock = {
      id: 'enc-' + Date.now(),
      data: new Date().toISOString(),
      dentista: 'Dr. Mateus Silva',
      cro: 'CRO-SP 104.821',
      titulo: noteTitle,
      evolucao: noteContent,
    }
    setEncounters([newEnc, ...encounters])
    setIsNewNoteOpen(false)
    setNoteTitle('')
    setNoteContent('')
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Prontuários Odontológicos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Registro cronológico e imutável de atos clínicos, evoluções e adendos • {activeClinic?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/anamnese')}
          >
            Ficha de Anamnese
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewNoteOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nova Evolução Clínica
          </Button>
        </div>
      </div>

      {/* Patient Switcher / Quick Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Selecionar Paciente:
          </span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} {p.cpf ? `(CPF: ${maskCpf(p.cpf)})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Prontuário com Rastreabilidade Jurídica Ativa</span>
        </div>
      </div>

      {/* Patient Header Identification Banner */}
      {selectedPatient && (
        <Card className="border-teal-200 bg-teal-50/20 shadow-xs">
          <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-mono font-bold flex flex-col items-center justify-center text-xs shadow-sm">
                <span>NÚMERO</span>
                <span className="text-sm">{medicalRecord?.record_number || 'C-014'}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedPatient.full_name}
                  </h2>
                  {anamnese?.has_critical_alert && (
                    <Badge variant="critical" size="sm">
                      {anamnese.critical_alert_notes || 'ALERTA DE ALERGIA GRAVE'}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                  <span>Nasc: <strong>{formatDate(selectedPatient.birth_date)}</strong></span>
                  <span>•</span>
                  <span>CPF: <strong>{maskCpf(selectedPatient.cpf)}</strong></span>
                  <span>•</span>
                  <span>Contato: <strong>{selectedPatient.phone}</strong></span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Responsável: <strong>Dr. Mateus Silva (CRO-SP 104.821)</strong>
                  </span>
                  <span>•</span>
                  <span>Status: <strong className="text-emerald-700">Prontuário Ativo</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end lg:self-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/anamnese')}
              >
                Ver Anamnese
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/odontograma')}
              >
                Odontograma
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Medical Warning */}
      {anamnese?.has_critical_alert && (
        <Alert
          variant="critical"
          title="Contraindicação Clínica / Alerta Obrigatório de Prescrição"
        >
          {anamnese.critical_alert_notes}
        </Alert>
      )}

      {/* Consultation Evolution History Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Evoluções Clínicas & Histórico de Atendimentos</span>
            </CardTitle>
            <CardDescription>
              Anotações sequenciais registradas pelos cirurgiões-dentistas. Proibida a exclusão definitiva.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Imutável</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {encounters.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhuma anotação clínica registrada ainda para este paciente.
            </div>
          ) : (
            encounters.map((enc, index) => (
              <div
                key={enc.id}
                className="relative pl-6 border-l-2 border-teal-500 space-y-2 group"
              >
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-800">
                      {formatDateTime(enc.data)}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-medium">
                      {enc.dentista} ({enc.cro})
                    </span>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {index === 0 ? 'Último Atendimento' : 'Histórico'}
                  </Badge>
                </div>

                <h3 className="text-sm font-semibold text-slate-900">
                  {enc.titulo}
                </h3>

                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
                  <p>{enc.evolucao}</p>
                  {enc.prescricao && (
                    <div className="pt-2 border-t border-slate-200 text-rose-700 font-medium">
                      <strong>Prescrição / Cuidados:</strong> {enc.prescricao}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Evolução Clínica */}
      <Modal
        isOpen={isNewNoteOpen}
        onClose={() => setIsNewNoteOpen(false)}
        title="Registrar Nova Evolução Clínica"
        description={`Paciente: ${selectedPatient?.full_name}`}
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewNoteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddEncounter}
              disabled={!noteTitle || !noteContent}
            >
              Assinar & Gravar Evolução
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Título do Procedimento / Diagnóstico *
            </label>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Ex: Restauração Resina Dente 36 / Sessão Endodôntica"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Evolução Clínica Detalhada & Procedimentos Realizados *
            </label>
            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Descreva a técnica anestésica, isolamento, materiais utilizados e conduta..."
              className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-relaxed">
            <strong>Aviso de Imutabilidade Legal:</strong> Conforme as diretrizes clínicas e o Conselho de Odontologia,
            após a gravação este registro não poderá ser excluído do sistema.
          </div>
        </div>
      </Modal>
    </div>
  )
}
