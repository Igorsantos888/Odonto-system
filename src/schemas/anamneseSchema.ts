import { z } from 'zod'

export const anamneseFormSchema = z.object({
  allergies: z.string().optional(),
  continuous_medications: z.string().optional(),
  systemic_diseases: z.string().optional(),
  has_cardiac_condition: z.boolean(),
  has_diabetes: z.boolean(),
  has_hypertension: z.boolean(),
  has_bleeding_disorder: z.boolean(),
  is_pregnant_or_lactating: z.boolean(),
  has_critical_alert: z.boolean(),
  critical_alert_notes: z.string().optional(),
  clinical_notes: z.string().optional(),
  change_reason: z.string().optional(),
})

export type AnamneseFormData = z.infer<typeof anamneseFormSchema>
