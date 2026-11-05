import { supabase, isSupabaseConfigured } from './supabase'
import type { Laboratory, LaboratoryJob, LabJobStatus, Patient, Profile } from '../types'
import type { LaboratoryFormData, LaboratoryJobFormData } from '../schemas/laboratorySchema'

// Mock inicial para modo demonstrativo
let mockLaboratories: Laboratory[] = [
  {
    id: 'l1eebc99-9c0b-4ef8-bb6d-6bb9bd380l01',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Dental Arte Próteses',
    contact_person: 'Roberto Silva (TPD)',
    phone: '11988887777',
    email: 'contato@dentalarte.com.br',
    address: 'Rua das Flores, 120, Sala 4, São Paulo - SP',
    active: true,
  },
  {
    id: 'l1eebc99-9c0b-4ef8-bb6d-6bb9bd380l02',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Maxillaris Laboratório Cerâmico',
    contact_person: 'Fernanda Oliveira',
    phone: '11977776666',
    email: 'pedidos@maxillaris.com.br',
    address: 'Av. Paulista, 2200, Conj 51, São Paulo - SP',
    active: true,
  },
]

let mockLabJobs: (LaboratoryJob & {
  laboratory?: Laboratory
  patient?: Patient
  professional?: Profile
})[] = [
  {
    id: 'j1eebc99-9c0b-4ef8-bb6d-6bb9bd380j01',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    laboratory_id: 'l1eebc99-9c0b-4ef8-bb6d-6bb9bd380l01',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
    professional_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    prosthesis_type: 'Coroa Cerâmica E-Max Pura',
    tooth_numbers: '21',
    color_shade: 'BL2 / A1',
    sent_at: '2026-10-18',
    due_at: '2026-10-28',
    received_at: '2026-10-28',
    status: 'applied',
    cost: 650.0,
    notes: 'Ajuste fino proximal. Cimentada em 29/10 com sucesso.',
    laboratory: mockLaboratories[0],
    patient: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
      clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'Carlos Eduardo Costa',
      cpf: '98765432100',
      phone: '11976543210',
      created_at: '',
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
    id: 'j1eebc99-9c0b-4ef8-bb6d-6bb9bd380j02',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    laboratory_id: 'l1eebc99-9c0b-4ef8-bb6d-6bb9bd380l02',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    professional_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    prosthesis_type: 'Placa Miorrelaxante de Bruxismo (Acrílico)',
    tooth_numbers: 'Arcada Superior',
    color_shade: 'Cristal Translúcida',
    sent_at: '2026-10-24',
    due_at: '2026-11-06',
    status: 'in_production',
    cost: 320.0,
    notes: 'Espessura 2mm com alívio nos caninos.',
    laboratory: mockLaboratories[1],
    patient: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
      clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'Mariana Ribeiro Alves',
      cpf: '12345678901',
      phone: '11987654321',
      created_at: '',
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

export const laboratoryService = {
  async getLaboratories(clinicId: string): Promise<Laboratory[]> {
    if (!isSupabaseConfigured) {
      return mockLaboratories.filter((l) => l.clinic_id === clinicId)
    }

    const { data, error } = await supabase
      .from('laboratories')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar laboratórios:', error)
      throw error
    }
    return data || []
  },

  async createLaboratory(clinicId: string, data: LaboratoryFormData): Promise<Laboratory> {
    if (!isSupabaseConfigured) {
      const newLab: Laboratory = {
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        name: data.name,
        contact_person: data.contact_person,
        phone: data.phone,
        email: data.email,
        address: data.address,
        active: true,
      }
      mockLaboratories.push(newLab)
      return newLab
    }

    const { data: inserted, error } = await supabase
      .from('laboratories')
      .insert({
        clinic_id: clinicId,
        name: data.name,
        contact_person: data.contact_person || null,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao cadastrar laboratório:', error)
      throw error
    }
    return inserted
  },

  async getJobs(
    clinicId: string,
    status?: LabJobStatus
  ): Promise<(LaboratoryJob & { laboratory?: Laboratory; patient?: Patient; professional?: Profile })[]> {
    if (!isSupabaseConfigured) {
      let list = mockLabJobs.filter((j) => j.clinic_id === clinicId)
      if (status) {
        list = list.filter((j) => j.status === status)
      }
      return list.sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    }

    let query = supabase
      .from('laboratory_jobs')
      .select(`
        *,
        laboratory:laboratories(id, name, phone, contact_person),
        patient:patients(id, full_name, cpf, phone),
        professional:profiles!laboratory_jobs_professional_id_fkey(id, full_name, cro)
      `)
      .eq('clinic_id', clinicId)
      .order('due_at', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) {
      console.error('Erro ao buscar ordens de laboratório:', error)
      throw error
    }
    return data || []
  },

  async createJob(
    clinicId: string,
    data: LaboratoryJobFormData,
    userId: string
  ): Promise<LaboratoryJob> {
    if (!isSupabaseConfigured) {
      const lab = mockLaboratories.find((l) => l.id === data.laboratory_id)
      const newJob: LaboratoryJob & { laboratory?: Laboratory } = {
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        laboratory_id: data.laboratory_id,
        patient_id: data.patient_id,
        professional_id: data.professional_id,
        prosthesis_type: data.prosthesis_type,
        tooth_numbers: data.tooth_numbers,
        color_shade: data.color_shade,
        sent_at: new Date().toISOString().slice(0, 10),
        due_at: data.due_at,
        status: 'sent',
        cost: data.cost,
        notes: data.notes,
        laboratory: lab,
      }
      mockLabJobs.unshift(newJob)
      return newJob
    }

    const payload = {
      clinic_id: clinicId,
      laboratory_id: data.laboratory_id,
      patient_id: data.patient_id,
      professional_id: data.professional_id,
      prosthesis_type: data.prosthesis_type,
      tooth_numbers: data.tooth_numbers || null,
      color_shade: data.color_shade || null,
      sent_at: new Date().toISOString().slice(0, 10),
      due_at: data.due_at,
      status: 'sent',
      cost: data.cost,
      notes: data.notes || null,
      created_by: userId,
    }

    const { data: inserted, error } = await supabase
      .from('laboratory_jobs')
      .insert(payload)
      .select(`
        *,
        laboratory:laboratories(id, name, phone),
        patient:patients(id, full_name, cpf, phone)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar ordem de laboratório:', error)
      throw error
    }
    return inserted
  },

  async updateJobStatus(id: string, status: LabJobStatus): Promise<void> {
    const receivedAt =
      status === 'received' || status === 'applied'
        ? new Date().toISOString().slice(0, 10)
        : null

    if (!isSupabaseConfigured) {
      const idx = mockLabJobs.findIndex((j) => j.id === id)
      if (idx !== -1) {
        mockLabJobs[idx].status = status
        if (receivedAt) mockLabJobs[idx].received_at = receivedAt
      }
      return
    }

    const updatePayload: { status: LabJobStatus; received_at?: string | null } = { status }
    if (receivedAt) {
      updatePayload.received_at = receivedAt
    }

    const { error } = await supabase
      .from('laboratory_jobs')
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar status do trabalho:', error)
      throw error
    }
  },
}
