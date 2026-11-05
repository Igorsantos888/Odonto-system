import { z } from 'zod'

export const transactionFormSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(2, 'Categoria é obrigatória'),
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  amount: z.number().positive('O valor deve ser maior que zero'),
  due_date: z.string().min(10, 'Data de vencimento inválida'),
  status: z.enum(['pending', 'paid']),
  payment_method: z
    .enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_slip', 'transfer'])
    .optional(),
  patient_id: z.string().optional(),
})

export type TransactionFormData = z.infer<typeof transactionFormSchema>

export const budgetFormSchema = z.object({
  patient_id: z.string().min(1, 'Selecione o paciente'),
  title: z.string().min(3, 'O título do orçamento é obrigatório'),
  total: z.number().positive('O valor total deve ser positivo'),
  discount: z.number().min(0, 'Desconto não pode ser negativo'),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
})

export type BudgetFormData = z.infer<typeof budgetFormSchema>
