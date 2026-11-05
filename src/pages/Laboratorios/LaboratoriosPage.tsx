import React, { useState, useEffect, useTransition } from 'react'
import {
  FlaskConical,
  Plus,
  Phone,
  Clock,
  AlertOctagon,
  CheckCircle2,
  Building2,
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
import { laboratoryService } from '../../services/laboratoryService'
import { patientService } from '../../services/patientService'
import {
  laboratoryFormSchema,
  laboratoryJobFormSchema,
  type LaboratoryFormData,
  type LaboratoryJobFormData,
} from '../../schemas/laboratorySchema'
import type { Laboratory, LaboratoryJob, LabJobStatus, Patient, Profile } from '../../types'

export const LaboratoriosPage: React.FC = () => {
  const { activeClinic, user } = useAuth()

  const [activeTab, setActiveTab] = useState<'jobs' | 'labs'>('jobs')
  const [jobs, setJobs] = useState<
    (LaboratoryJob & {
      laboratory?: Laboratory
      patient?: Patient
      professional?: Profile
    })[]
  >([])
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [professionals, setProfessionals] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Modals
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)
  const [isLabModalOpen, setIsLabModalOpen] = useState(false)

  // Forms
  const {
    register: registerJob,
    handleSubmit: handleSubmitJob,
    reset: resetJob,
    formState: { errors: errorsJob, isSubmitting: isSubmittingJob },
  } = useForm<LaboratoryJobFormData>({
    resolver: zodResolver(laboratoryJobFormSchema),
    defaultValues: {
      laboratory_id: '',
      patient_id: '',
      professional_id: '',
      prosthesis_type: '',
      tooth_numbers: '',
      color_shade: '',
      due_at: '',
      cost: 0,
      notes: '',
    },
  })

  const {
    register: registerLab,
    handleSubmit: handleSubmitLab,
    reset: resetLab,
    formState: { errors: errorsLab, isSubmitting: isSubmittingLab },
  } = useForm<LaboratoryFormData>({
    resolver: zodResolver(laboratoryFormSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
    },
  })

  const loadData = async () => {
    if (!activeClinic) return
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const [jList, lList, pList, profList] = await Promise.all([
        laboratoryService.getJobs(activeClinic.id),
        laboratoryService.getLaboratories(activeClinic.id),
        patientService.listPatients(activeClinic.id),
        patientService.listClinicDentists(activeClinic.id),
      ])
      setJobs(jList)
      setLaboratories(lList)
      setPatients(pList)
      setProfessionals(profList)
    } catch (err: unknown) {
      console.error(err)
      setErrorMsg('Não foi possível carregar os trabalhos protéticos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeClinic?.id])

  const onSaveJob = async (data: LaboratoryJobFormData) => {
    if (!activeClinic || !user) return
    try {
      await laboratoryService.createJob(activeClinic.id, data, user.id)
      setIsJobModalOpen(false)
      resetJob()
      startTransition(() => {
        loadData()
      })
    } catch (err: unknown) {
      console.error(err)
      alert('Erro ao enviar ordem para laboratório.')
    }
  }

  const onSaveLab = async (data: LaboratoryFormData) => {
    if (!activeClinic) return
    try {
      await laboratoryService.createLaboratory(activeClinic.id, data)
      setIsLabModalOpen(false)
      resetLab()
      startTransition(() => {
        loadData()
      })
    } catch (err: unknown) {
      console.error(err)
      alert('Erro ao cadastrar laboratório parceiro.')
    }
  }

  const handleUpdateStatus = async (jobId: string, newStatus: LabJobStatus) => {
    try {
      await laboratoryService.updateJobStatus(jobId, newStatus)
      startTransition(() => {
        loadData()
      })
    } catch (err: unknown) {
      console.error(err)
      alert('Erro ao atualizar status da peça protética.')
    }
  }

  const isJobOverdue = (dueAt: string, status: LabJobStatus) => {
    if (status === 'received' || status === 'applied') return false
    const due = new Date(dueAt).getTime()
    const today = new Date().setHours(0, 0, 0, 0)
    return due < today
  }

  const isJobNearDeadline = (dueAt: string, status: LabJobStatus) => {
    if (status === 'received' || status === 'applied') return false
    const due = new Date(dueAt).getTime()
    const today = new Date().setHours(0, 0, 0, 0)
    const diffDays = (due - today) / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays <= 2
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laboratórios de Prótese & Peças Protéticas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle de pedidos enviados a laboratórios parceiros, prazos de entrega e custos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Building2 className="w-4 h-4" />}
            onClick={() => {
              resetLab()
              setIsLabModalOpen(true)
            }}
          >
            Cadastrar Laboratório
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetJob({
                laboratory_id: laboratories[0]?.id || '',
                patient_id: patients[0]?.id || '',
                professional_id: professionals[0]?.id || '',
                prosthesis_type: '',
                tooth_numbers: '',
                color_shade: '',
                due_at: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                cost: 0,
                notes: '',
              })
              setIsJobModalOpen(true)
            }}
          >
            Enviar Novo Trabalho
          </Button>
        </div>
      </div>

      <Alert variant="warning" title="Diretriz de Acessibilidade & Prazos Clínicos (Etapa 8)">
        Conforme norma de segurança visual: a cor <strong>amarela</strong> sinaliza prazos próximos
        ou trabalhos em confecção acompanhados do ícone de relógio e texto explícito. Atrasos reais
        são destacados em <strong>vermelho</strong> para cobrança ágil junto ao protético.
      </Alert>

      {errorMsg && (
        <Alert variant="critical" title="Erro no carregamento">
          {errorMsg}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('jobs')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'jobs'
              ? 'bg-teal-50 text-teal-700 border border-teal-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ordens de Serviço Protéticas ({jobs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('labs')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'labs'
              ? 'bg-teal-50 text-teal-700 border border-teal-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Laboratórios Parceiros ({laboratories.length})
        </button>
      </div>

      {/* Tab: Jobs */}
      {activeTab === 'jobs' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-600" />
              <span>Trabalhos em Aberto & Histórico Recente</span>
            </CardTitle>
            <CardDescription>
              Acompanhamento de prazos para evitar atrasos na consulta de instalação do paciente
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Carregando trabalhos protéticos...
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Nenhum trabalho protético registrado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trabalho / Prótese</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Laboratório / Contato</TableHead>
                    <TableHead>Cor / Dentes</TableHead>
                    <TableHead>Datas (Envio / Previsão)</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Status / Alerta</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((item) => {
                    const overdue = isJobOverdue(item.due_at, item.status)
                    const nearDeadline = isJobNearDeadline(item.due_at, item.status)

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <span className="font-semibold text-slate-900 text-xs block">
                            {item.prosthesis_type}
                          </span>
                          {item.professional && (
                            <span className="text-[11px] text-slate-400">
                              Dr(a). {item.professional.full_name}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-800 font-medium">
                          {item.patient?.full_name || 'Paciente'}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="font-medium text-slate-800 block">
                              {item.laboratory?.name || 'Laboratório'}
                            </span>
                            {item.laboratory?.phone && (
                              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {item.laboratory.phone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-600">
                          {item.tooth_numbers ? `Dentes: ${item.tooth_numbers}` : 'Geral'}
                          {item.color_shade && (
                            <span className="block text-[11px] text-teal-700 font-semibold">
                              Cor: {item.color_shade}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                          <div>Envio: {formatDate(item.sent_at)}</div>
                          <div
                            className={`font-semibold ${
                              overdue
                                ? 'text-rose-600 font-bold'
                                : nearDeadline
                                ? 'text-amber-600 font-bold'
                                : 'text-slate-800'
                            }`}
                          >
                            Prev: {formatDate(item.due_at)}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-xs text-slate-900 whitespace-nowrap">
                          {formatCurrency(item.cost)}
                        </TableCell>
                        <TableCell>
                          {overdue ? (
                            <Badge variant="critical" size="sm">
                              <AlertOctagon className="w-3 h-3 mr-1" />
                              Prazo Vencido
                            </Badge>
                          ) : nearDeadline ? (
                            <Badge variant="warning" size="sm">
                              <Clock className="w-3 h-3 mr-1" />
                              Prazo Próximo (48h)
                            </Badge>
                          ) : item.status === 'applied' ? (
                            <Badge variant="success" size="sm">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Instalada no Paciente
                            </Badge>
                          ) : item.status === 'received' ? (
                            <Badge variant="success" size="sm">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Recebido na Clínica
                            </Badge>
                          ) : item.status === 'in_production' ? (
                            <Badge variant="info" size="sm">
                              <Clock className="w-3 h-3 mr-1" />
                              Em Produção
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              <Clock className="w-3 h-3 mr-1" />
                              Enviado ao Protético
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {item.status === 'sent' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(item.id, 'received')}
                              leftIcon={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            >
                              Receber
                            </Button>
                          )}
                          {item.status === 'in_production' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(item.id, 'received')}
                              leftIcon={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            >
                              Receber
                            </Button>
                          )}
                          {item.status === 'received' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleUpdateStatus(item.id, 'applied')}
                              leftIcon={<CheckCircle2 className="w-3 h-3 text-white" />}
                            >
                              Instalar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Labs */}
      {activeTab === 'labs' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Laboratórios Credenciados</CardTitle>
              <CardDescription>
                Lista de profissionais TPD e laboratórios de prótese cadastrados
              </CardDescription>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                resetLab()
                setIsLabModalOpen(true)
              }}
            >
              Novo Laboratório
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {laboratories.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Nenhum laboratório cadastrado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Laboratório</TableHead>
                    <TableHead>Responsável Técnico / Contato</TableHead>
                    <TableHead>Telefone / WhatsApp</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laboratories.map((lab) => (
                    <TableRow key={lab.id}>
                      <TableCell className="font-semibold text-xs text-slate-900">
                        {lab.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {lab.contact_person || '-'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-700">
                        {lab.phone}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {lab.email || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                        {lab.address || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={lab.active ? 'success' : 'neutral'} size="sm">
                          {lab.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal: Novo Trabalho */}
      <Modal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        title="Enviar Trabalho para Laboratório"
        description="Emissão de ordem de serviço protética com registro de cor, dentes e prazo."
      >
        <form onSubmit={handleSubmitJob(onSaveJob)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Laboratório *
              </label>
              <select
                aria-label="Laboratório"
                className="w-full h-9 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
                {...registerJob('laboratory_id')}
              >
                <option value="">Selecione o laboratório</option>
                {laboratories.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
              {errorsJob.laboratory_id && (
                <span className="text-xs text-rose-500 mt-1 block">
                  {errorsJob.laboratory_id.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Paciente *
              </label>
              <select
                aria-label="Paciente"
                className="w-full h-9 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
                {...registerJob('patient_id')}
              >
                <option value="">Selecione o paciente</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.cpf})
                  </option>
                ))}
              </select>
              {errorsJob.patient_id && (
                <span className="text-xs text-rose-500 mt-1 block">
                  {errorsJob.patient_id.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dentista Responsável *
              </label>
              <select
                aria-label="Dentista responsável"
                className="w-full h-9 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
                {...registerJob('professional_id')}
              >
                <option value="">Selecione o profissional</option>
                {professionals.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.full_name} ({prof.cro || 'Dentista'})
                  </option>
                ))}
              </select>
              {errorsJob.professional_id && (
                <span className="text-xs text-rose-500 mt-1 block">
                  {errorsJob.professional_id.message}
                </span>
              )}
            </div>

            <Input
              label="Tipo de Prótese / Peça *"
              placeholder="Ex: Coroa E-Max, Faceta Cerâmica, Placa Bruxismo"
              error={errorsJob.prosthesis_type?.message}
              {...registerJob('prosthesis_type')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Dentes / Elementos"
              placeholder="Ex: 11, 21 ou Arcada Superior"
              {...registerJob('tooth_numbers')}
            />

            <Input
              label="Escala de Cor"
              placeholder="Ex: A1, BL2, Bleach"
              {...registerJob('color_shade')}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Custo do Laboratório (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                aria-label="Custo do laboratório"
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:border-teal-500 focus:outline-none"
                {...registerJob('cost', { valueAsNumber: true })}
              />
              {errorsJob.cost && (
                <span className="text-xs text-rose-500 mt-1 block">
                  {errorsJob.cost.message}
                </span>
              )}
            </div>
          </div>

          <Input
            type="date"
            label="Previsão de Entrega (Retorno à Clínica) *"
            error={errorsJob.due_at?.message}
            {...registerJob('due_at')}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Instruções Técnicas para o Protético
            </label>
            <textarea
              rows={2}
              aria-label="Instruções técnicas para o laboratório"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-teal-500 focus:outline-none"
              placeholder="Ex: Espessura de alívio oclusal de 1.5mm, ponto de contato proximal justo."
              {...registerJob('notes')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsJobModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingJob || isPending}
            >
              Emitir Ordem de Trabalho
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Novo Laboratório */}
      <Modal
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        title="Cadastrar Novo Laboratório"
        description="Adicione laboratórios de prótese parceiros para vincular a ordens de serviço."
      >
        <form onSubmit={handleSubmitLab(onSaveLab)} className="space-y-4">
          <Input
            label="Nome do Laboratório *"
            placeholder="Ex: Dental Art Próteses"
            error={errorsLab.name?.message}
            {...registerLab('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contato / Responsável Técnico"
              placeholder="Ex: Roberto Silva (TPD)"
              {...registerLab('contact_person')}
            />

            <Input
              label="Telefone / WhatsApp *"
              placeholder="Ex: 11988887777"
              error={errorsLab.phone?.message}
              {...registerLab('phone')}
            />
          </div>

          <Input
            type="email"
            label="E-mail de Contato"
            placeholder="contato@dentalart.com.br"
            error={errorsLab.email?.message}
            {...registerLab('email')}
          />

          <Input
            label="Endereço Completo"
            placeholder="Rua, número, bairro, cidade - UF"
            {...registerLab('address')}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLabModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingLab || isPending}
            >
              Salvar Laboratório
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
