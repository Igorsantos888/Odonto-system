import { supabase, isSupabaseConfigured } from './supabase'
import type { MedicalRecord, Patient, Profile } from '../types'
import type { AnamneseFormData } from '../schemas/anamneseSchema'

export interface StructuredAnamnese {
  id: string
  clinic_id: string
  patient_id: string
  has_critical_alert: boolean
  critical_alert_notes?: string
  allergies: string[]
  continuous_medications: string[]
  systemic_diseases: string[]
  has_cardiac_condition: boolean
  has_diabetes: boolean
  has_hypertension: boolean
  has_bleeding_disorder: boolean
  is_pregnant_or_lactating: boolean
  clinical_notes?: string
  updated_by: string
  updated_at: string
  created_at: string
}

export interface AnamneseHistoryItem {
  id: string
  anamnesis_id: string
  clinic_id: string
  patient_id: string
  changed_by: string
  changed_by_name?: string
  change_reason?: string
  snapshot_data: Partial<StructuredAnamnese>
  created_at: string
}

// Mock inicial para modo demonstrativo
let mockMedicalRecords: (MedicalRecord & { patient?: Patient; professional?: Profile })[] = [
  {
    id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    professional_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    record_number: 'C-014',
    status: 'active',
    created_at: '2025-03-12T10:00:00Z',
    updated_at: '2026-10-29T09:30:00Z',
    patient: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
      clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'Mariana Ribeiro Alves',
      cpf: '12345678901',
      birth_date: '1992-05-14',
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
    id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
    professional_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    record_number: 'C-001',
    status: 'active',
    created_at: '2025-04-10T14:30:00Z',
    updated_at: '2026-10-22T11:00:00Z',
    patient: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
      clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'Carlos Eduardo Costa',
      cpf: '98765432100',
      birth_date: '1985-11-20',
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
]

let mockAnamnesesStore: Record<string, StructuredAnamnese> = {
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01': {
    id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    has_critical_alert: true,
    critical_alert_notes:
      'ALERGIA SEVERA: Penicilina e Dipirona (choque anafilático e edema de glote relatados). Proibida Amoxicilina.',
    allergies: ['Penicilina e derivados', 'Dipirona Sódica'],
    continuous_medications: ['Anticoncepcional oral combinado'],
    systemic_diseases: ['Enxaqueca crônica'],
    has_cardiac_condition: false,
    has_diabetes: false,
    has_hypertension: false,
    has_bleeding_disorder: false,
    is_pregnant_or_lactating: false,
    clinical_notes:
      'Paciente orientada quanto a alternativas terapêuticas analgésicas e antibióticas (ex: Clindamicina / Azitromicina).',
    updated_by: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    created_at: '2025-03-12T10:00:00Z',
    updated_at: '2026-10-15T14:00:00Z',
  },
}

let mockAnamneseHistory: AnamneseHistoryItem[] = [
  {
    id: 'hist-1',
    anamnesis_id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    changed_by: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    changed_by_name: 'Dr. Mateus Silva',
    change_reason: 'Inclusão de alerta de alergia a Dipirona após relato de erupções cutâneas.',
    snapshot_data: {
      allergies: ['Penicilina'],
      has_critical_alert: true,
      critical_alert_notes: 'Alergia prévia a Penicilina.',
    },
    created_at: '2025-03-12T10:00:00Z',
  },
]

