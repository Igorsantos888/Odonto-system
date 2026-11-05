import React, { useState, useEffect, useTransition } from 'react'
import {
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Filter,
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileText,
  UserCheck,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'
import {
  financialService,
  type FinancialSummary,
} from '../../services/financialService'
import { patientService } from '../../services/patientService'
import {
  transactionFormSchema,
  budgetFormSchema,
  type TransactionFormData,
  type BudgetFormData,
} from '../../schemas/financialSchema'
import type { FinancialTransaction, Budget, Patient, TransactionType } from '../../types'

export const FinanceiroPage: React.FC = () => {
  const { activeClinic, activeRole, user, isAdmin, isFinance } = useAuth()
  const isFinanceAuthorized = isAdmin || isFinance

  const [activeTab, setActiveTab] = useState<'transactions' | 'budgets'>('transactions')
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all')
  const [transactions, setTransactions] = useState<(FinancialTransaction & { patient?: Patient })[]>([])
  const [budgets, setBudgets] = useState<(Budget & { patient?: Patient })[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    pendingIncome: 0,
    pendingExpense: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Modals
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [transactionModalType, setTransactionModalType] = useState<TransactionType>('income')

  // Forms
  const {
    register: registerTx,
    handleSubmit: handleSubmitTx,
    reset: resetTx,
    formState: { errors: errorsTx, isSubmitting: isSubmittingTx },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'income',
      category: '',
      description: '',
      amount: 0,
      due_date: new Date().toISOString().slice(0, 10),
      status: 'paid',
      payment_method: 'pix',
      patient_id: '',
    },
  })

  const {
    register: registerBudget,
    handleSubmit: handleSubmitBudget,
    reset: resetBudget,
    watch: watchBudget,
    formState: { errors: errorsBudget, isSubmitting: isSubmittingBudget },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      title: '',
      patient_id: '',
      total: 0,
      discount: 0,
      payment_terms: '',
      notes: '',
    },
  })

  const budgetTotal = watchBudget('total') || 0
  const budgetDiscount = watchBudget('discount') || 0
  const budgetFinal = Math.max(0, budgetTotal - budgetDiscount)

  const loadData = async () => {
    if (!activeClinic) return
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const [txList, sum, bList, pList] = await Promise.all([
        financialService.getTransactions(
          activeClinic.id,
          filterType === 'all' ? undefined : { type: filterType }
        ),
        financialService.getFinancialSummary(activeClinic.id),
        financialService.getBudgets(activeClinic.id),
        patientService.listPatients(activeClinic.id),
      ])
      setTransactions(txList)
      setSummary(sum)
      setBudgets(bList)
      setPatients(pList)
    } catch (err: unknown) {
      console.error(err)
      setErrorMsg('Não foi possível carregar os registros financeiros.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeClinic?.id, filterType])

  const openNewTransaction = (type: TransactionType) => {
    setTransactionModalType(type)
    resetTx({
      type,
      category: type === 'income' ? 'Procedimento Clínico' : 'Material de Consumo',
      description: '',
      amount: 0,
      due_date: new Date().toISOString().slice(0, 10),
      status: 'paid',
      payment_method: 'pix',
      patient_id: '',
    })
    setIsTransactionModalOpen(true)
  }

  const onSaveTransaction = async (data: TransactionFormData) => {
    if (!activeClinic || !user) return
    try {
      await financialService.createTransaction(activeClinic.id, data, user.id)
      setIsTransactionModalOpen(false)
      startTransition(() => {
        loadData()
      })
    } catch (err: unknown) {
      console.error(err)
      alert('Erro ao salvar transação financeira.')
    }
  }

  const onSaveBudget = async (data: BudgetFormData) => {
    if (!activeClinic || !user) return
    try {
      await financialService.createBudget(activeClinic.id, data, user.id)
      setIsBudgetModalOpen(false)
      resetBudget()
      startTransition(() => {
        loadData()
      })
    } catch (err: unknown) {
      console.error(err)
      alert('Erro ao criar orçamento.')
    }
  }

  const handleMarkAsPaid = async (txId: string) => {
    try {
      await financialService.updateTransactionStatus(txId, 'paid')
      startTransition(() => {
        loadData()
      })
    } catch (err: unknown) {
      console.error(err)
      alert('Erro ao atualizar status para pago.')
    }
  }

  const handleUpdateBudgetStatus = async (budgetId: string, status: Budget['status']) => {
    try {
      await financialService.updateBudgetStatus(budgetId, status)
      startTransition(() => {
        loadData()
      })
    } catch (err: unknown) {
      console.error(err)
      alert('Erro ao atualizar status do orçamento.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Controle Financeiro & Caixa
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Orçamentos clínicos, fluxo de caixa, despesas operacionais e controle de recebíveis
          </p>
        </div>
        {isFinanceAuthorized && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-4 h-4 text-rose-600" />}
              onClick={() => openNewTransaction('expense')}
            >
              Nova Despesa
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-4 h-4 text-emerald-600" />}
              onClick={() => openNewTransaction('income')}
            >
              Nova Receita
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={() => {
                resetBudget()
                setIsBudgetModalOpen(true)
              }}
            >
              Novo Orçamento
            </Button>
          </div>
        )}
      </div>

      {!isFinanceAuthorized && (
        <Alert variant="warning" title="Acesso Restrito ao Módulo Financeiro">
          Seu perfil atual (<strong>{activeRole}</strong>) possui permissão apenas para visualização
          de orçamentos clínicos. A movimentação de fluxo de caixa e faturamento global é restrita
          a administradores e gestores financeiros.
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="critical" title="Erro no carregamento">
          {errorMsg}
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-emerald-50/40 border-emerald-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Total Recebido
              </span>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {formatCurrency(summary.totalIncome)}
              </p>
              {summary.pendingIncome > 0 && (
                <span className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" /> A receber: {formatCurrency(summary.pendingIncome)}
                </span>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/40 border-rose-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Despesas Pagas
              </span>
              <p className="text-2xl font-bold text-rose-900 mt-1">
                {formatCurrency(summary.totalExpense)}
              </p>
              {summary.pendingExpense > 0 && (
                <span className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" /> A pagar: {formatCurrency(summary.pendingExpense)}
                </span>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-teal-50/40 border-teal-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                Saldo Realizado em Caixa
              </span>
              <p
                className={`text-2xl font-bold mt-1 ${
                  summary.netBalance >= 0 ? 'text-teal-900' : 'text-rose-900'
                }`}
              >
                {formatCurrency(summary.netBalance)}
              </p>
              <span className="text-[11px] text-teal-600 mt-1 block">
                Conciliação em tempo real
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'transactions'
              ? 'bg-teal-50 text-teal-700 border border-teal-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Transações & Extrato ({transactions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('budgets')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'budgets'
              ? 'bg-teal-50 text-teal-700 border border-teal-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Orçamentos Clínicos ({budgets.length})
        </button>
      </div>

      {/* Tab: Transactions */}
      {activeTab === 'transactions' && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Lançamentos e Extrato do Período</CardTitle>
              <CardDescription>
                Histórico detalhado de receitas clínicas, despesas de fornecedores e pagamentos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filtro:
              </span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | TransactionType)}
                aria-label="Filtrar por tipo de transação"
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none"
              >
                <option value="all">Todas as transações</option>
                <option value="income">Apenas Receitas</option>
                <option value="expense">Apenas Despesas</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Carregando registros financeiros...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Nenhuma transação encontrada no período selecionado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição / Categoria</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Forma Pgto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    {isFinanceAuthorized && <TableHead className="text-right">Ação</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(tx.due_date)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-xs text-slate-900 block">
                          {tx.description}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {tx.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {tx.patient ? (
                          <span className="font-medium">{tx.patient.full_name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Geral / Clínica</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.type === 'income' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Receita
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-semibold">
                            <ArrowDownRight className="w-3.5 h-3.5" /> Despesa
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 uppercase">
                        {tx.payment_method ? tx.payment_method.replace('_', ' ') : '-'}
                      </TableCell>
                      <TableCell className="font-bold text-xs text-slate-900 whitespace-nowrap">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        {tx.status === 'paid' ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Pago / Recebido
                          </Badge>
                        ) : tx.status === 'pending' ? (
                          <Badge variant="warning" size="sm">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendente
                          </Badge>
                        ) : (
                          <Badge variant="critical" size="sm">
                            <AlertOctagon className="w-3 h-3 mr-1" />
                            {tx.status}
                          </Badge>
                        )}
                      </TableCell>
                      {isFinanceAuthorized && (
                        <TableCell className="text-right">
                          {tx.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsPaid(tx.id)}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            >
                              Baixar
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Budgets */}
      {activeTab === 'budgets' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Orçamentos Odontológicos</CardTitle>
              <CardDescription>
                Propostas comerciais e planos de pagamento para tratamentos dos pacientes
              </CardDescription>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                resetBudget()
                setIsBudgetModalOpen(true)
              }}
            >
              Criar Orçamento
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Carregando orçamentos...</div>
            ) : budgets.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Nenhum orçamento cadastrado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Título / Tratamento</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Total Bruto</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Valor Final</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(b.created_at)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-xs text-slate-900 block">{b.title}</span>
                        {b.payment_terms && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                            {b.payment_terms}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-800">
                        {b.patient?.full_name || 'Paciente'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 line-through">
                        {formatCurrency(b.total)}
                      </TableCell>
                      <TableCell className="text-xs text-rose-600">
                        {b.discount > 0 ? `-${formatCurrency(b.discount)}` : '-'}
                      </TableCell>
                      <TableCell className="font-bold text-xs text-slate-900 whitespace-nowrap">
                        {formatCurrency(b.final_total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            b.status === 'approved'
                              ? 'success'
                              : b.status === 'sent'
                              ? 'info'
                              : b.status === 'rejected'
                              ? 'critical'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {b.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {b.status === 'draft'
                            ? 'Rascunho'
                            : b.status === 'sent'
                            ? 'Enviado'
                            : b.status === 'approved'
                            ? 'Aprovado'
                            : b.status === 'rejected'
                            ? 'Recusado'
                            : 'Faturado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {b.status !== 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateBudgetStatus(b.id, 'approved')}
                            leftIcon={<UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                          >
                            Aprovar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal: Nova Transação (Receita ou Despesa) */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title={transactionModalType === 'income' ? 'Registrar Nova Receita' : 'Registrar Nova Despesa'}
        description="Lançamento com impacto no fluxo de caixa e relatórios financeiros da clínica."
      >
        <form onSubmit={handleSubmitTx(onSaveTransaction)} className="space-y-4">
          <input type="hidden" {...registerTx('type')} value={transactionModalType} />

          <Input
            label="Descrição do Lançamento *"
            placeholder="Ex: Pagamento Restauração em Resina / Compra de Anestésico"
            error={errorsTx.description?.message}
            {...registerTx('description')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Categoria *"
              placeholder="Ex: Procedimento Clínico, Prótese, Consumo"
              error={errorsTx.category?.message}
              {...registerTx('category')}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                aria-label="Valor em reais"
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:border-teal-500 focus:outline-none"
                {...registerTx('amount', { valueAsNumber: true })}
              />
              {errorsTx.amount && (
                <span className="text-xs text-rose-500 mt-1 block">
                  {errorsTx.amount.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Data de Vencimento *"
              error={errorsTx.due_date?.message}
              {...registerTx('due_date')}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Forma de Pagamento
              </label>
              <select
                aria-label="Forma de pagamento"
                className="w-full h-9 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
                {...registerTx('payment_method')}
              >
                <option value="pix">PIX</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="cash">Dinheiro em Espécie</option>
                <option value="bank_slip">Boleto Bancário</option>
                <option value="transfer">Transferência Bancária</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Paciente Associado (Opcional)
              </label>
              <select
                aria-label="Paciente associado"
                className="w-full h-9 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
                {...registerTx('patient_id')}
              >
                <option value="">Sem vínculo com paciente (Despesa geral)</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Situação do Pagamento *
              </label>
              <select
                aria-label="Situação do pagamento"
                className="w-full h-9 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
                {...registerTx('status')}
              >
                <option value="paid">Já Quitado / Recebido</option>
                <option value="pending">Pendente / A Pagar / A Receber</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransactionModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingTx || isPending}
            >
              Salvar Lançamento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Novo Orçamento */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Novo Orçamento Odontológico"
        description="Apresente propostas de tratamento aos pacientes com cálculo automático de descontos."
      >
        <form onSubmit={handleSubmitBudget(onSaveBudget)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Paciente *
            </label>
            <select
              aria-label="Paciente do orçamento"
              className="w-full h-9 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
              {...registerBudget('patient_id')}
            >
              <option value="">Selecione o paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.cpf})
                </option>
              ))}
            </select>
            {errorsBudget.patient_id && (
              <span className="text-xs text-rose-500 mt-1 block">
                {errorsBudget.patient_id.message}
              </span>
            )}
          </div>

          <Input
            label="Título da Proposta *"
            placeholder="Ex: Reabilitação Oral com Coroas Cerâmicas"
            error={errorsBudget.title?.message}
            {...registerBudget('title')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                aria-label="Valor total em reais"
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:border-teal-500 focus:outline-none"
                {...registerBudget('total', { valueAsNumber: true })}
              />
              {errorsBudget.total && (
                <span className="text-xs text-rose-500 mt-1 block">
                  {errorsBudget.total.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Desconto Concedido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                aria-label="Desconto em reais"
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:border-teal-500 focus:outline-none"
                {...registerBudget('discount', { valueAsNumber: true })}
              />
              {errorsBudget.discount && (
                <span className="text-xs text-rose-500 mt-1 block">
                  {errorsBudget.discount.message}
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between border border-slate-200">
            <span className="text-xs font-medium text-slate-600">Valor Final com Desconto:</span>
            <span className="text-base font-bold text-teal-700">{formatCurrency(budgetFinal)}</span>
          </div>

          <Input
            label="Condições e Forma de Pagamento"
            placeholder="Ex: Entrada 50% no PIX + 3x sem juros no cartão de crédito"
            {...registerBudget('payment_terms')}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Observações Clínicas e Validade
            </label>
            <textarea
              rows={2}
              aria-label="Observações do orçamento"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-teal-500 focus:outline-none"
              placeholder="Orçamento válido por 30 dias. Não inclui possíveis tratamentos de urgência."
              {...registerBudget('notes')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBudgetModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingBudget || isPending}
            >
              Salvar Orçamento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
