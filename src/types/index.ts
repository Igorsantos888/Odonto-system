// ==========================================
// Tipos de Domínio do Sistema Odontológico
// ==========================================

export type UserRole =
  | 'admin_clinica'
  | 'dentista'
  | 'recepcao'
  | 'financeiro'
  | 'assistente'

export interface Clinic {
  id: string
  name: string
  cnpj?: string
  phone?: string
  email?: string
  address?: string
  timezone: string
  created_at: string
  updated_at?: string
}

export interface Profile {
  id: string // auth.users id
  full_name: string
  cro?: string // Conselho Regional de Odontologia
  specialty?: string
  phone?: string
  email?: string
  avatar_url?: string
  active: boolean
  created_at: string
  updated_at?: string
}

export interface ClinicMember {
  id: string
  clinic_id: string
  user_id: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at?: string
  profile?: Profile
  clinic?: Clinic
}

export interface Patient {
  id: string
  clinic_id: string
  full_name: string
  cpf?: string
  birth_date?: string
  gender?: 'M' | 'F' | 'outro'
  phone: string
  email?: string
  address?: string
  notes?: string
  created_at: string
  updated_at?: string
  // Dados de resumo clínico para listas rápidas
  allergies_count?: number
  has_critical_alerts?: boolean
}

export interface PatientProfessional {
  patient_id: string
  professional_id: string
  clinic_id: string
  assigned_at: string
}

export interface MedicalRecord {
  id: string
  clinic_id: string
  patient_id: string
  professional_id: string
  record_number: string // ex: C-001
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface Anamnese {
  id: string
  patient_id: string
  clinic_id: string
  answers: {
    allergies: string[]
    continuous_medications: string[]
    systemic_diseases: string[]
    has_cardiac_condition: boolean
    has_diabetes: boolean
    has_hypertension: boolean
    has_bleeding_disorder: boolean
    is_pregnant_or_lactating: boolean
    clinical_observations?: string
    critical_alert_notes?: string
  }
  updated_by: string
  created_at: string
  updated_at: string
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'canceled'
  | 'no_show'

export interface Appointment {
  id: string
  clinic_id: string
  patient_id: string
  professional_id: string
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  procedure_title?: string
  notes?: string
  patient?: Patient
  professional?: Profile
  created_at: string
  updated_at?: string
}

export interface ClinicalEncounter {
  id: string
  clinic_id: string
  patient_id: string
  professional_id: string
  appointment_id?: string
  chief_complaint?: string
  notes: string
  conduct?: string
  prescriptions?: string
  created_at: string
  created_by: string
}

export type ToothFace = 'O' | 'M' | 'D' | 'V' | 'L' | 'P' // Oclusal, Mesial, Distal, Vestibular, Lingual, Palatina

export interface ToothCondition {
  tooth_number: number // 11-48 FDI
  faces: ToothFace[]
  condition: 'healthy' | 'caries' | 'restoration' | 'extracted' | 'implant' | 'endodontic' | 'prosthesis'
  notes?: string
}

export interface Odontogram {
  id: string
  patient_id: string
  encounter_id?: string
  data: {
    teeth: Record<number, ToothCondition>
    general_notes?: string
  }
  created_by: string
  created_at: string
}

export interface Procedure {
  id: string
  clinic_id: string
  code: string
  name: string
  category?: string
  default_price: number
  estimated_minutes: number
  active: boolean
}

export interface TreatmentPlan {
  id: string
  clinic_id: string
  patient_id: string
  professional_id: string
  title: string
  status: 'draft' | 'presented' | 'approved' | 'in_progress' | 'completed' | 'canceled'
  total_amount: number
  discount_amount?: number
  final_amount: number
  created_at: string
  updated_at?: string
  items?: TreatmentItem[]
}

export interface TreatmentItem {
  id: string
  plan_id: string
  procedure_id: string
  tooth_code?: number
  face_codes?: string
  status: 'pending' | 'in_progress' | 'completed' | 'canceled'
  price: number
  procedure?: Procedure
}

export interface ImagingExam {
  id: string
  clinic_id: string
  patient_id: string
  exam_type: 'panoramic' | 'periapical' | 'bite_wing' | 'tomography' | 'photo' | 'report_pdf'
  title: string
  exam_date: string
  storage_path: string
  file_name: string
  file_size_bytes: number
  mime_type: string
  notes?: string
  created_at: string
  created_by: string
}

export interface Budget {
  id: string
  clinic_id: string
  patient_id: string
  title: string
  total: number
  discount: number
  final_total: number
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'invoiced'
  payment_terms?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at?: string
  patient?: Patient
}

export type TransactionType = 'income' | 'expense'
export type TransactionStatus = 'pending' | 'paid' | 'overdue' | 'canceled'

export interface FinancialTransaction {
  id: string
  clinic_id: string
  patient_id?: string
  budget_id?: string
  type: TransactionType
  category: string
  description: string
  amount: number
  due_date: string
  paid_at?: string
  status: TransactionStatus
  payment_method?: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_slip' | 'transfer'
  patient?: Patient
  created_at: string
}

export interface Laboratory {
  id: string
  clinic_id: string
  name: string
  contact_person?: string
  phone: string
  email?: string
  address?: string
  active: boolean
}

export type LabJobStatus =
  | 'draft'
  | 'sent'
  | 'in_production'
  | 'delayed'
  | 'received'
  | 'applied'

export interface LaboratoryJob {
  id: string
  clinic_id: string
  laboratory_id: string
  patient_id: string
  professional_id: string
  prosthesis_type: string
  tooth_numbers?: string
  color_shade?: string
  sent_at: string
  due_at: string
  received_at?: string
  status: LabJobStatus
  cost: number
  notes?: string
  laboratory?: Laboratory
  patient?: Patient
}

export interface ClinicalTask {
  id: string
  clinic_id: string
  assigned_to?: string
  patient_id?: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'canceled'
  due_at?: string
  created_at: string
}

export interface AuditLog {
  id: string
  clinic_id: string
  actor_id: string
  actor_name?: string
  action: 'insert' | 'update' | 'delete' | 'access' | 'export'
  entity: string
  entity_id: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  created_at: string
}
