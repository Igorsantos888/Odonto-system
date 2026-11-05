import React, { useState, useEffect } from 'react'
import {
  Plus,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'
import { patientService } from '../../services/patientService'
import type { TreatmentPlan, Patient } from '../../types'

const MOCK_PLANS: (TreatmentPlan & { patient_name?: string })[] = [
  {
    id: 'tp-1',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    patient_name: 'Mariana Ribeiro Alves',
    professional_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    title: 'Reabilitação Posterior & Endodontia',
    status: 'in_progress',
    total_amount: 3850,
    discount_amount: 0,
    final_amount: 3850,
    created_at: '2026-10-20T10:00:00Z',
    items: [
      {
        id: 'ti-1',
        plan_id: 'tp-1',
        procedure_id: 'p-1',
        tooth_code: 16,
        face_codes: 'MOD',
        status: 'completed',
        price: 1450,
        procedure: {
          id: 'p-1',
          clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          code: 'ENDO-16',
          name: 'Tratamento Endodôntico (Canais Radiculares)',
          default_price: 1450,
          estimated_minutes: 60,
          active: true,
        },
      },
      {
        id: 'ti-2',
        plan_id: 'tp-1',
        procedure_id: 'p-2',
        tooth_code: 16,
        status: 'in_progress',
        price: 1800,
        procedure: {
          id: 'p-2',
          clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          code: 'PROT-COROA',
          name: 'Coroa Cerâmica E-Max Pura c/ Pino de Fibra',
          default_price: 1800,
          estimated_minutes: 45,
          active: true,
        },
      },
      {
        id: 'ti-3',
        plan_id: 'tp-1',
        procedure_id: 'p-3',
        tooth_code: 26,
        face_codes: 'O',
        status: 'pending',
        price: 600,
        procedure: {
          id: 'p-3',
          clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          code: 'REST-RESINA',
          name: 'Restauração em Resina Composta Direta',
          default_price: 600,
          estimated_minutes: 30,
          active: true,
        },
      },
    ],
  },
  {
    id: 'tp-2',
    clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    patient_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
    patient_name: 'Carlos Eduardo Costa',
    professional_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    title: 'Estética Anterior & Coroas Cerâmicas',
    status: 'completed',
    total_amount: 4400,
    discount_amount: 400,
    final_amount: 4000,
    created_at: '2026-10-15T14:00:00Z',
    items: [
      {
        id: 'ti-4',
        plan_id: 'tp-2',
        procedure_id: 'p-4',
        tooth_code: 11,
        status: 'completed',
        price: 2000,
        procedure: {
          id: 'p-4',
          clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          code: 'PROT-COROA-11',
          name: 'Coroa Anterior Cerâmica E-max (11)',
          default_price: 2000,
          estimated_minutes: 45,
          active: true,
        },
      },
      {
        id: 'ti-5',
        plan_id: 'tp-2',
        procedure_id: 'p-5',
        tooth_code: 21,
        status: 'completed',
        price: 2000,
        procedure: {
          id: 'p-5',
          clinic_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          code: 'PROT-COROA-21',
          name: 'Coroa Anterior Cerâmica E-max (21)',
          default_price: 2000,
          estimated_minutes: 45,
          active: true,
        },
      },
    ],
  },
]

export const TratamentosPage: React.FC = () => {
  const { activeClinic } = useAuth()
  const [plans, setPlans] = useState<(TreatmentPlan & { patient_name?: string })[]>(MOCK_PLANS)
  const [patients, setPatients] = useState<Patient[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPatientId, setNewPatientId] = useState('')
  const [newAmount, setNewAmount] = useState<number>(1500)

  useEffect(() => {
    if (activeClinic) {
      patientService.listPatients(activeClinic.id).then(setPatients).catch(console.error)
    }
  }, [activeClinic?.id])

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newPatientId) return

    const patient = patients.find((p) => p.id === newPatientId)
    const newPlan: TreatmentPlan & { patient_name?: string } = {
      id: crypto.randomUUID(),
      clinic_id: activeClinic?.id || '',
      patient_id: newPatientId,
      patient_name: patient?.full_name || 'Paciente',
      professional_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
      title: newTitle,
      status: 'approved',
      total_amount: newAmount,
      final_amount: newAmount,
      created_at: new Date().toISOString(),
      items: [
        {
          id: crypto.randomUUID(),
          plan_id: 'new',
          procedure_id: 'p-new',
          status: 'pending',
          price: newAmount,
          procedure: {
            id: 'p-new',
            clinic_id: activeClinic?.id || '',
            code: 'PROC-NOVO',
            name: newTitle,
            default_price: newAmount,
            estimated_minutes: 45,
            active: true,
          },
        },
      ],
    }

    setPlans([newPlan, ...plans])
    setIsModalOpen(false)
    setNewTitle('')
    setNewPatientId('')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Planos de Tratamento Clínico
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Planejamento clínico integrado, orçamentos e evolução dos procedimentos por dente
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Criar Novo Plano
        </Button>
      </div>

      <Alert variant="info" title="Integração Odontograma & Financeiro">
        Os planos de tratamento conectam os achados do <strong>Odontograma</strong> (dentes e faces)
        às propostas de <strong>Orçamento</strong> e transações de pagamento da clínica.
      </Alert>

      {/* Plans List */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base text-slate-900">{plan.title}</CardTitle>
                  <Badge
                    variant={
                      plan.status === 'completed'
                        ? 'success'
                        : plan.status === 'in_progress'
                        ? 'warning'
                        : 'info'
                    }
                    size="sm"
                  >
                    {plan.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {plan.status === 'in_progress' && <Clock className="w-3 h-3 mr-1" />}
                    {plan.status === 'completed'
                      ? 'Concluído'
                      : plan.status === 'in_progress'
                      ? 'Em Andamento'
                      : 'Aprovado'}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Paciente: <strong>{plan.patient_name}</strong> • Criado em:{' '}
                  {formatDate(plan.created_at)}
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total do Plano:</span>
                <span className="text-lg font-bold text-teal-700">
                  {formatCurrency(plan.final_amount)}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-2 pt-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Procedimentos Planejados:
              </span>
              {plan.items?.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-800">
                        {item.tooth_code ? `Dente ${item.tooth_code}` : 'Geral'} —{' '}
                        {item.procedure?.name}
                      </span>
                      {item.face_codes && (
                        <span className="text-[11px] text-slate-500 block">
                          Faces: {item.face_codes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">
                      {formatCurrency(item.price)}
                    </span>
                    <Badge
                      variant={item.status === 'completed' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {item.status === 'completed'
                        ? 'Realizado'
                        : item.status === 'in_progress'
                        ? 'Em Execução'
                        : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal: Novo Plano */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Plano de Tratamento"
        description="Cadastre um novo plano odontológico vinculado ao prontuário do paciente."
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Paciente *
            </label>
            <select
              aria-label="Paciente do plano"
              value={newPatientId}
              onChange={(e) => setNewPatientId(e.target.value)}
              required
              className="w-full h-9 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              <option value="">Selecione o paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.cpf})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Título do Plano de Tratamento *"
            placeholder="Ex: Reabilitação Oral com Resinas e Prótese"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Valor Estimado do Tratamento (R$) *
            </label>
            <input
              type="number"
              aria-label="Valor estimado"
              value={newAmount}
              onChange={(e) => setNewAmount(Number(e.target.value))}
              required
              min={0}
              step="0.01"
              className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Plano
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
