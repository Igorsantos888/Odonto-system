import { supabase, isSupabaseConfigured } from './supabase'
import type { Procedure } from '../types'

export type DentalFace = 'V' | 'L' | 'P' | 'M' | 'D' | 'O' | 'I'

export type DentalCondition =
  | 'healthy'
  | 'caries'
  | 'restoration_done'
  | 'restoration_needed'
  | 'endodontic'
  | 'prosthesis'
  | 'implant'
  | 'extracted'

export type ProcedureStatus = 'planned' | 'in_progress' | 'completed'

export interface ToothState {
  tooth_number: number
  condition: DentalCondition
  affected_faces: DentalFace[]
  procedure_id?: string
  procedure_name?: string
  status: ProcedureStatus
  notes?: string
}

export type OdontogramData = Record<number, ToothState>

// Mapeamento padrão dos dentes do adulto no sistema FDI
export const ALL_FDI_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
]

// Mock inicial para modo demonstrativo (Paciente Mariana Ribeiro Alves - C-014)
let mockOdontogramStore: Record<string, OdontogramData> = {
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01': {
    16: {
      tooth_number: 16,
      condition: 'endodontic',
      affected_faces: ['O'],
      procedure_name: 'Tratamento Endodôntico Molar',
      status: 'in_progress',
      notes: 'Instrumentação concluída, curativo de Calen ativo.',
    },
    26: {
      tooth_number: 26,
      condition: 'prosthesis',
      affected_faces: ['V', 'P', 'M', 'D', 'O'],
      procedure_name: 'Coroa Total Cerâmica',
      status: 'planned',
      notes: 'Preparo planejado após término da endodontia do 16.',
    },
    36: {
      tooth_number: 36,
      condition: 'restoration_done',
      affected_faces: ['M', 'O'],
      procedure_name: 'Restauração Resina Composta',
      status: 'completed',
      notes: 'Restauração em bom estado marginal.',
    },
    38: {
      tooth_number: 38,
      condition: 'extracted',
      affected_faces: [],
      procedure_name: 'Exodontia 3º Molar',
      status: 'completed',
      notes: 'Exodontia realizada em 2023.',
    },
    25: {
      tooth_number: 25,
      condition: 'caries',
      affected_faces: ['M', 'O', 'D'],
      procedure_name: 'Restauração 3 Faces',
      status: 'planned',
      notes: 'Cárie interproximal diagnosticada por radiografia bite-wing.',
    },
  },
}

export const odontogramService = {
  /**
   * Obtém os procedimentos cadastrados na clínica para vincular ao odontograma
   */
  async listProcedures(clinicId: string): Promise<Procedure[]> {
    if (!isSupabaseConfigured) {
      return [
        {
          id: 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
          clinic_id: clinicId,
          code: 'REST-01',
          name: 'Restauração Resina (1 Face)',
          category: 'Dentística',
          default_price: 220,
          estimated_minutes: 30,
          active: true,
        },
        {
          id: 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b02',
          clinic_id: clinicId,
          code: 'REST-02',
          name: 'Restauração Resina (2 Faces)',
          category: 'Dentística',
          default_price: 320,
          estimated_minutes: 45,
          active: true,
        },
        {
          id: 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b03',
          clinic_id: clinicId,
          code: 'REST-03',
          name: 'Restauração Resina (3 Faces MOD)',
          category: 'Dentística',
          default_price: 450,
          estimated_minutes: 60,
          active: true,
        },
        {
          id: 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b05',
          clinic_id: clinicId,
          code: 'ENDO-02',
          name: 'Tratamento Endodôntico Molar',
          category: 'Endodontia',
          default_price: 1200,
          estimated_minutes: 90,
          active: true,
        },
        {
          id: 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b06',
          clinic_id: clinicId,
          code: 'PROT-01',
          name: 'Coroa Total Cerâmica Pura',
          category: 'Prótese',
          default_price: 1850,
          estimated_minutes: 60,
          active: true,
        },
        {
          id: 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b08',
          clinic_id: clinicId,
          code: 'CIRU-02',
          name: 'Exodontia de Terceiro Molar',
          category: 'Cirurgia',
          default_price: 550,
          estimated_minutes: 60,
          active: true,
        },
      ]
    }

    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('active', true)
      .order('category', { ascending: true })

    if (error) throw new Error(error.message)
    return (data || []) as Procedure[]
  },

  /**
   * Obtém a versão mais recente do odontograma do paciente
   */
  async getLatestOdontogram(
    clinicId: string,
    patientId: string
  ): Promise<OdontogramData> {
    if (!isSupabaseConfigured) {
      return mockOdontogramStore[patientId] || {}
    }

    const { data, error } = await supabase
      .from('odontograms')
      .select('data')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar odontograma:', error)
      return {}
    }

    return (data?.data as OdontogramData) || {}
  },

  /**
   * Salva uma nova versão do odontograma preservando histórico
   */
  async saveOdontogramVersion(
    clinicId: string,
    patientId: string,
    data: OdontogramData,
    userId: string
  ): Promise<void> {
    if (!isSupabaseConfigured) {
      mockOdontogramStore[patientId] = { ...data }
      return
    }

    const { error } = await supabase.from('odontograms').insert({
      clinic_id: clinicId,
      patient_id: patientId,
      data: data,
      created_by: userId,
    })

    if (error) {
      console.error('Erro ao salvar versão do odontograma:', error)
      throw new Error(error.message)
    }
  },
}