export const clinicalRecordService = {
  /**
   * Lista todos os prontuários da clínica com dados do paciente e dentista
   */
  async listMedicalRecords(clinicId: string, search?: string) {
    if (!isSupabaseConfigured) {
      let filtered = mockMedicalRecords.filter(
        (m) => !clinicId || m.clinic_id === clinicId
      )
      if (search && search.trim() !== '') {
        const q = search.toLowerCase().trim()
        filtered = filtered.filter(
          (m) =>
            m.record_number.toLowerCase().includes(q) ||
            m.patient?.full_name.toLowerCase().includes(q) ||
            (m.patient?.cpf && m.patient.cpf.includes(q))
        )
      }
      return filtered
    }

    let query = supabase
      .from('medical_records')
      .select(`
        *,
        patient:patients (*),
        professional:profiles (*)
      `)
      .eq('clinic_id', clinicId)
      .order('record_number', { ascending: true })

    if (search && search.trim() !== '') {
      const q = search.trim()
      query = query.or(`record_number.ilike.%${q}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error('Erro ao listar prontuários:', error)
      throw new Error(error.message)
    }

    return data || []
  },

  /**
   * Obtém o prontuário de um paciente específico
   */
  async getMedicalRecordByPatient(patientId: string, clinicId: string) {
    if (!isSupabaseConfigured) {
      return (
        mockMedicalRecords.find(
          (m) => m.patient_id === patientId && m.clinic_id === clinicId
        ) || null
      )
    }

    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patient:patients (*),
        professional:profiles (*)
      `)
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Obtém a anamnese estruturada de um paciente
   */
  async getAnamnese(patientId: string, clinicId: string): Promise<StructuredAnamnese | null> {
    if (!isSupabaseConfigured) {
      return mockAnamnesesStore[patientId] || null
    }

    const { data, error } = await supabase
      .from('anamneses')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Salva ou atualiza a anamnese preservando a rastreabilidade (adendos)
   */
  async saveAnamnese(
    patientId: string,
    clinicId: string,
    formData: AnamneseFormData,
    userId: string
  ): Promise<StructuredAnamnese> {
    const parseList = (str?: string) =>
      str
        ? str
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : []

    const allergiesArr = parseList(formData.allergies)
    const medicationsArr = parseList(formData.continuous_medications)
    const diseasesArr = parseList(formData.systemic_diseases)

    const hasAlert =
      formData.has_critical_alert ||
      allergiesArr.length > 0 ||
      formData.has_cardiac_condition ||
      formData.has_bleeding_disorder

    if (!isSupabaseConfigured) {
      const existing = mockAnamnesesStore[patientId]

      if (existing) {
        // Grava na trilha de histórico antes de alterar
        mockAnamneseHistory.unshift({
          id: crypto.randomUUID(),
          anamnesis_id: existing.id,
          clinic_id: clinicId,
          patient_id: patientId,
          changed_by: userId,
          changed_by_name: 'Profissional da Sessão',
          change_reason: formData.change_reason || 'Revisão periódica de saúde',
          snapshot_data: { ...existing },
          created_at: new Date().toISOString(),
        })
      }

      const updated: StructuredAnamnese = {
        id: existing?.id || crypto.randomUUID(),
        clinic_id: clinicId,
        patient_id: patientId,
        has_critical_alert: hasAlert,
        critical_alert_notes: formData.critical_alert_notes || undefined,
        allergies: allergiesArr,
        continuous_medications: medicationsArr,
        systemic_diseases: diseasesArr,
        has_cardiac_condition: formData.has_cardiac_condition,
        has_diabetes: formData.has_diabetes,
        has_hypertension: formData.has_hypertension,
        has_bleeding_disorder: formData.has_bleeding_disorder,
        is_pregnant_or_lactating: formData.is_pregnant_or_lactating,
        clinical_notes: formData.clinical_notes || undefined,
        updated_by: userId,
        created_at: existing?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      mockAnamnesesStore[patientId] = updated
      return updated
    }

    // Persistência real no Supabase PostgreSQL
    const payload = {
      clinic_id: clinicId,
      patient_id: patientId,
      has_critical_alert: hasAlert,
      critical_alert_notes: formData.critical_alert_notes || null,
      allergies: allergiesArr,
      continuous_medications: medicationsArr,
      systemic_diseases: diseasesArr,
      has_cardiac_condition: formData.has_cardiac_condition,
      has_diabetes: formData.has_diabetes,
      has_hypertension: formData.has_hypertension,
      has_bleeding_disorder: formData.has_bleeding_disorder,
      is_pregnant_or_lactating: formData.is_pregnant_or_lactating,
      clinical_notes: formData.clinical_notes || null,
      updated_by: userId,
    }

    const { data, error } = await supabase
      .from('anamneses')
      .upsert(payload, { onConflict: 'clinic_id,patient_id' })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar anamnese no Supabase:', error)
      throw new Error(error.message)
    }

    return data
  },

  /**
   * Obtém o histórico de revisões e adendos (auditoria da anamnese)
   */
  async getAnamneseHistory(patientId: string, clinicId: string): Promise<AnamneseHistoryItem[]> {
    if (!isSupabaseConfigured) {
      return mockAnamneseHistory.filter((h) => h.patient_id === patientId)
    }

    const { data, error } = await supabase
      .from('anamnesis_history')
      .select(`
        *,
        changer:profiles!changed_by (full_name, cro)
      `)
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return (data || []).map((row: any) => ({
      ...row,
      changed_by_name: row.changer?.full_name,
    }))
  },
}
