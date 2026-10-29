import React from 'react'
import { Download, ShieldCheck, Lock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'

const MOCK_AUDIT_LOGS = [
  {
    id: 'log-1',
    data: '29/10/2026 10:14:02',
    usuario: 'Dr. Mateus Silva (Cirurgião-Dentista)',
    acao: 'Atualização Clínica',
    entidade: 'clinical_encounters',
    detalhes: 'Adição de evolução clínica no prontuário C-014 (Dente 16)',
    ip: '189.40.xx.xx',
  },
  {
    id: 'log-2',
    data: '29/10/2026 09:20:11',
    usuario: 'Dra. Beatriz Santos',
    acao: 'Acesso a Imagens',
    entidade: 'imaging_exams',
    detalhes: 'Visualização autorizada de Panorâmica via URL assinada',
    ip: '189.40.xx.xx',
  },
  {
    id: 'log-3',
    data: '28/10/2026 16:45:00',
    usuario: 'Camila Ferreira (Recepção)',
    acao: 'Agendamento',
    entidade: 'appointments',
    detalhes: 'Criação de agendamento para 30/10 às 14:00',
    ip: '189.40.xx.xx',
  },
]

export const RelatoriosPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Relatórios Clínicos, Operacionais & Auditoria
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Métricas de produtividade, compliance LGPD e trilha de auditoria completa
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
          Exportar Relatório Geral
        </Button>
      </div>

      <Alert variant="info" title="Auditoria & LGPD (Etapa 9)">
        Conforme a legislação brasileira (LGPD) e normativas do Conselho Federal de Odontologia (CFO),
        todas as consultas, alterações e exclusões de registros sensíveis geram logs de auditoria
        imutáveis sem expor dados confidenciais diretamente nos logs.
      </Alert>

      {/* Report modules grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Produção por Profissional
            </span>
            <h4 className="text-lg font-bold text-slate-900 mt-1">
              Dr. Mateus Silva
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">38 consultas atendidas este mês</p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-teal-600 font-semibold">R$ 28.400,00 gerados</span>
              <Button size="sm" variant="ghost">Ver</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Taxa de Comparecimento
            </span>
            <h4 className="text-lg font-bold text-emerald-600 mt-1">
              93.4%
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Apenas 6.6% de faltas / cancelamentos</p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total: 142 agendamentos</span>
              <Button size="sm" variant="ghost">Ver</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Trilha de Auditoria (Logs)
            </span>
            <h4 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              1.240 eventos
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Rastreamento ativo no PostgreSQL</p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Badge variant="success" size="sm">RLS Audit Ativo</Badge>
              <Button size="sm" variant="ghost">Filtrar</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" />
            <span>Trilha de Auditoria Recente (Audit Logs)</span>
          </CardTitle>
          <CardDescription>
            Registro de identificador do ator, ação, tabela e endereço de rede para conformidade legal
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data / Hora</TableHead>
                <TableHead>Usuário / Profissional</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tabela / Entidade</TableHead>
                <TableHead>Descrição do Evento</TableHead>
                <TableHead>Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_AUDIT_LOGS.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">
                    {log.data}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">
                    {log.usuario}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">{log.acao}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-600">
                    {log.entidade}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-sm">
                    {log.detalhes}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-400">
                    {log.ip}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
