import { z } from 'zod'

export const laboratoryFormSchema = z.object({
  name: z.string().min(2, 'O nome do laboratório é obrigatório'),
  contact_person: z.string().optional(),
  phone: z.string().min(8, 'Telefone de contato é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  address: z.string().optional(),
})

export type LaboratoryFormData = z.infer<typeof laboratoryFormSchema>

export const laboratoryJobFormSchema = z.object({
  laboratory_id: z.string().min(1, 'Selecione o laboratório'),
  patient_id: z.string().min(1, 'Selecione o paciente'),
  professional_id: z.string().min(1, 'Selecione o dentista responsável'),
  prosthesis_type: z.string().min(2, 'Tipo de prótese é obrigatório (ex: Coroa E-max)'),
  tooth_numbers: z.string().optional(),
  color_shade: z.string().optional(),
  due_at: z.string().min(10, 'Data de previsão de entrega é obrigatória'),
  cost: z.number().min(0, 'Custo não pode ser negativo'),
  notes: z.string().optional(),
})

export type LaboratoryJobFormData = z.infer<typeof laboratoryJobFormSchema>
