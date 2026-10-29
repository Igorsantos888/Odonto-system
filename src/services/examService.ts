import { supabase, isSupabaseConfigured } from './supabase'
import type { ImagingExam } from '../types'
import { validateExamFile, type ExamFormData } from '../schemas/examSchema'

const BUCKET_NAME = 'clinical-exams'

// Mock de exames em memória para modo de demonstração local
let mockExamsStore: ImagingExam[] = [
  {
    id: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    title: 'Radiografia Panorâmica Inicial',
    exam_type: 'panoramic',
    exam_date: '2025-03-12',
    storage_path: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01/panoramica_inicial.png',
    file_name: 'panoramica_mariana_ribeiro.png',
    file_size_bytes: 2516582,
    mime_type: 'image/png',
    notes: 'Presença de lesão periapical circunscrita no dente 16 e dentes 18/28 inclusos.',
    created_by: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    created_at: '2025-03-12T10:00:00Z',
  },
  {
    id: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    title: 'Periapical Dente 16 (Pós-Instrumentação)',
    exam_type: 'periapical',
    exam_date: '2026-10-29',
    storage_path: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01/periapical_16.jpg',
    file_name: 'periapical_16_instrumentacao.jpg',
    file_size_bytes: 860160,
    mime_type: 'image/jpeg',
    notes: 'Comprimento de trabalho mantido a 1mm do ápice radiográfico em todos os condutos.',
    created_by: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    created_at: '2026-10-29T09:40:00Z',
  },
  {
    id: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03',
    title: 'Laudo Tomografia Cone Beam - Mandíbula Posterior',
    exam_type: 'report_pdf',
    exam_date: '2026-10-20',
    storage_path: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03/tomografia_laudo.pdf',
    file_name: 'laudo_tomografia_cone_beam_mandibula.pdf',
    file_size_bytes: 5347737,
    mime_type: 'application/pdf',
    notes: 'Avaliação da proximidade das raízes dos terceiros molares com o canal mandibular.',
    created_by: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    created_at: '2026-10-20T16:00:00Z',
  },
]

export const examService = {
  /**
   * Lista os exames de imagem da clínica com filtros opcionais
   */
  async listExams(
    clinicId: string,
    patientId?: string,
    typeFilter?: string
  ): Promise<ImagingExam[]> {
    if (!isSupabaseConfigured) {
      let filtered = mockExamsStore.filter((e) => e.clinic_id === clinicId)
      if (patientId) {
        filtered = filtered.filter((e) => e.patient_id === patientId)
      }
      if (typeFilter && typeFilter !== 'all') {
        filtered = filtered.filter((e) => e.exam_type === typeFilter)
      }
      return filtered
    }

    let query = supabase
      .from('imaging_exams')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('exam_date', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (typeFilter && typeFilter !== 'all') {
      query = query.eq('exam_type', typeFilter)
    }

    const { data, error } = await query
    if (error) {
      console.error('Erro ao listar exames no Supabase:', error)
      throw new Error(error.message)
    }

    return (data || []) as ImagingExam[]
  },

  /**
   * Realiza upload seguro para bucket privado e grava metadados no PostgreSQL
   */
  async uploadExam(
    clinicId: string,
    patientId: string,
    file: File,
    formData: ExamFormData,
    userId: string
  ): Promise<ImagingExam> {
    // 1. Validação de formato e tamanho
    const validation = validateExamFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    // 2. Geração de caminho com UUID não-previsível no storage
    const ext = file.name.split('.').pop() || 'dat'
    const storageUuid = crypto.randomUUID()
    const storagePath = `${clinicId}/${patientId}/${storageUuid}.${ext}`

    if (!isSupabaseConfigured) {
      const mockExam: ImagingExam = {
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        patient_id: patientId,
        title: formData.title,
        exam_type: formData.exam_type as any,
        exam_date: formData.exam_date,
        storage_path: storagePath,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        notes: formData.notes,
        created_by: userId,
        created_at: new Date().toISOString(),
      }
      mockExamsStore.unshift(mockExam)
      return mockExam
    }

    // 3. Upload dos bytes para o Bucket Privado
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro no upload para o Supabase Storage:', uploadError)
      throw new Error('Falha no upload do arquivo clínico: ' + uploadError.message)
    }

    // 4. Gravação dos metadados na tabela imaging_exams
    const { data, error: dbError } = await supabase
      .from('imaging_exams')
      .insert({
        clinic_id: clinicId,
        patient_id: patientId,
        title: formData.title,
        exam_type: formData.exam_type,
        exam_date: formData.exam_date,
        storage_path: storagePath,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        notes: formData.notes || null,
        created_by: userId,
      })
      .select()
      .single()

    if (dbError) {
      // Reversão de segurança: se falhar o banco, remove o arquivo órfão
      await supabase.storage.from(BUCKET_NAME).remove([storagePath])
      console.error('Erro ao gravar metadados do exame:', dbError)
      throw new Error('Falha ao registrar metadados do exame: ' + dbError.message)
    }

    return data as ImagingExam
  },

  /**
   * Gera uma URL temporária assinada (Signed URL) para visualização/download seguro
   * Válida por padrão por 15 minutos (900 segundos). Nunca expõe URL pública!
   */
  async getSignedUrl(storagePath: string, expiresIn = 900): Promise<string> {
    if (!isSupabaseConfigured) {
      // Retorna placeholder demonstrativo para preview local
      return 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=1200'
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn)

    if (error || !data?.signedUrl) {
      console.error('Erro ao gerar URL assinada:', error)
      throw new Error('Não foi possível autorizar o acesso a este arquivo.')
    }

    return data.signedUrl
  },

  /**
   * Exclusão segura do exame e do arquivo no storage
   */
  async deleteExam(
    examId: string,
    clinicId: string,
    storagePath: string
  ): Promise<void> {
    if (!isSupabaseConfigured) {
      mockExamsStore = mockExamsStore.filter((e) => e.id !== examId)
      return
    }

    // 1. Remove metadados da tabela
    const { error: dbError } = await supabase
      .from('imaging_exams')
      .delete()
      .eq('id', examId)
      .eq('clinic_id', clinicId)

    if (dbError) throw new Error(dbError.message)

    // 2. Remove o arquivo físico do storage
    await supabase.storage.from(BUCKET_NAME).remove([storagePath])
  },
}
