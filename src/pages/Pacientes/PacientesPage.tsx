import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Search,
  Filter,
  Phone,
  Mail,
  FileText,
  UserPlus,
  Edit2,
  Trash2,
  Loader2,
  AlertOctagon,
  CheckCircle2,
  AlertCircle,
  User,
  Shield,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table'
import { useAuth } from '../../contexts/AuthContext'
import { patientService } from '../../services/patientService'
import { patientFormSchema, type PatientFormData } from '../../schemas/patientSchema'
import type { Patient, Profile } from '../../types'
import { maskCpf, maskPhone, formatDate } from '../../utils/formatters'
import { useNavigate } from 'react-router-dom'

export const PacientesPage: React.FC = () => {
  const { activeClinic, isAdmin, isConfigured } = useAuth()
  const navigate = useNavigate()

  const [patients, setPatients] = useState<(Patient & { professional?: Profile })[]>([])
  const [dentists, setDentists] = useState<Profile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Modal de Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)

  // Modal de Exclusão
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
  })

  // Carrega pacientes e dentistas
  const loadData = useCallback(async () => {
    if (!activeClinic) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [patientsData, dentistsData] = await Promise.all([
        patientService.listPatients(activeClinic.id, searchTerm),
        patientService.listClinicDentists(activeClinic.id),
      ])
      setPatients(patientsData)
      setDentists(dentistsData)
    } catch (err: any) {
      console.error(err)
      setErrorMessage('Falha ao carregar lista de pacientes. ' + (err.message || ''))
    } finally {
      setIsLoading(false)
    }
  }, [activeClinic, searchTerm])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Abre modal para novo paciente
  const handleOpenNew = () => {
    setEditingPatient(null)
    reset({
      full_name: '',
      cpf: '',
      birth_date: '',
      gender: 'F',
      phone: '',
      email: '',
      address: '',
      professional_id: dentists[0]?.id || '',
      notes: '',
    })
    setIsModalOpen(true)
  }

  // Abre modal para edição
  const handleOpenEdit = (patient: Patient & { professional?: Profile }) => {
    setEditingPatient(patient)
    reset({
      full_name: patient.full_name,
      cpf: patient.cpf ? maskCpf(patient.cpf) : '',
      birth_date: patient.birth_date || '',
      gender: patient.gender || 'F',
      phone: maskPhone(patient.phone),
      email: patient.email || '',
      address: patient.address || '',
      professional_id: patient.professional?.id || '',
      notes: patient.notes || '',
    })
    setIsModalOpen(true)
  }

  // Submissão do formulário
  const onSubmitForm = async (data: PatientFormData) => {
    if (!activeClinic) return
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      if (editingPatient) {
        await patientService.updatePatient(editingPatient.id, activeClinic.id, data)
        setSuccessMessage(`Paciente "${data.full_name}" atualizado com sucesso.`)
      } else {
        await patientService.createPatient(activeClinic.id, data)
        setSuccessMessage(`Paciente "${data.full_name}" cadastrado com sucesso.`)
      }
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar paciente.')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }

  // Confirmação de exclusão
  const handleConfirmDelete = async () => {
    if (!patientToDelete || !activeClinic) return
    setIsSubmitting(true)
    try {
      await patientService.deletePatient(patientToDelete.id, activeClinic.id)
      setSuccessMessage(`Paciente removido com sucesso.`)
      setPatientToDelete(null)
      loadData()
    } catch (err: any) {
      setErrorMessage('Erro ao excluir: ' + (err.message || ''))
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cadastro de Pacientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão cadastral, contatos e vinculação aos cirurgiões-dentistas • {activeClinic?.name}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenNew}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Novo Paciente
        </Button>
      </div>

      {/* Success & Error alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-600 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Persistence status banner */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>Persistência Real no Supabase (Etapa 3):</strong> Operações integradas à tabela <code>public.patients</code> com validações Zod e isolamento RLS por clínica (<code>{activeClinic?.name}</code>).
          </span>
        </div>
        {!isConfigured && (
          <span className="bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded border border-amber-300">
            Ambiente Local (Demo Store)
          </span>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar paciente por nome, CPF ou telefone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {patients.length} paciente(s) encontrado(s)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<Filter className="w-3.5 h-3.5" />}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Patients Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Relação de Pacientes Ativos</CardTitle>
          <CardDescription>
            Registros cadastrais com identificação de dentista de referência e alertas de saúde
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600 mb-2" />
              <span className="text-xs">Carregando pacientes cadastrados...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Nenhum paciente encontrado</p>
              <p className="text-xs text-slate-400 mt-1">
                Tente ajustar os termos de pesquisa ou cadastre um novo paciente.
              </p>
              <Button
                size="sm"
                variant="primary"
                className="mt-4"
                onClick={handleOpenNew}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Cadastrar Primeiro Paciente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Nascimento</TableHead>
                  <TableHead>Dentista Referência</TableHead>
                  <TableHead>Observações / Alertas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="font-semibold text-slate-900 block text-xs sm:text-sm">
                        {p.full_name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {p.id.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600">
                      {maskCpf(p.cpf)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{maskPhone(p.phone)}</span>
                        </div>
                        {p.email && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[140px]">{p.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                      {formatDate(p.birth_date)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-800 block">
                        {p.professional?.full_name || 'Não vinculado'}
                      </span>
                      {p.professional?.cro && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.professional.cro}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {p.has_critical_alerts || (p.notes && p.notes.toLowerCase().includes('alergia')) ? (
                        <Badge variant="critical" size="sm">
                          {p.notes || 'Alerta Médico'}
                        </Badge>
                      ) : p.notes ? (
                        <span className="text-xs text-slate-600 truncate block">
                          {p.notes}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Sem observações</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate('/prontuarios')}
                          title="Abrir Prontuário"
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Editar Paciente"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setPatientToDelete(p)}
                            title="Excluir Paciente"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação / Edição de Paciente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPatient ? 'Editar Paciente' : 'Novo Cadastro de Paciente'}
        description={`Unidade Clínica: ${activeClinic?.name}`}
        maxWidth="lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSubmit(onSubmitForm)}
            >
              {editingPatient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <Input
            label="Nome Completo *"
            placeholder="Ex: Mariana Ribeiro Alves"
            error={errors.full_name?.message}
            {...register('full_name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="CPF"
              placeholder="000.000.000-00"
              error={errors.cpf?.message}
              {...register('cpf')}
              onChange={(e) => {
                const masked = maskCpf(e.target.value)
                setValue('cpf', masked)
              }}
            />

            <Input
              label="Data de Nascimento"
              type="date"
              error={errors.birth_date?.message}
              {...register('birth_date')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Telefone / Celular (WhatsApp) *"
              placeholder="(11) 98765-4321"
              error={errors.phone?.message}
              {...register('phone')}
              onChange={(e) => {
                const masked = maskPhone(e.target.value)
                setValue('phone', masked)
              }}
            />

            <Input
              label="E-mail"
              type="email"
              placeholder="paciente@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Sexo / Gênero
              </label>
              <select
                {...register('gender')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="outro">Outro / Não Informado</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Cirurgião-Dentista Responsável
              </label>
              <select
                {...register('professional_id')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Selecione o profissional de referência</option>
                {dentists.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} {d.cro ? `(${d.cro})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Endereço Residencial"
            placeholder="Rua, número, complemento, bairro e cidade"
            error={errors.address?.message}
            {...register('address')}
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Observações Clínicas e Alertas de Alergia
            </label>
            <textarea
              rows={3}
              placeholder="Descreva alergias a medicamentos, condições crônicas ou notas relevantes..."
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              {...register('notes')}
            />
          </div>
        </form>
      </Modal>

      {/* Modal de Exclusão Segura */}
      {patientToDelete && (
        <Modal
          isOpen={Boolean(patientToDelete)}
          onClose={() => setPatientToDelete(null)}
          title="Confirmar Exclusão de Paciente"
          maxWidth="sm"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPatientToDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleConfirmDelete}
              >
                Confirmar Exclusão
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente o cadastro de{' '}
              <strong>{patientToDelete.full_name}</strong>?
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Esta ação apagará também os vínculos com cirurgiões-dentistas desta unidade clínica.
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
