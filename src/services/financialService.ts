import { supabase, isSupabaseConfigured } from './supabase'
import type { FinancialTransaction, Budget, TransactionType, TransactionStatus, Patient } from '../types'
import type { TransactionFormData, BudgetFormData } from '../schemas/financialSchema'

// Mock inicial para modo de demonstração
let mockTransactions: (FinancialTransaction & { patient?: Patient })[] = [
  {
    id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f01',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    type: 'income',
    category: 'Procedimentos Clínicos',
    description: 'Tratamento Endodôntico Dente 16 (Entrada)',
    amount: 1450.0,
    due_date: '2026-10-25',
    paid_at: '2026-10-25T14:30:00Z',
    status: 'paid',
    payment_method: 'credit_card',
    created_at: '2026-10-25T14:30:00Z',
    patient: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
      clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'Mariana Ribeiro Alves',
      cpf: '12345678901',
      phone: '11987654321',
      created_at: '',
    },
  },
  {
    id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f02',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
    type: 'income',
    category: 'Prótese Dentária',
    description: 'Instalação Coroa Cerâmica E-max Dente 21',
    amount: 2200.0,
    due_date: '2026-10-28',
    paid_at: '2026-10-28T16:00:00Z',
    status: 'paid',
    payment_method: 'pix',
    created_at: '2026-10-28T16:00:00Z',
    patient: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
      clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'Carlos Eduardo Costa',
      cpf: '98765432100',
      phone: '11976543210',
      created_at: '',
    },
  },
  {
    id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f03',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    type: 'expense',
    category: 'Laboratório Protético',
    description: 'Fatura Dental Arte - Coroa e-max Carlos Eduardo',
    amount: 650.0,
    due_date: '2026-10-31',
    paid_at: '2026-10-30T10:00:00Z',
    status: 'paid',
    payment_method: 'transfer',
    created_at: '2026-10-20T10:00:00Z',
  },
  {
    id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f04',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    type: 'expense',
    category: 'Material de Consumo',
    description: 'Dentária Sul - Anestésicos, Luvas e Resinas',
    amount: 1120.0,
    due_date: '2026-11-05',
    status: 'pending',
    payment_method: 'bank_slip',
    created_at: '2026-10-24T11:00:00Z',
  },
  {
    id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f05',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03',
    type: 'income',
    category: 'Ortodontia',
    description: 'Mensalidade Manutenção Aparelho Fixo',
    amount: 250.0,
    due_date: '2026-11-10',
    status: 'pending',
    payment_method: 'pix',
    created_at: '2026-10-26T09:00:00Z',
    patient: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03',
      clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'Beatriz Lima Souza',
      cpf: '45678901234',
      phone: '11965432109',
      created_at: '',
    },
  },
]

let mockBudgets: (Budget & { patient?: Patient })[] = [
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
    title: 'Reabilitação Anterior em Cerâmica',
    total: 4400.0,
    discount: 400.0,
    final_total: 4000.0,
    status: 'approved',
    payment_terms: 'Entrada de R$ 2.000 + 2x no cartão de crédito',
    notes: 'Coroas de Dissilicato de Lítio nos elementos 11 e 21.',
    created_by: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    created_at: '2026-10-20T11:00:00Z',
    patient: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
      clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'Carlos Eduardo Costa',
      cpf: '98765432100',
      phone: '11976543210',
      created_at: '',
    },
  },
]

export interface FinancialSummary {
  totalIncome: number
  totalExpense: number
  netBalance: number
  pendingIncome: number
  pendingExpense: number
}

