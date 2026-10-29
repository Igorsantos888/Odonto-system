import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertOctagon,
  Heart,
  Save,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'
import {
  clinicalRecordService,
  type StructuredAnamnese,
  type AnamneseHistoryItem,
} from '../../services/clinicalRecordService'
import { patientService } from '../../services/patientService'
import { anamneseFormSchema, type AnamneseFormData } from '../../schemas/anamneseSchema'
import type { Patient } from '../../types'
import { formatDateTime, maskCpf } from '../../utils/formatters'

export const AnamnesePage: React.FC = () => {
  const { activeClinic, user } = useAuth()

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01')
  const [anamnese, setAnamnese] = useState<StructuredAnamnese | null>(null)
  const [history, setHistory] = useState<AnamneseHistoryItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AnamneseFormData>({
    resolver: zodResolver(anamneseFormSchema),
    defaultValues: {
      allergies: '',
      continuous_medications: '',
      systemic_diseases: '',
      has_cardiac_condition: false,
      has_diabetes: false,
      has_hypertension: false,
      has_bleeding_disorder: false,
      is_pregnant_or_lactating: false,
      has_critical_alert: false,
      critical_alert_notes: '',
      clinical_notes: '',
      change_reason: '',
    },
  })

  // Observa campos para exibição de alerta em tempo real
  const watchedAllergies = watch('allergies')
  const watchedCardiac = watch('has_cardiac_condition')
  const watchedBleeding = watch('has_bleeding_disorder')
  const watchedCritical = watch('has_critical_alert')

  const hasActiveAlert =
    watchedCritical ||
    watchedCardiac ||
    watchedBleeding ||
    (watchedAllergies && watchedAllergies.trim().length > 0)

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

  // Carrega ficha e histórico do paciente selecionado
  const loadPatientAnamnese = useCallback(async () => {
    if (!activeClinic || !selectedPatientId) return
    setErrorMessage(null)
    try {
      const [anamData, histData] = await Promise.all([
        clinicalRecordService.getAnamnese(selectedPatientId, activeClinic.id),
        clinicalRecordService.getAnamneseHistory(selectedPatientId, activeClinic.id),
      ])
      setAnamnese(anamData)
      setHistory(histData)

      if (anamData) {
        reset({
          allergies: anamData.allergies?.join(', ') || '',
          continuous_medications: anamData.continuous_medications?.join(', ') || '',
          systemic_diseases: anamData.systemic_diseases?.join(', ') || '',
          has_cardiac_condition: anamData.has_cardiac_condition,
          has_diabetes: anamData.has_diabetes,
          has_hypertension: anamData.has_hypertension,
          has_bleeding_disorder: anamData.has_bleeding_disorder,
          is_pregnant_or_lactating: anamData.is_pregnant_or_lactating,
          has_critical_alert: anamData.has_critical_alert,
          critical_alert_notes: anamData.critical_alert_notes || '',
          clinical_notes: anamData.clinical_notes || '',
          change_reason: '',
        })
      } else {
        reset({
          allergies: '',
          continuous_medications: '',
          systemic_diseases: '',
          has_cardiac_condition: false,
          has_diabetes: false,
          has_hypertension: false,
          has_bleeding_disorder: false,
          is_pregnant_or_lactating: false,
          has_critical_alert: false,
          critical_alert_notes: '',
          clinical_notes: '',
          change_reason: '',
        })
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage('Erro ao carregar anamnese: ' + (err.message || ''))
    }
  }, [activeClinic, selectedPatientId, reset])

  useEffect(() => {
    loadPatientAnamnese()
  }, [loadPatientAnamnese])

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  // Salvar anamnese com histórico rastreável
  const onSubmit = async (data: AnamneseFormData) => {
    if (!activeClinic || !selectedPatientId) return
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const currentUserId = user?.id || 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'
      const updated = await clinicalRecordService.saveAnamnese(
        selectedPatientId,
        activeClinic.id,
        data,
        currentUserId
      )
      setAnamnese(updated)
      setSuccessMessage('Anamnese e adendo clínico atualizados com sucesso.')
      loadPatientAnamnese()
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao salvar anamnese.')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ficha de Anamnese & Histórico Médico
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Questionário de saúde sistêmica, alergias medicamentosas e contraindicações clínicas
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveAlert && (
            <Badge variant="critical" size="md">
              Alerta Crítico Ativo
            </Badge>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Gravar Anamnese
          </Button>
        </div>
      </div>

      {/* Patient Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Paciente em Avaliação:
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
          <FileCheck2 className="w-4 h-4 text-teal-600" />
          <span>Última revisão médica: {anamnese ? formatDateTime(anamnese.updated_at) : 'Não registrada'}</span>
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

      {/* Mandated Visual Alert (PDF Page 3 specification) */}
      {hasActiveAlert && (
        <Alert
          variant="critical"
          title={`ALERTA MÉDICO OBRIGATÓRIO — Paciente: ${selectedPatient?.full_name}`}
        >
          Este paciente possui alertas críticos ativos. Atente para contraindicações no plano
          terapêutico, escolha de anestésicos locais e prescrições de antibióticos ou analgésicos.
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Alergias e Riscos */}
          <Card className={hasActiveAlert ? 'border-rose-300 shadow-xs' : ''}>
            <CardHeader className={hasActiveAlert ? 'bg-rose-50/60' : 'bg-slate-50/60'}>
              <CardTitle className="flex items-center gap-2 text-rose-900">
                <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Alergias & Reações Adversas a Medicamentos</span>
              </CardTitle>
              <CardDescription>
                Identificação compulsória de hipersensibilidade (penicilina, dipirona, anestésicos, látex)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="has_critical_alert"
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                  {...register('has_critical_alert')}
                />
                <label
                  htmlFor="has_critical_alert"
                  className="text-xs font-bold text-rose-900 cursor-pointer"
                >
                  Marcar como ALERTA CLÍNICO CRÍTICO no cabeçalho do prontuário
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Alergias Registradas (separe por vírgula):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Penicilina e derivados, Dipirona Sódica, Iodo"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  {...register('allergies')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Texto do Alerta Clínico (visível em destaque nos atendimentos):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: ALERGIA SEVERA: Proibida Amoxicilina / Choque anafilático prévio..."
                  className="w-full rounded-lg border border-rose-200 bg-rose-50/30 p-2 text-xs text-rose-950 placeholder:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  {...register('critical_alert_notes')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Medicamentos em Uso Contínuo:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Varfarina 5mg, Losartana 50mg, Levotiroxina 75mcg..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  {...register('continuous_medications')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Condições Sistêmicas e Doenças */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-teal-600 shrink-0" />
                <span>Condições Sistêmicas & Histórico Médico</span>
              </CardTitle>
              <CardDescription>
                Avaliação de risco cirúrgico, anestésico e hemostasia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    {...register('has_cardiac_condition')}
                  />
                  <span className="font-medium text-slate-800">Cardiopatia / Infarto prévio</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    {...register('has_bleeding_disorder')}
                  />
                  <span className="font-medium text-slate-800">Distúrbio de Coagulação</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    {...register('has_hypertension')}
                  />
                  <span className="font-medium text-slate-800">Hipertensão Arterial</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    {...register('has_diabetes')}
                  />
                  <span className="font-medium text-slate-800">Diabetes Mellitus</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs sm:col-span-2">
                  <input
                    type="checkbox"
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    {...register('is_pregnant_or_lactating')}
                  />
                  <span className="font-medium text-slate-800">Gestante ou Lactante</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Doenças Crônicas / Outros Diagnósticos:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Asma moderada, Hepatite, Enxaqueca crônica..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  {...register('systemic_diseases')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Observações Clínicas Gerais do Dentista:
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruções específicas para atendimento..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  {...register('clinical_notes')}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Traceability requirement card */}
        <Card className="bg-slate-50/70 border-slate-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Rastreabilidade de Alterações Clínicas (Requisito Legal / CFO)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Para preservar a fidelidade documental exigida pelo Conselho Federal de Odontologia e LGPD,
              toda atualização da anamnese gera uma cópia do estado anterior na tabela <code>anamnesis_history</code>.
            </p>

            <Input
              label="Justificativa da Revisão / Adendo Clínico"
              placeholder="Ex: Inclusão de relato de nova reação alérgica ou atualização posológica..."
              error={errors.change_reason?.message}
              {...register('change_reason')}
            />
          </CardContent>
        </Card>
      </form>

      {/* Audit History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            <span>Trilha de Auditoria & Revisões Anteriores da Anamnese</span>
          </CardTitle>
          <CardDescription>
            Histórico imutável de alterações realizadas neste paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              Nenhuma revisão anterior registrada para este paciente.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {item.changed_by_name || 'Dr. Mateus Silva'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-mono">
                        {formatDateTime(item.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">
                      <strong>Motivo:</strong> {item.change_reason || 'Revisão periódica de rotina'}
                    </p>
                  </div>
                  <Badge variant="neutral" size="sm">
                    Revisão Auditada
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
