import { supabase, isSupabaseConfigured } from './supabase'
import type { Patient, Profile } from '../types'
import type { PatientFormData } from '../schemas/patientSchema'

// Armazenamento em memória para modo de demonstração local
let mockPatientsStore: (Patient & { professional?: Profile })[] = [
  {
    id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    full_name: 'Mariana Ribeiro Alves',
    cpf: '12345678901',
    birth_date: '1992-05-14',
    gender: 'F',
    phone: '11987654321',
    email: 'mariana.ribeiro@email.com',
    address: 'Rua Augusta, 1200, Apto 42 - Consolação, São Paulo - SP',
    notes: 'ALERGIAS GRAVES: Penicilina e Dipirona. Histórico de broncoespasmo.',
    has_critical_alerts: true,
    allergies_count: 2,
    created_at: new Date('2025-03-12T10:00:00Z').toISOString(),
    professional: {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
      full_name: 'Dr. Mateus Silva',
      cro: 'CRO-SP 104.821',
      active: true,
      created_at: '',
    },
  },
  {
    id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    full_name: 'Carlos Eduardo Costa',
    cpf: '98765432100',
    birth_date: '1985-11-20',
    gender: 'M',
    phone: '11976543210',
    email: 'carlos.costa@email.com',
    address: 'Alameda Santos, 450 - Jardins, São Paulo - SP',
    notes: 'Reabilitação protética superior (dentes 16 e 26).',
    has_critical_alerts: false,
    allergies_count: 0,
    created_at: new Date('2025-04-10T14:30:00Z').toISOString(),
    professional: {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
      full_name: 'Dr. Mateus Silva',
      cro: 'CRO-SP 104.821',
      active: true,
      created_at: '',
    },
  },
  {
    id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    full_name: 'João Paulo de Albuquerque',
    cpf: '45678912345',
    birth_date: '1978-03-08',
    gender: 'M',
    phone: '11965432109',
    email: 'joao.albuquerque@email.com',
    address: 'Rua Pamplona, 900 - Bela Vista, São Paulo - SP',
    notes: 'Cardiopata. Em uso de anticoagulante oral contínuo.',
    has_critical_alerts: true,
    allergies_count: 1,
    created_at: new Date('2025-06-01T09:15:00Z').toISOString(),
    professional: {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
      full_name: 'Dr. Mateus Silva',
      cro: 'CRO-SP 104.821',
      active: true,
      created_at: '',
    },
  },
  {
    id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    full_name: 'Luciana Martins Ferreira',
    cpf: '32165498711',
    birth_date: '1996-08-25',
    gender: 'F',
    phone: '11954321098',
    email: 'luciana.martins@email.com',
    address: 'Rua Vergueiro, 2200 - Paraíso, São Paulo - SP',
    notes: 'Manutenção preventiva periódica e clareamento dental.',
    has_critical_alerts: false,
    allergies_count: 0,
    created_at: new Date('2025-08-15T16:00:00Z').toISOString(),
    professional: {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02',
      full_name: 'Dra. Beatriz Santos',
      cro: 'CRO-SP 119.452',
      active: true,
      created_at: '',
    },
  },
]

