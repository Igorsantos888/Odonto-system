import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Image as ImageIcon,
  Upload,
  FileText,
  Lock,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  FileUp,
} from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'
import { examService } from '../../services/examService'
import { patientService } from '../../services/patientService'
import { examFormSchema, validateExamFile, type ExamFormData } from '../../schemas/examSchema'
import type { ImagingExam, Patient } from '../../types'
import { formatDate } from '../../utils/formatters'

const EXAM_TYPE_LABELS: Record<string, string> = {
  all: 'Todos os Exames',
  panoramic: 'Panorâmica',
  periapical: 'Periapical',
  bite_wing: 'Interproximal',
  tomography: 'Tomografia',
  photo: 'Fotografia Intraoral',
  report_pdf: 'Laudo / Documento PDF',
}

export const ExamesPage: React.FC = () => {
  const { activeClinic, user, isConfigured } = useAuth()

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all')
  const [exams, setExams] = useState<ImagingExam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Modal de Upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Modal de Visualização Segura (Signed URL)
  const [viewingExam, setViewingExam] = useState<ImagingExam | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)

  // Modal de Exclusão
  const [examToDelete, setExamToDelete] = useState<ImagingExam | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: '',
      exam_type: 'panoramic',
      exam_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  })

  // Carrega pacientes
  useEffect(() => {
    if (!activeClinic) return
    patientService.listPatients(activeClinic.id).then((pts) => {
      setPatients(pts)
    })
  }, [activeClinic])

  // Carrega exames da clínica
  const loadExams = useCallback(async () => {
    if (!activeClinic) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const pId = selectedPatientId === 'all' ? undefined : selectedPatientId
      const data = await examService.listExams(activeClinic.id, pId, selectedTypeFilter)
      setExams(data)
    } catch (err: any) {
      console.error(err)
      setErrorMessage('Falha ao carregar exames: ' + (err.message || ''))
    } finally {
      setIsLoading(false)
    }
  }, [activeClinic, selectedPatientId, selectedTypeFilter])

  useEffect(() => {
    loadExams()
  }, [loadExams])

  // Seleção e validação do arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateExamFile(file)
    if (!validation.isValid) {
      setFileError(validation.error || 'Arquivo inválido')
      setSelectedFile(null)
      return
    }

    setFileError(null)
    setSelectedFile(file)
  }

  // Submissão do upload
  const onSubmitUpload = async (formData: ExamFormData) => {
    if (!activeClinic || !selectedFile) {
      if (!selectedFile) setFileError('Selecione um arquivo de imagem ou PDF')
      return
    }

    const patientTarget = selectedPatientId !== 'all' ? selectedPatientId : patients[0]?.id
    if (!patientTarget) {
      setErrorMessage('Nenhum paciente cadastrado para associar ao exame.')
      return
    }

    setIsUploading(true)
    setErrorMessage(null)

    try {
      const currentUserId = user?.id || 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'
      await examService.uploadExam(
        activeClinic.id,
        patientTarget,
        selectedFile,
        formData,
        currentUserId
      )
      setSuccessMessage(`Exame "${formData.title}" enviado com sucesso ao bucket privado.`)
      setIsUploadModalOpen(false)
      setSelectedFile(null)
      reset()
      loadExams()
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar upload do exame.')
    } finally {
      setIsUploading(false)
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }

  // Visualização via URL Assinada
  const handleOpenViewer = async (exam: ImagingExam) => {
    setViewingExam(exam)
    setIsLoadingUrl(true)
    setSignedUrl(null)
    try {
      const url = await examService.getSignedUrl(exam.storage_path, 900)
      setSignedUrl(url)
    } catch (err: any) {
      setErrorMessage('Falha na autorização de visualização: ' + (err.message || ''))
    } finally {
      setIsLoadingUrl(false)
    }
  }

  // Download seguro
  const handleDownload = async (exam: ImagingExam) => {
    try {
      const url = await examService.getSignedUrl(exam.storage_path, 300)
      const link = document.createElement('a')
      link.href = url
      link.download = exam.file_name
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      setErrorMessage('Erro ao baixar arquivo: ' + (err.message || ''))
    }
  }

  // Confirmação de exclusão
  const handleConfirmDelete = async () => {
    if (!examToDelete || !activeClinic) return
    try {
      await examService.deleteExam(examToDelete.id, activeClinic.id, examToDelete.storage_path)
      setSuccessMessage('Exame excluído com sucesso.')
      setExamToDelete(null)
      loadExams()
    } catch (err: any) {
      setErrorMessage('Erro ao excluir: ' + (err.message || ''))
    } finally {
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / 1024).toFixed(0) + ' KB'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Exames & Radiografias
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Galeria de imagens clínicas, tomografias e laudos em bucket privado • {activeClinic?.name}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSelectedFile(null)
            setFileError(null)
            setIsUploadModalOpen(true)
          }}
          leftIcon={<Upload className="w-4 h-4" />}
        >
          Enviar Novo Exame
        </Button>
      </div>

      {/* Security Banner according to PDF specification */}
      <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>Privacidade Clínica Ativa (LGPD & CFO):</strong> Nenhum arquivo possui URL pública permanente. Todos os downloads e visualizações utilizam tokens assinados temporários emitidos pelo Supabase Storage.
          </span>
        </div>
        {!isConfigured && (
          <span className="bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded border border-amber-300">
            Armazenamento Seguro Local
          </span>
        )}
      </div>

      {/* Messages */}
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

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Paciente:</span>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Todos os Pacientes da Clínica</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Modalidade:</span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {Object.entries(EXAM_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400">
          {exams.length} exame(s) registrado(s)
        </span>
      </div>

      {/* Exams Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
          <span className="text-xs">Consultando exames no bucket privado...</span>
        </div>
      ) : exams.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="p-12 text-center">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800">Nenhum exame encontrado</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Envie radiografias panorâmicas, periapicais, fotos ou laudos em PDF para armazenamento seguro.
            </p>
            <Button
              size="sm"
              variant="primary"
              className="mt-4"
              onClick={() => setIsUploadModalOpen(true)}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Fazer Primeiro Upload
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <Card key={exam.id} className="overflow-hidden flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all">
              <div>
                {/* Visual Preview / Thumbnail Area */}
                <div className="h-44 bg-slate-900 relative flex flex-col items-center justify-center text-slate-400 p-4 select-none">
                  {exam.mime_type === 'application/pdf' ? (
                    <div className="flex flex-col items-center">
                      <FileText className="w-12 h-12 text-rose-400 mb-1" />
                      <span className="text-[11px] font-mono text-rose-200">Documento PDF</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-12 h-12 text-teal-400 mb-1" />
                      <span className="text-[11px] font-mono text-teal-200">Imagem Radiográfica</span>
                    </div>
                  )}

                  {/* Private Bucket Label */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-800/90 text-teal-300 text-[10px] px-2 py-0.5 rounded-full border border-teal-500/30">
                    <Lock className="w-3 h-3" />
                    <span>Bucket Privado</span>
                  </div>

                  <span className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono">
                    Token exigido para leitura
                  </span>
                </div>

                {/* Metadata content */}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="info" size="sm">
                      {EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type}
                    </Badge>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(exam.exam_date)}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-slate-900 mt-2 truncate">
                    {exam.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                    Arquivo: {exam.file_name}
                  </p>

                  {exam.notes && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100">
                      {exam.notes}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{formatFileSize(Number(exam.file_size_bytes))}</span>
                    <span className="text-emerald-700 flex items-center gap-1 font-sans font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Auditado
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenViewer(exam)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Visualizar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(exam)}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Baixar
                  </Button>
                </div>
                <button
                  onClick={() => setExamToDelete(exam)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  title="Excluir Exame"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Upload Seguro */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Manual de Exame Clínico"
        description="Formatos aceitos: JPEG, JPG, PNG e PDF (limite de 15 MB)"
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isUploading}
              onClick={handleSubmit(onSubmitUpload)}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Enviar ao Bucket Privado
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmitUpload)} className="space-y-4">
          {/* File Picker / Dropzone */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
            <input
              type="file"
              id="file-upload"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <FileUp className="w-10 h-10 text-teal-600 mb-2" />
              <span className="text-sm font-semibold text-slate-800">
                {selectedFile ? selectedFile.name : 'Clique para selecionar arquivo do computador'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {selectedFile
                  ? `${formatFileSize(selectedFile.size)} • Pronto para envio seguro`
                  : 'Suporta JPEG, PNG e PDF até 15MB'}
              </span>
            </label>
          </div>

          {fileError && (
            <p className="text-xs text-rose-600 font-medium">{fileError}</p>
          )}

          <Input
            label="Título do Exame *"
            placeholder="Ex: Radiografia Panorâmica Inicial / Periapical Dente 16"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Tipo / Modalidade *
              </label>
              <select
                {...register('exam_type')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="panoramic">Radiografia Panorâmica</option>
                <option value="periapical">Periapical</option>
                <option value="bite_wing">Interproximal (Bite-Wing)</option>
                <option value="tomography">Tomografia Cone Beam</option>
                <option value="photo">Fotografia Intraoral</option>
                <option value="report_pdf">Laudo / Documento PDF</option>
              </select>
            </div>

            <Input
              label="Data de Realização do Exame *"
              type="date"
              error={errors.exam_date?.message}
              {...register('exam_date')}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Observações Clínicas e Achados Radiográficos
            </label>
            <textarea
              rows={3}
              placeholder="Descreva estruturas anatômicas, lesões periapicais, dentes inclusos..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              {...register('notes')}
            />
          </div>
        </form>
      </Modal>

      {/* Modal de Visualização com URL Assinada */}
      {viewingExam && (
        <Modal
          isOpen={Boolean(viewingExam)}
          onClose={() => {
            setViewingExam(null)
            setSignedUrl(null)
          }}
          title={viewingExam.title}
          description={`Visualização autorizada via Signed URL temporária (15 min) • ${viewingExam.file_name}`}
          maxWidth="2xl"
          footer={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setViewingExam(null)
                setSignedUrl(null)
              }}
            >
              Fechar
            </Button>
          }
        >
          <div className="flex flex-col items-center justify-center">
            {isLoadingUrl ? (
              <div className="py-16 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                <span className="text-xs">Gerando URL assinada no Supabase Storage...</span>
              </div>
            ) : signedUrl ? (
              viewingExam.mime_type === 'application/pdf' ? (
                <div className="w-full text-center space-y-4 py-8">
                  <FileText className="w-16 h-16 text-rose-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">
                    Documento Clínico em PDF ({viewingExam.file_name})
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => window.open(signedUrl, '_blank')}
                  >
                    Abrir PDF em Nova Aba Autenticada
                  </Button>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-auto rounded-lg border border-slate-200">
                  <img
                    src={signedUrl}
                    alt={viewingExam.title}
                    className="max-w-full h-auto object-contain mx-auto"
                  />
                </div>
              )
            ) : (
              <p className="text-xs text-rose-600">Não foi possível carregar a imagem assinada.</p>
            )}

            {viewingExam.notes && (
              <div className="w-full mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 text-left">
                <strong>Laudo / Notas:</strong> {viewingExam.notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal de Exclusão */}
      {examToDelete && (
        <Modal
          isOpen={Boolean(examToDelete)}
          onClose={() => setExamToDelete(null)}
          title="Excluir Arquivo Clínico"
          maxWidth="sm"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExamToDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Confirmar Exclusão
              </Button>
            </>
          }
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            Deseja excluir o exame <strong>{examToDelete.title}</strong>? O arquivo correspondente será
            removido do bucket privado de forma irreversível.
          </p>
        </Modal>
      )}
    </div>
  )
}
