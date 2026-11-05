import React, { useState, useEffect } from 'react'
import {
  Download,
  ShieldCheck,
  Filter,
  CheckCircle2,
  Eye,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Modal } from '../../components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'
import { auditService, type ProductivityMetric } from '../../services/auditService'
import type { AuditLog, Profile } from '../../types'

export const RelatoriosPage: React.FC = () => {
  const { activeClinic, isAdmin, isDentist } = useAuth()
  const canViewAudit = isAdmin || isDentist

  const [metrics, setMetrics] = useState<ProductivityMetric>({
    totalAppointments: 0,
    completedAppointments: 0,
    canceledAppointments: 0,
    attendanceRate: 0,
    totalRevenue: 0,
    averageTicket: 0,
    newPatientsCount: 0,
  })
  const [auditLogs, setAuditLogs] = useState<(AuditLog & { actor?: Profile })[]>([])
  const [selectedLog, setSelectedLog] = useState<(AuditLog & { actor?: Profile }) | null>(null)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    if (!activeClinic) return
    setIsLoading(true)
    try {
      const [m, logs] = await Promise.all([
        auditService.getProductivityMetrics(activeClinic.id),
        auditService.getAuditLogs(
          activeClinic.id,
          filterAction === 'all' ? undefined : { action: filterAction }
        ),
      ])
      setMetrics(m)
      setAuditLogs(logs)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeClinic?.id, filterAction])

  const handleExportAuditLogs = () => {
    const headers = ['Data/Hora', 'Usuário', 'Ação', 'Entidade', 'ID Registro', 'Endereço IP']
    const rows = auditLogs.map((log) => [
      formatDateTime(log.created_at),
      log.actor?.full_name || log.actor_name || 'Usuário do Sistema',
      log.action.toUpperCase(),
      log.entity,
      log.entity_id,
      log.ip_address || 'N/A',
    ])
    auditService.exportToCsv('relatorio_auditoria_lgpd', headers, rows)
  }

  const handleExportMetrics = () => {
    const headers = ['Métrica', 'Valor']
    const rows = [
      ['Total de Consultas Agendadas', metrics.totalAppointments],
      ['Consultas Concluídas', metrics.completedAppointments],
      ['Consultas Canceladas', metrics.canceledAppointments],
      ['Taxa de Comparecimento (%)', `${metrics.attendanceRate}%`],
      ['Faturamento Total Realizado', formatCurrency(metrics.totalRevenue)],
      ['Ticket Médio por Atendimento', formatCurrency(metrics.averageTicket)],
      ['Novos Pacientes Cadastrados', metrics.newPatientsCount],
    ]
    auditService.exportToCsv('relatorio_produtividade_clinica', headers, rows)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Relatórios Clínicos, Operacionais & Auditoria LGPD
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Métricas de produtividade, compliance regulatório e trilha de auditoria completa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportMetrics}
          >
            Exportar Indicadores (CSV)
          </Button>
          {canViewAudit && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ShieldCheck className="w-4 h-4" />}
              onClick={handleExportAuditLogs}
            >
              Exportar Trilha LGPD (CSV)
            </Button>
          )}
        </div>
      </div>

      <Alert variant="info" title="Auditoria LGPD & Normativas CFO (Etapa 9)">
        Conforme a Lei Geral de Proteção de Dados (LGPD) e normativas do Conselho Federal de
        Odontologia (CFO), todas as alterações em prontuários, imagens e agendamentos geram registros
        imutáveis. A exclusão de logs e prontuários é bloqueada via políticas estritas de banco de dados (RLS).
      </Alert>

      {/* Productivity Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-teal-200 bg-teal-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider block">
                Atendimentos Concluídos
              </span>
              <p className="text-2xl font-bold text-teal-950 mt-1">
                {metrics.completedAppointments}
              </p>
              <span className="text-[11px] text-teal-700 mt-0.5 block">
                de {metrics.totalAppointments} agendados
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Taxa de Comparecimento
              </span>
              <p className="text-2xl font-bold text-emerald-950 mt-1">
                {metrics.attendanceRate}%
              </p>
              <span className="text-[11px] text-emerald-700 mt-0.5 block flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Alta fidelidade
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-200 bg-sky-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-sky-800 uppercase tracking-wider block">
                Receita Faturada
              </span>
              <p className="text-2xl font-bold text-sky-950 mt-1">
                {formatCurrency(metrics.totalRevenue)}
              </p>
              <span className="text-[11px] text-sky-700 mt-0.5 block">
                Ticket Médio: {formatCurrency(metrics.averageTicket)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider block">
                Novos Pacientes
              </span>
              <p className="text-2xl font-bold text-indigo-950 mt-1">
                {metrics.newPatientsCount}
              </p>
              <span className="text-[11px] text-indigo-700 mt-0.5 block">
                Cadastrados na base
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Section */}
      {canViewAudit ? (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <span>Trilha de Auditoria Imutável (Audit Trail)</span>
              </CardTitle>
              <CardDescription>
                Registro inalterável de inserções, atualizações e acessos a dados sensíveis de pacientes
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filtrar ação:
              </span>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                aria-label="Filtrar tipo de ação na auditoria"
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none"
              >
                <option value="all">Todas as ações</option>
                <option value="insert">Criação (INSERT)</option>
                <option value="update">Modificação (UPDATE)</option>
                <option value="access">Acesso / Visualização (ACCESS)</option>
                <option value="delete">Exclusão (DELETE)</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Carregando registros de auditoria...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Nenhum log de auditoria encontrado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data & Hora</TableHead>
                    <TableHead>Usuário / Profissional</TableHead>
                    <TableHead>Tipo de Ação</TableHead>
                    <TableHead>Entidade do Banco</TableHead>
                    <TableHead>ID de Referência</TableHead>
                    <TableHead>Endereço IP</TableHead>
                    <TableHead className="text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold text-slate-900 block">
                          {log.actor?.full_name || log.actor_name || 'Usuário'}
                        </span>
                        {log.actor?.cro && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {log.actor.cro}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.action === 'insert'
                              ? 'success'
                              : log.action === 'update'
                              ? 'warning'
                              : log.action === 'access'
                              ? 'info'
                              : 'critical'
                          }
                          size="sm"
                        >
                          {log.action.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">
                        <code>{log.entity}</code>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">
                        {log.entity_id ? log.entity_id.slice(0, 8) + '...' : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {log.ip_address || '127.0.0.1'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Inspecionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Alert variant="warning" title="Acesso Restrito aos Logs de Auditoria">
          A visualização detalhada da trilha de auditoria e logs de conformidade LGPD é restrita a
          profissionais com papel de <strong>Administrador da Clínica</strong> ou{' '}
          <strong>Cirurgião-Dentista</strong>.
        </Alert>
      )}

      {/* Modal: Detalhes do Log */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Detalhes do Registro de Auditoria"
        description="Informações criptográficas e metadados da operação registrada."
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Log UUID:</span>
                <span className="font-mono text-slate-900">{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Data e Hora:</span>
                <span className="font-mono text-slate-900">
                  {formatDateTime(selectedLog.created_at)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Responsável:</span>
                <span className="font-semibold text-slate-900">
                  {selectedLog.actor?.full_name || selectedLog.actor_name || 'Sistema'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Ação:</span>
                <span className="font-bold uppercase text-teal-700">{selectedLog.action}</span>
              </div>
            </div>

            {selectedLog.old_values && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">
                  Valores Anteriores (Antes da Modificação):
                </span>
                <pre className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-950 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.new_values && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">
                  Valores Registrados / Modificados:
                </span>
                <pre className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
