import { supabase, isSupabaseConfigured } from './supabase'
import type { Appointment, AppointmentStatus, Patient, Profile } from '../types'
import type { AppointmentFormData } from '../schemas/appointmentSchema'

// Mock inicial para modo demonstrativo
let mockAppointmentsStore: (Appointment & { patient?: Patient; professional?: Profile })[] = [
  {
    id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
    professional_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    starts_at: '2026-10-29T08:30:00-03:00',
    ends_at: '2026-10-29T09:15:00-03:00',
    status: 'completed',
    procedure_title: 'Instalação de Coroa Cerâmica',
    notes: 'Ajuste oclusal fino e cimentação definitiva com resina dual.',
    created_at: '2026-10-22T10:00:00Z',
    patient: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
      clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'Carlos Eduardo Costa',
      cpf: '98765432100',
      phone: '11976543210',
      created_at: '',
      has_critical_alerts: false,
    },
    professional: {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
      full_name: 'Dr. Mateus Silva',
      cro: 'CRO-SP 104.821',
      active: true,
      created_at: '',
    },
  },
  {
    id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c12',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    professional_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    starts_at: '2026-10-29T09:30:00-03:00',
    ends_at: '2026-10-29T10:30:00-03:00',
    status: 'in_progress',
    procedure_title: 'Tratamento Endodôntico (Dente 16)',
    notes: 'ATENÇÃO: Alergia grave a Penicilina e Dipirona.',
    created_at: '2026-10-22T10:15:00Z',
    patient: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
      clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'Mariana Ribeiro Alves',
      cpf: '12345678901',
      phone: '11987654321',
      created_at: '',
      has_critical_alerts: true,
    },
    professional: {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
      full_name: 'Dr. Mateus Silva',
      cro: 'CRO-SP 104.821',
      active: true,
      created_at: '',
    },
  },
  {
    id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c13',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04',
    professional_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02',
    starts_at: '2026-10-29T10:45:00-03:00',
    ends_at: '2026-10-29T11:30:00-03:00',
    status: 'confirmed',
    procedure_title: 'Restauração em Resina Composta (Faces M-O)',
    notes: 'Paciente confirmou presença via WhatsApp.',
    created_at: '2026-10-24T11:00:00Z',
    patient: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04',
      clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'Luciana Martins Ferreira',
      cpf: '32165498711',
      phone: '11954321098',
      created_at: '',
      has_critical_alerts: false,
    },
    professional: {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02',
      full_name: 'Dra. Beatriz Santos',
      cro: 'CRO-SP 119.452',
      active: true,
      created_at: '',
    },
  },
  {
    id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c14',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03',
    professional_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    starts_at: '2026-10-29T14:00:00-03:00',
    ends_at: '2026-10-29T14:45:00-03:00',
    status: 'scheduled',
    procedure_title: 'Exodontia Simples de 3º Molar (Dente 38)',
    notes: 'Cardiopata em uso contínuo de anticoagulante oral. Avaliar RNI recente.',
    created_at: '2026-10-25T14:30:00Z',
    patient: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03',
      clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'João Paulo de Albuquerque',
      cpf: '45678912345',
      phone: '11965432109',
      created_at: '',
      has_critical_alerts: true,
    },
    professional: {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
      full_name: 'Dr. Mateus Silva',
      cro: 'CRO-SP 104.821',
      active: true,
      created_at: '',
    },
  },
]

