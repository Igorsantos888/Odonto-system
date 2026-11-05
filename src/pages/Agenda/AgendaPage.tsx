import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Stethoscope,
  AlertOctagon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarDays,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'
import { appointmentService } from '../../services/appointmentService'
import { patientService } from '../../services/patientService'
import { appointmentFormSchema, type AppointmentFormData } from '../../schemas/appointmentSchema'
import type { Appointment, AppointmentStatus, Patient, Profile } from '../../types'
import { formatTime, maskPhone } from '../../utils/formatters'

export const AgendaPage: React.FC = () => {
  const { activeClinic, isConfigured } = useAuth()

  const [selectedDate, setSelectedDate] = useState<string>('2026-10-29')
  const [selectedProfissional, setSelectedProfissional] = useState('all')
  const [appointments, setAppointments] = useState<(Appointment & { patient?: Patient; professional?: Profile })[]>([])
  const [dentists, setDentists] = useState<Profile[]>([])
  const [patients, setPatients] = useState<Patient[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patient_id: '',
      professional_id: '',
      date: '2026-10-29',
      start_time: '11:00',
      duration_minutes: 45,
      procedure_title: '',
      notes: '',
    },
  })

  // Carrega dentistas e pacientes da clínica
  useEffect(() => {
    if (!activeClinic) return
    Promise.all([
      patientService.listClinicDentists(activeClinic.id),
      patientService.listPatients(activeClinic.id),
    ]).then(([dents, pts]) => {
      setDentists(dents)
      setPatients(pts)
    })
  }, [activeClinic])

  // Carrega agendamentos da data selecionada
  const loadAppointments = useCallback(async () => {
    if (!activeClinic) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const data = await appointmentService.listAppointments(
        activeClinic.id,
        selectedDate,
        selectedProfissional
      )
      setAppointments(data)
    } catch (err: any) {
      console.error(err)
      setErrorMessage('Falha ao carregar agendamentos: ' + (err.message || ''))
    } finally {
      setIsLoading(false)
    }
  }, [activeClinic, selectedDate, selectedProfissional])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  // Navegação de dias
  const handleDayShift = (days: number) => {
    const current = new Date(selectedDate + 'T12:00:00')
    current.setDate(current.getDate() + days)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  // Submissão de novo agendamento
  const onSubmitForm = async (data: AppointmentFormData) => {
    if (!activeClinic) return
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await appointmentService.createAppointment(
        activeClinic.id,
        data,
        patients,
        dentists
      )
      setSuccessMessage('Agendamento realizado com sucesso!')
      setIsModalOpen(false)
      reset()
      loadAppointments()
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar agendamento.')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }

  // Atualização rápida de status
  const handleUpdateStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    if (!activeClinic) return
    try {
      await appointmentService.updateStatus(appointmentId, activeClinic.id, newStatus)
      setSuccessMessage(`Status do agendamento atualizado para "${newStatus}".`)
      loadAppointments()
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao atualizar status.')
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const dateFormatted = new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Agenda Clínica & Calendário
          </h1>
          <p className="text-sm text-slate-500 mt-1 capitalize">
            {dateFormatted} • {activeClinic?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDayShift(-1)}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Dia Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate('2026-10-29')}
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDayShift(1)}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Próximo Dia
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              reset({
                patient_id: patients[0]?.id || '',
                professional_id: dentists[0]?.id || '',
                date: selectedDate,
                start_time: '11:00',
                duration_minutes: 45,
                procedure_title: '',
                notes: '',
              })
              setIsModalOpen(true)
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Security & Conflict Validation Banner */}
      <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>Prevenção de Conflitos Ativa (Etapa 7):</strong> O sistema impede sobreposição de horários para o mesmo profissional, tanto na interface quanto por restrição temporal no PostgreSQL (<code>btree_gist EXCLUDE</code>).
          </span>
        </div>
        {!isConfigured && (
          <span className="bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded border border-amber-300">
            Agenda Local Simulada
          </span>
        )}
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

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Profissional:</span>
            <select
              value={selectedProfissional}
              onChange={(e) => setSelectedProfissional(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Todos os Cirurgiões-Dentistas</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} {d.cro ? `(${d.cro})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400">
          {appointments.length} atendimento(s) programado(s)
        </span>
      </div>

      {/* Schedule Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
            <span>Grade Cronológica de Atendimentos</span>
          </CardTitle>
          <CardDescription>
            Horários sequenciais ordenados com controle de status e alertas clínicos imediatos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
              <span className="text-xs">Consultando grade de horários da clínica...</span>
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">
                Nenhum agendamento para esta data
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Todos os horários estão livres para marcação de consultas ou cirurgias.
              </p>
              <Button
                size="sm"
                variant="primary"
                className="mt-4"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Agendar Consulta Neste Dia
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => {
                const startTime = formatTime(apt.starts_at)
                const endTime = formatTime(apt.ends_at)
                const hasAlert =
                  apt.patient?.has_critical_alerts ||
                  (apt.notes && apt.notes.toLowerCase().includes('alergia'))

                return (
                  <div
                    key={apt.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      apt.status === 'completed'
                        ? 'bg-slate-50/70 border-slate-200 opacity-75'
                        : apt.status === 'in_progress'
                        ? 'bg-sky-50/40 border-sky-300 ring-1 ring-sky-200'
                        : apt.status === 'canceled'
                        ? 'bg-rose-50/30 border-rose-200 opacity-60'
                        : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    {/* Time & Patient Info */}
                    <div className="flex items-start md:items-center gap-4">
                      <div className="w-20 text-center shrink-0">
                        <span className="font-mono text-sm font-bold text-slate-900 block">
                          {startTime}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 block">
                          até {endTime}
                        </span>
                      </div>

                      <div className="border-l border-slate-200 pl-4 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-900">
                            {apt.patient?.full_name || 'Paciente sem nome'}
                          </h4>
                          {hasAlert && (
                            <Badge variant="critical" size="sm">
                              <AlertOctagon className="w-3.5 h-3.5" />
                              Alerta de Alergia / Cardiopatia
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-teal-700">
                            <Stethoscope className="w-3.5 h-3.5" />
                            {apt.procedure_title || 'Consulta Odontológica'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {apt.professional?.full_name || 'Dentista'}
                          </span>
                          {apt.patient?.phone && (
                            <>
                              <span>•</span>
                              <span>Tel: {maskPhone(apt.patient.phone)}</span>
                            </>
                          )}
                        </div>

                        {apt.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 max-w-xl">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status & Quick Action Controls */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Badge
                        variant={
                          apt.status === 'completed'
                            ? 'success'
                            : apt.status === 'in_progress'
                            ? 'info'
                            : apt.status === 'confirmed'
                            ? 'success'
                            : apt.status === 'canceled'
                            ? 'critical'
                            : 'warning'
                        }
                        size="md"
                      >
                        {apt.status === 'completed'
                          ? 'Concluído'
                          : apt.status === 'in_progress'
                          ? 'Em Atendimento'
                          : apt.status === 'confirmed'
                          ? 'Confirmado'
                          : apt.status === 'canceled'
                          ? 'Cancelado'
                          : 'Agendado'}
                      </Badge>

                      {apt.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                        >
                          Confirmar
                        </Button>
                      )}

                      {apt.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleUpdateStatus(apt.id, 'in_progress')}
                        >
                          Iniciar
                        </Button>
                      )}

                      {apt.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleUpdateStatus(apt.id, 'completed')}
                        >
                          Finalizar
                        </Button>
                      )}

                      {apt.status !== 'completed' && apt.status !== 'canceled' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(apt.id, 'canceled')}
                          title="Cancelar Agendamento"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Novo Agendamento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Agendamento Clínico"
        description={`Unidade: ${activeClinic?.name}`}
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSubmit(onSubmitForm)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Confirmar Agendamento
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Paciente *
            </label>
            <select
              {...register('patient_id')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Selecione o paciente cadastrado...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} {p.cpf ? `(CPF: ${p.cpf})` : ''}
                </option>
              ))}
            </select>
            {errors.patient_id && (
              <span className="text-xs text-rose-600 font-medium">
                {errors.patient_id.message}
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Cirurgião-Dentista Responsável *
            </label>
            <select
              {...register('professional_id')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Selecione o cirurgião-dentista...</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} {d.cro ? `(${d.cro})` : ''}
                </option>
              ))}
            </select>
            {errors.professional_id && (
              <span className="text-xs text-rose-600 font-medium">
                {errors.professional_id.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Data da Consulta *"
              type="date"
              error={errors.date?.message}
              {...register('date')}
            />

            <Input
              label="Horário de Início *"
              type="time"
              error={errors.start_time?.message}
              {...register('start_time')}
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Duração Estimada *
              </label>
              <select
                {...register('duration_minutes', { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora (60 min)</option>
                <option value={90}>1h 30min (90 min)</option>
                <option value={120}>2 horas (120 min)</option>
              </select>
            </div>
          </div>

          <Input
            label="Procedimento Previsto *"
            placeholder="Ex: Restauração Resina, Sessão Endodôntica, Exodontia..."
            error={errors.procedure_title?.message}
            {...register('procedure_title')}
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Observações do Agendamento / Lembretes
            </label>
            <textarea
              rows={2}
              placeholder="Instruções para a recepção ou recomendações pré-atendimento..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              {...register('notes')}
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              O sistema validará automaticamente a disponibilidade de agenda do cirurgião-dentista
              para prevenir sobreposição de horários.
            </span>
          </div>
        </form>
      </Modal>
    </div>
  )
}