export const patientService = {
  /**
   * Lista todos os pacientes da clínica com pesquisa opcional
   */
  async listPatients(clinicId: string, search?: string): Promise<Patient[]> {
    if (!isSupabaseConfigured) {
      let filtered = mockPatientsStore.filter(
        (p) => !clinicId || p.clinic_id === clinicId
      )
      if (search && search.trim() !== '') {
        const query = search.toLowerCase().trim()
        filtered = filtered.filter(
          (p) =>
            p.full_name.toLowerCase().includes(query) ||
            (p.cpf && p.cpf.includes(query)) ||
            p.phone.includes(query)
        )
      }
      return filtered
    }

    let query = supabase
      .from('patients')
      .select(`
        *,
        patient_professionals (
          professional:profiles (id, full_name, cro, specialty)
        )
      `)
      .eq('clinic_id', clinicId)
      .order('full_name', { ascending: true })

    if (search && search.trim() !== '') {
      const q = search.trim()
      query = query.or(`full_name.ilike.%${q}%,cpf.ilike.%${q}%,phone.ilike.%${q}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error('Erro ao listar pacientes no Supabase:', error)
      throw new Error(error.message)
    }

    // Normaliza os dados mapeando o primeiro profissional vinculado
    return (data || []).map((row: any) => ({
      ...row,
      professional: row.patient_professionals?.[0]?.professional,
    }))
  },

  /**
   * Obtém os profissionais dentistas disponíveis na clínica para vínculo
   */
  async listClinicDentists(clinicId: string): Promise<Profile[]> {
    if (!isSupabaseConfigured) {
      return [
        {
          id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
          full_name: 'Dr. Mateus Silva',
          cro: 'CRO-SP 104.821',
          specialty: 'Cirurgia & Implantodontia',
          active: true,
          created_at: '',
        },
        {
          id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02',
          full_name: 'Dra. Beatriz Santos',
          cro: 'CRO-SP 119.452',
          specialty: 'Endodontia & Dentística',
          active: true,
          created_at: '',
        },
      ]
    }

    const { data, error } = await supabase
      .from('clinic_members')
      .select(`
        profile:profiles (id, full_name, cro, specialty, active)
      `)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .in('role', ['admin_clinica', 'dentista'])

    if (error) {
      console.error('Erro ao carregar dentistas da clínica:', error)
      return []
    }

    return (data || []).map((item: any) => item.profile).filter(Boolean)
  },

  /**
   * Cadastra um novo paciente e cria o vínculo com o profissional selecionado
   */
  async createPatient(clinicId: string, form: PatientFormData): Promise<Patient> {
    const cleanCpf = form.cpf ? form.cpf.replace(/\D/g, '') : null
    const cleanPhone = form.phone.replace(/\D/g, '')

    if (!isSupabaseConfigured) {
      const newPatient: Patient & { professional?: Profile } = {
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        full_name: form.full_name,
        cpf: cleanCpf || undefined,
        birth_date: form.birth_date || undefined,
        gender: form.gender,
        phone: cleanPhone,
        email: form.email || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
        has_critical_alerts: Boolean(
          form.notes && form.notes.toLowerCase().includes('alergia')
        ),
        allergies_count: form.notes && form.notes.toLowerCase().includes('alergia') ? 1 : 0,
        created_at: new Date().toISOString(),
      }

      if (form.professional_id) {
        const dentists = await this.listClinicDentists(clinicId)
        newPatient.professional = dentists.find((d) => d.id === form.professional_id)
      }

      mockPatientsStore.unshift(newPatient)
      return newPatient
    }

    // 1. Inserir paciente
    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .insert({
        clinic_id: clinicId,
        full_name: form.full_name,
        cpf: cleanCpf,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        phone: cleanPhone,
        email: form.email || null,
        address: form.address || null,
        notes: form.notes || null,
      })
      .select()
      .single()

    if (patientErr) {
      console.error('Erro ao criar paciente:', patientErr)
      throw new Error(patientErr.message)
    }

    // 2. Inserir vínculo com profissional se selecionado
    if (form.professional_id) {
      const { error: linkErr } = await supabase.from('patient_professionals').insert({
        patient_id: patient.id,
        professional_id: form.professional_id,
        clinic_id: clinicId,
      })
      if (linkErr) {
        console.warn('Paciente criado, porém houve falha ao vincular dentista:', linkErr)
      }
    }

    return patient
  },

  /**
   * Atualiza dados de um paciente existente
   */
  async updatePatient(
    patientId: string,
    clinicId: string,
    form: PatientFormData
  ): Promise<Patient> {
    const cleanCpf = form.cpf ? form.cpf.replace(/\D/g, '') : null
    const cleanPhone = form.phone.replace(/\D/g, '')

    if (!isSupabaseConfigured) {
      const idx = mockPatientsStore.findIndex((p) => p.id === patientId)
      if (idx === -1) throw new Error('Paciente não encontrado')

      const updated: Patient & { professional?: Profile } = {
        ...mockPatientsStore[idx],
        full_name: form.full_name,
        cpf: cleanCpf || undefined,
        birth_date: form.birth_date || undefined,
        gender: form.gender,
        phone: cleanPhone,
        email: form.email || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
        has_critical_alerts: Boolean(
          form.notes && form.notes.toLowerCase().includes('alergia')
        ),
        updated_at: new Date().toISOString(),
      }

      if (form.professional_id) {
        const dentists = await this.listClinicDentists(clinicId)
        updated.professional = dentists.find((d) => d.id === form.professional_id)
      }

      mockPatientsStore[idx] = updated
      return updated
    }

    const { data: updated, error: updateErr } = await supabase
      .from('patients')
      .update({
        full_name: form.full_name,
        cpf: cleanCpf,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        phone: cleanPhone,
        email: form.email || null,
        address: form.address || null,
        notes: form.notes || null,
      })
      .eq('id', patientId)
      .eq('clinic_id', clinicId)
      .select()
      .single()

    if (updateErr) {
      console.error('Erro ao atualizar paciente:', updateErr)
      throw new Error(updateErr.message)
    }

    // Atualiza vínculo com profissional
    if (form.professional_id) {
      // Remove vínculos anteriores e insere novo
      await supabase
        .from('patient_professionals')
        .delete()
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)

      await supabase.from('patient_professionals').insert({
        patient_id: patientId,
        professional_id: form.professional_id,
        clinic_id: clinicId,
      })
    }

    return updated
  },

  /**
   * Exclui um paciente (Operação restrita a Administrador da Clínica por RLS)
   */
  async deletePatient(patientId: string, clinicId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockPatientsStore = mockPatientsStore.filter((p) => p.id !== patientId)
      return
    }

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)
      .eq('clinic_id', clinicId)

    if (error) {
      console.error('Erro ao excluir paciente:', error)
      throw new Error(error.message)
    }
  },
}
