import { z } from 'zod'

export const appointmentFormSchema = z.object({
  patient_id: z.string().min(1, 'Selecione o paciente'),
  professional_id: z.string().min(1, 'Selecione o cirurgião-dentista'),
  date: z.string().min(1, 'Selecione a data da consulta'),
  start_time: z
    .string()
    .min(1, 'Informe o horário de início')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido (use formato HH:MM)'),
  duration_minutes: z
    .number()
    .min(15, 'Duração mínima de 15 minutos')
    .max(240, 'Duração máxima de 240 minutos'),
  procedure_title: z
    .string()
    .min(3, 'Informe o procedimento previsto')
    .max(120, 'Título muito extenso'),
  notes: z.string().optional(),
})

export type AppointmentFormData = z.infer<typeof appointmentFormSchema>
