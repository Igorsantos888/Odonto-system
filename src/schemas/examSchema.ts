import { z } from 'zod'

export const examFormSchema = z.object({
  title: z
    .string()
    .min(3, 'O título do exame deve conter ao menos 3 caracteres')
    .max(100, 'O título não deve exceder 100 caracteres'),
  exam_type: z.enum([
    'panoramic',
    'periapical',
    'bite_wing',
    'tomography',
    'photo',
    'report_pdf',
  ]),
  exam_date: z.string().min(1, 'A data do exame é obrigatória'),
  notes: z.string().optional(),
})

export type ExamFormData = z.infer<typeof examFormSchema>

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
]

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15 Megabytes

export function validateExamFile(file: File): { isValid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Formato de arquivo não autorizado (${file.type}). Permitidos apenas JPEG, PNG e PDF.`,
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `O arquivo excede o limite máximo permitido de 15 MB (${(
        file.size /
        (1024 * 1024)
      ).toFixed(1)} MB enviados).`,
    }
  }

  return { isValid: true }
}
