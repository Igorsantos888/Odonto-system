import { z } from 'zod'

export const patientFormSchema = z.object({
  full_name: z
    .string()
    .min(3, 'O nome deve conter ao menos 3 caracteres')
    .max(120, 'O nome não deve exceder 120 caracteres'),
  cpf: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        const clean = val.replace(/\D/g, '')
        return clean.length === 11
      },
      { message: 'O CPF deve conter exatamente 11 dígitos numéricos' }
    ),
  birth_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        const date = new Date(val)
        return !isNaN(date.getTime()) && date <= new Date()
      },
      { message: 'Informe uma data de nascimento válida (não pode ser futura)' }
    ),
  gender: z.enum(['M', 'F', 'outro']).optional(),
  phone: z
    .string()
    .min(1, 'O telefone/celular é obrigatório')
    .refine(
      (val) => {
        const clean = val.replace(/\D/g, '')
        return clean.length >= 10 && clean.length <= 11
      },
      { message: 'Telefone inválido. Informe DDD + 8 ou 9 dígitos' }
    ),
  email: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        return z.string().email().safeParse(val).success
      },
      { message: 'Informe um endereço de e-mail válido' }
    ),
  address: z.string().optional(),
  professional_id: z.string().optional(),
  notes: z.string().optional(),
})

export type PatientFormData = z.infer<typeof patientFormSchema>