export const appointmentService = {
  /**
   * Converte data e hora de início + minutos de duração para objetos Date ISO
   */
  calculateInterval(dateStr: string, startTime: string, durationMinutes: number) {
    const [hours, minutes] = startTime.split(':').map(Number)
    const start = new Date(`${dateStr}T00:00:00`)
    start.setHours(hours, minutes, 0, 0)

    const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
    return {
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
    }
  },

  /**
   * Verifica se há conflito de horário para o profissional
   */
  async checkConflict(
    clinicId: string,
    professionalId: string,
    startsAt: string,
    endsAt: string,
    excludeId?: string
  ): Promise<{ hasConflict: boolean; conflictingWith?: string }> {
    const startReq = new Date(startsAt).getTime()
    const endReq = new Date(endsAt).getTime()

    if (!isSupabaseConfigured) {
      const conflict = mockAppointmentsStore.find((a) => {
        if (a.clinic_id !== clinicId) return false
        if (a.professional_id !== professionalId) return false
        if (a.status === 'canceled' || a.status === 'no_show') return false
        if (excludeId && a.id === excludeId) return false

        const aStart = new Date(a.starts_at).getTime()
        const aEnd = new Date(a.ends_at).getTime()

        // Sobreposição: (startReq < aEnd) && (endReq > aStart)
        return startReq < aEnd && endReq > aStart
      })

      return {
        hasConflict: Boolean(conflict),
        conflictingWith: conflict
          ? `${conflict.patient?.full_name || 'Paciente'} (${new Date(conflict.starts_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(conflict.ends_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`
          : undefined,
      }
    }

    // Consulta no Supabase PostgreSQL usando a função check_appointment_conflict
    const { data, error } = await supabase.rpc('check_appointment_conflict', {
      p_clinic_id: clinicId,
      p_professional_id: professionalId,
      p_starts_at: startsAt,
      p_ends_at: endsAt,
      p_exclude_id: excludeId || null,
    })

    if (error) {
      console.warn('Falha na verificação RPC, aplicando fallback de consulta:', error.message)
      // Fallback com consulta SELECT direta
      const { data: overlapping } = await supabase
        .from('appointments')
        .select('id, starts_at, ends_at, patient:patients(full_name)')
        .eq('clinic_id', clinicId)
        .eq('professional_id', professionalId)
        .not('status', 'in', '("canceled","no_show")')
        .lt('starts_at', endsAt)
        .gt('ends_at', startsAt)
        .neq('id', excludeId || '00000000-0000-0000-0000-000000000000')

      if (overlapping && overlapping.length > 0) {
        const item = overlapping[0] as any
        return {
          hasConflict: true,
          conflictingWith: `${item.patient?.full_name || 'Consulta'}`,
        }
      }
      return { hasConflict: false }
    }

    return { hasConflict: Boolean(data) }
  },

  /**
   * Lista os agendamentos da clínica filtrados por data ou profissional
   */
  async listAppointments(
    clinicId: string,
    selectedDate: string, // YYYY-MM-DD
    professionalId?: string
  ): Promise<(Appointment & { patient?: Patient; professional?: Profile })[]> {
    if (!isSupabaseConfigured) {
      return mockAppointmentsStore.filter((a) => {
        if (a.clinic_id !== clinicId) return false
        if (professionalId && professionalId !== 'all' && a.professional_id !== professionalId) {
          return false
        }
        // Compara apenas a data (YYYY-MM-DD)
        const aptDate = a.starts_at.split('T')[0]
        return aptDate === selectedDate
      }).sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    }

    const startOfDay = `${selectedDate}T00:00:00-03:00`
    const endOfDay = `${selectedDate}T23:59:59-03:00`

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients (*),
        professional:profiles (*)
      `)
      .eq('clinic_id', clinicId)
      .gte('starts_at', startOfDay)
      .lte('starts_at', endOfDay)
      .order('starts_at', { ascending: true })

    if (professionalId && professionalId !== 'all') {
      query = query.eq('professional_id', professionalId)
    }

    const { data, error } = await query
    if (error) {
      console.error('Erro ao listar agendamentos:', error)
      throw new Error(error.message)
    }

    return (data || []) as any
  },

  /**
   * Cria novo agendamento com validação de conflitos
   */
  async createAppointment(
    clinicId: string,
    form: AppointmentFormData,
    patientsList: Patient[],
    professionalsList: Profile[]
  ): Promise<Appointment> {
    const { startsAt, endsAt } = this.calculateInterval(
      form.date,
      form.start_time,
      form.duration_minutes
    )

    // Validação de conflito de horários
    const conflict = await this.checkConflict(
      clinicId,
      form.professional_id,
      startsAt,
      endsAt
    )

    if (conflict.hasConflict) {
      throw new Error(
        `Conflito de horário detectado! O dentista selecionado já possui atendimento marcado neste intervalo${conflict.conflictingWith ? ` (${conflict.conflictingWith})` : ''}. Escolha outro horário ou profissional.`
      )
    }

    if (!isSupabaseConfigured) {
      const patient = patientsList.find((p) => p.id === form.patient_id)
      const professional = professionalsList.find((p) => p.id === form.professional_id)

      const newApt: Appointment & { patient?: Patient; professional?: Profile } = {
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        patient_id: form.patient_id,
        professional_id: form.professional_id,
        starts_at: startsAt,
        ends_at: endsAt,
        status: 'scheduled',
        procedure_title: form.procedure_title,
        notes: form.notes,
        created_at: new Date().toISOString(),
        patient: patient,
        professional: professional,
      }

      mockAppointmentsStore.push(newApt)
      return newApt
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        clinic_id: clinicId,
        patient_id: form.patient_id,
        professional_id: form.professional_id,
        starts_at: startsAt,
        ends_at: endsAt,
        status: 'scheduled',
        procedure_title: form.procedure_title,
        notes: form.notes || null,
      })
      .select(`
        *,
        patient:patients (*),
        professional:profiles (*)
      `)
      .single()

    if (error) {
      if (error.code === '23P01') {
        throw new Error(
          'Conflito de horário! Já existe uma consulta agendada para este profissional no horário solicitado (bloqueio ativado no banco de dados).'
        )
      }
      throw new Error(error.message)
    }

    return data as any
  },

  /**
   * Altera o status do agendamento
   */
  async updateStatus(
    appointmentId: string,
    clinicId: string,
    newStatus: AppointmentStatus
  ): Promise<void> {
    if (!isSupabaseConfigured) {
      const apt = mockAppointmentsStore.find((a) => a.id === appointmentId)
      if (apt) {
        apt.status = newStatus
      }
      return
    }

    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId)
      .eq('clinic_id', clinicId)

    if (error) throw new Error(error.message)
  },
}
