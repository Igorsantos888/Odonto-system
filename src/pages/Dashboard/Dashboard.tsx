import React from 'react'
import {
  Users,
  Calendar,
  AlertOctagon,
  Clock,
  TrendingUp,
  FlaskConical,
  Plus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table'
import { formatCurrency } from '../../utils/formatters'

// Dados fictícios claramente identificados (Etapa 1 de desenvolvimento)
const MOCK_METRICS = {
  consultasHoje: 8,
  consultasConcluidas: 3,
  pacientesAtivos: 284,
  alertasCriticos: 3,
  trabalhosLaboratorio: 4,
  faturamentoMes: 42850,
}

const MOCK_AGENDA_HOJE = [
  {
    id: 'apt-1',
    horario: '08:30 - 09:15',
    paciente: 'Carlos Eduardo Costa',
    prontuario: 'C-001',
    procedimento: 'Instalação de Coroa Cerâmica',
    dentista: 'Dr. Mateus Silva',
    status: 'completed',
    statusLabel: 'Concluído',
    alertaClinico: null,
  },
  {
    id: 'apt-2',
    horario: '09:30 - 10:30',
    paciente: 'Mariana Ribeiro Alves',
    prontuario: 'C-014',
    procedimento: 'Tratamento Endodôntico (Dente 16)',
    dentista: 'Dr. Mateus Silva',
    status: 'in_progress',
    statusLabel: 'Em Atendimento',
    alertaClinico: 'ALERGIA SEVERA: Penicilina e Dipirona',
  },
  {
    id: 'apt-3',
    horario: '10:45 - 11:30',
    paciente: 'Luciana Martins Ferreira',
    prontuario: 'C-082',
    procedimento: 'Restauração em Resina Composta (Faces M-O)',
    dentista: 'Dra. Beatriz Santos',
    status: 'confirmed',
    statusLabel: 'Confirmado',
    alertaClinico: null,
  },
  {
    id: 'apt-4',
    horario: '14:00 - 14:45',
    paciente: 'João Paulo de Albuquerque',
    prontuario: 'C-033',
    procedimento: 'Exodontia Simples de 3º Molar (Dente 38)',
    dentista: 'Dr. Mateus Silva',
    status: 'scheduled',
    statusLabel: 'Agendado',
    alertaClinico: 'Cardiopata • Uso contínuo de Anticoagulante',
  },
  {
    id: 'apt-5',
    horario: '15:00 - 15:30',
    paciente: 'Ana Clara Lima',
    prontuario: 'C-109',
    procedimento: 'Profilaxia e Aplicação de Flúor',
    dentista: 'Dra. Beatriz Santos',
    status: 'scheduled',
    statusLabel: 'Agendado',
    alertaClinico: null,
  },
]

const MOCK_SEMANA_DATA = [
  { dia: 'Seg', confirmadas: 12, canceladas: 1 },
  { dia: 'Ter', confirmadas: 14, canceladas: 2 },
  { dia: 'Qua', confirmadas: 11, canceladas: 0 },
  { dia: 'Qui (Hoje)', confirmadas: 8, canceladas: 1 },
  { dia: 'Sex', confirmadas: 15, canceladas: 1 },
  { dia: 'Sáb', confirmadas: 6, canceladas: 0 },
]

const MOCK_PROCEDIMENTOS_DIST = [
  { name: 'Restaurações', value: 38, color: '#0d9488' },
  { name: 'Endodontia', value: 22, color: '#0284c7' },
  { name: 'Próteses', value: 18, color: '#f59e0b' },
  { name: 'Cirurgia', value: 12, color: '#e11d48' },
  { name: 'Prevenção', value: 10, color: '#10b981' },
]

const MOCK_LAB_JOBS = [
  {
    id: 'lab-1',
    laboratorio: 'DentalArt Laboratório',
    paciente: 'Carlos Eduardo Costa',
    item: 'Coroa Zircônia (Dente 26)',
    envio: '22/10/2026',
    previsao: '30/10/2026',
    status: 'warning',
    statusLabel: 'Entrega Amanhã',
  },
  {
    id: 'lab-2',
    laboratorio: 'Precision Dental Tech',
    paciente: 'Renata Vasconcelos',
    item: 'Placa de Bruxismo em Acetato',
    envio: '24/10/2026',
    previsao: '03/11/2026',
    status: 'info',
    statusLabel: 'Em Produção',
  },
  {
    id: 'lab-3',
    laboratorio: 'DentalArt Laboratório',
    paciente: 'Roberto Mendes',
    item: 'Prótese Parcial Removível (Inferior)',
    envio: '18/10/2026',
    previsao: '28/10/2026',
    status: 'critical',
    statusLabel: 'Prazo Vencido (Cobrar)',
  },
]

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Welcome & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Painel Geral da Clínica
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Resumo de atividades, atendimentos e indicadores operacionais • OdontoPrime Matriz
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="md">
            Dados Fictícios de Demonstração
          </Badge>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            Ver Agenda Completa
          </Button>
        </div>
      </div>

      {/* Notice alert for Stage 1 */}
      <Alert
        variant="info"
        title="Etapa 1 — Interface Base Concluída"
      >
        Você está visualizando a arquitetura visual completa do sistema. Todos os indicadores,
        tabelas e gráficos abaixo utilizam registros fictícios simulados. Na <strong>Etapa 2</strong>,
        serão integradas a autenticação e as migrações do Supabase com isolamento RLS.
      </Alert>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Consultas Hoje */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Consultas Hoje
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">
                  {MOCK_METRICS.consultasHoje}
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  {MOCK_METRICS.consultasConcluidas} concluídas
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                5 agendamentos pendentes
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pacientes Ativos */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pacientes Ativos
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">
                  {MOCK_METRICS.pacientesAtivos}
                </span>
                <span className="text-xs text-teal-600 font-medium">
                  +12 este mês
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Prontuários com vínculo seguro
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Alertas Clínicos Urgentes (Regra Vermelho) */}
        <Card className="border-rose-200 bg-rose-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Alertas Clínicos
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-rose-700">
                  {MOCK_METRICS.alertasCriticos}
                </span>
                <span className="text-xs text-rose-600 font-medium">
                  Atenção imediata
                </span>
              </div>
              <span className="text-[11px] text-rose-600/80 mt-1 block">
                Alergias graves & cardiopatias
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Laboratórios (Regra Amarelo) */}
        <Card className="border-amber-200 bg-amber-50/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Próteses em Lab
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-amber-900">
                  {MOCK_METRICS.trabalhosLaboratorio}
                </span>
                <span className="text-xs text-amber-700 font-medium">
                  2 prazos próximos
                </span>
              </div>
              <span className="text-[11px] text-amber-700/80 mt-1 block">
                1 entrega prevista para amanhã
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <FlaskConical className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Atendimentos da Semana */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Fluxo Semanal de Consultas</CardTitle>
              <CardDescription>
                Distribuição de consultas atendidas vs. cancelamentos na semana atual
              </CardDescription>
            </div>
            <Badge variant="info" size="sm">
              Semana 44
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_SEMANA_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="dia" tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="confirmadas" name="Realizadas / Agendadas" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="canceladas" name="Canceladas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Procedimentos mais frequentes */}
        <Card>
          <CardHeader>
            <CardTitle>Procedimentos por Área</CardTitle>
            <CardDescription>Participação no volume clínico mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_PROCEDIMENTOS_DIST}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {MOCK_PROCEDIMENTOS_DIST.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Volume']}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {MOCK_PROCEDIMENTOS_DIST.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table: Agenda do Dia com Alertas Visuais Conformes */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>Agenda Clínica de Hoje</span>
              <Badge variant="info" size="sm">
                5 agendamentos
              </Badge>
            </CardTitle>
            <CardDescription>
              Atendimentos sequenciais do turno com indicação de prontuário e alertas clínicos
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Adicionar Horário
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Paciente / Prontuário</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Alerta Clínico / Alergia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_AGENDA_HOJE.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-800 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.horario}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-semibold text-slate-900 block">{item.paciente}</span>
                      <span className="text-xs text-slate-400 font-mono">
                        Prontuário: {item.prontuario}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 max-w-xs truncate">
                    {item.procedimento}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {item.dentista}
                  </TableCell>
                  <TableCell>
                    {item.alertaClinico ? (
                      <Badge variant="critical" size="sm">
                        {item.alertaClinico}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Sem alertas registrados</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.status === 'completed' && (
                      <Badge variant="success" size="sm">
                        {item.statusLabel}
                      </Badge>
                    )}
                    {item.status === 'in_progress' && (
                      <Badge variant="info" size="sm">
                        {item.statusLabel}
                      </Badge>
                    )}
                    {item.status === 'confirmed' && (
                      <Badge variant="success" size="sm">
                        {item.statusLabel}
                      </Badge>
                    )}
                    {item.status === 'scheduled' && (
                      <Badge variant="warning" size="sm">
                        {item.statusLabel}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">
                      Atender
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Row: Laboratórios de Prótese & Resumo Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lab Jobs Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-600" />
                <span>Trabalhos em Laboratório</span>
              </CardTitle>
              <CardDescription>
                Prazos e status de próteses dentárias terceirizadas
              </CardDescription>
            </div>
            <Badge variant="warning" size="sm">
              3 em aberto
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_LAB_JOBS.map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div>
                  <h5 className="font-semibold text-slate-800 text-sm">{job.item}</h5>
                  <p className="text-slate-500 mt-0.5">
                    Paciente: <strong>{job.paciente}</strong> • {job.laboratorio}
                  </p>
                  <div className="flex items-center gap-3 text-slate-400 mt-1">
                    <span>Enviado: {job.envio}</span>
                    <span>•</span>
                    <span>Previsão: {job.previsao}</span>
                  </div>
                </div>
                <div>
                  <Badge variant={job.status as 'warning' | 'info' | 'critical'} size="sm">
                    {job.statusLabel}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Finance Quick Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>Posição Financeira do Mês</span>
              </CardTitle>
              <CardDescription>
                Faturamento bruto, despesas operacionais e saldo projetado
              </CardDescription>
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-200">
              Outubro 2026
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100">
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                  Receitas Realizadas
                </span>
                <span className="text-xl font-bold text-teal-900 mt-1 block">
                  {formatCurrency(MOCK_METRICS.faturamentoMes)}
                </span>
                <span className="text-[11px] text-teal-600 mt-0.5 block">
                  48 pagamentos confirmados
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-100/60 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Despesas do Período
                </span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">
                  {formatCurrency(14200)}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Materiais, lab & fixas
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Saldo Líquido Operacional
                </span>
                <span className="text-xs text-slate-500">
                  Margem estimada de 66,8% sobre a produção
                </span>
              </div>
              <span className="text-base font-bold text-emerald-600">
                {formatCurrency(MOCK_METRICS.faturamentoMes - 14200)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-400">Orçamentos pendentes de aprovação: 7</span>
              <Button size="sm" variant="ghost" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Ver Módulo Financeiro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