export const financialService = {
  async getTransactions(
    clinicId: string,
    filter?: { type?: TransactionType; status?: TransactionStatus }
  ): Promise<(FinancialTransaction & { patient?: Patient })[]> {
    if (!isSupabaseConfigured) {
      let list = mockTransactions.filter((tx) => tx.clinic_id === clinicId)
      if (filter?.type) {
        list = list.filter((tx) => tx.type === filter.type)
      }
      if (filter?.status) {
        list = list.filter((tx) => tx.status === filter.status)
      }
      return list.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
    }

    let query = supabase
      .from('financial_transactions')
      .select('*, patient:patients(id, full_name, cpf, phone)')
      .eq('clinic_id', clinicId)
      .order('due_date', { ascending: false })

    if (filter?.type) {
      query = query.eq('type', filter.type)
    }
    if (filter?.status) {
      query = query.eq('status', filter.status)
    }

    const { data, error } = await query
    if (error) {
      console.error('Erro ao buscar transações financeiras:', error)
      throw error
    }
    return data || []
  },

  async getFinancialSummary(clinicId: string): Promise<FinancialSummary> {
    const transactions = await this.getTransactions(clinicId)

    let totalIncome = 0
    let totalExpense = 0
    let pendingIncome = 0
    let pendingExpense = 0

    for (const tx of transactions) {
      const amt = Number(tx.amount) || 0
      if (tx.type === 'income') {
        if (tx.status === 'paid') totalIncome += amt
        if (tx.status === 'pending') pendingIncome += amt
      } else if (tx.type === 'expense') {
        if (tx.status === 'paid') totalExpense += amt
        if (tx.status === 'pending') pendingExpense += amt
      }
    }

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      pendingIncome,
      pendingExpense,
    }
  },

  async createTransaction(
    clinicId: string,
    data: TransactionFormData,
    userId: string
  ): Promise<FinancialTransaction> {
    if (!isSupabaseConfigured) {
      const newTx: FinancialTransaction = {
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        patient_id: data.patient_id,
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount,
        due_date: data.due_date,
        paid_at: data.status === 'paid' ? new Date().toISOString() : undefined,
        status: data.status,
        payment_method: data.payment_method,
        created_at: new Date().toISOString(),
      }
      mockTransactions.unshift(newTx)
      return newTx
    }

    const payload = {
      clinic_id: clinicId,
      patient_id: data.patient_id || null,
      type: data.type,
      category: data.category,
      description: data.description,
      amount: data.amount,
      due_date: data.due_date,
      paid_at: data.status === 'paid' ? new Date().toISOString() : null,
      status: data.status,
      payment_method: data.payment_method || null,
      created_by: userId,
    }

    const { data: inserted, error } = await supabase
      .from('financial_transactions')
      .insert(payload)
      .select('*, patient:patients(id, full_name, cpf, phone)')
      .single()

    if (error) {
      console.error('Erro ao registrar transação:', error)
      throw error
    }
    return inserted
  },

  async updateTransactionStatus(
    id: string,
    status: TransactionStatus
  ): Promise<void> {
    const paidAt = status === 'paid' ? new Date().toISOString() : null

    if (!isSupabaseConfigured) {
      const idx = mockTransactions.findIndex((tx) => tx.id === id)
      if (idx !== -1) {
        mockTransactions[idx].status = status
        mockTransactions[idx].paid_at = paidAt || undefined
      }
      return
    }

    const { error } = await supabase
      .from('financial_transactions')
      .update({ status, paid_at: paidAt })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar status da transação:', error)
      throw error
    }
  },

  async getBudgets(clinicId: string): Promise<(Budget & { patient?: Patient })[]> {
    if (!isSupabaseConfigured) {
      return mockBudgets.filter((b) => b.clinic_id === clinicId)
    }

    const { data, error } = await supabase
      .from('budgets')
      .select('*, patient:patients(id, full_name, cpf, phone)')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar orçamentos:', error)
      throw error
    }
    return data || []
  },

  async createBudget(
    clinicId: string,
    data: BudgetFormData,
    userId: string
  ): Promise<Budget> {
    const finalTotal = Math.max(0, data.total - data.discount)

    if (!isSupabaseConfigured) {
      const newBudget: Budget = {
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        patient_id: data.patient_id,
        title: data.title,
        total: data.total,
        discount: data.discount,
        final_total: finalTotal,
        status: 'draft',
        payment_terms: data.payment_terms,
        notes: data.notes,
        created_by: userId,
        created_at: new Date().toISOString(),
      }
      mockBudgets.unshift(newBudget)
      return newBudget
    }

    const payload = {
      clinic_id: clinicId,
      patient_id: data.patient_id,
      title: data.title,
      total: data.total,
      discount: data.discount,
      final_total: finalTotal,
      status: 'draft',
      payment_terms: data.payment_terms || null,
      notes: data.notes || null,
      created_by: userId,
    }

    const { data: inserted, error } = await supabase
      .from('budgets')
      .insert(payload)
      .select('*, patient:patients(id, full_name, cpf, phone)')
      .single()

    if (error) {
      console.error('Erro ao criar orçamento:', error)
      throw error
    }
    return inserted
  },

  async updateBudgetStatus(id: string, status: Budget['status']): Promise<void> {
    if (!isSupabaseConfigured) {
      const idx = mockBudgets.findIndex((b) => b.id === id)
      if (idx !== -1) {
        mockBudgets[idx].status = status
      }
      return
    }

    const { error } = await supabase
      .from('budgets')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar status do orçamento:', error)
      throw error
    }
  },
}
