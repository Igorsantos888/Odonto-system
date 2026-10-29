import React, { useState } from 'react'
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, User, Stethoscope } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'

const MOCK_SLOTS = [
  {
    id: 's1',
    horario: '08:00',
    status: 'free',
  },
  {
    id: 's2',
    horario: '08:30',
    paciente: 'Carlos Eduardo Costa',
    procedimento: 'Instalação de Coroa',
    profissional: 'Dr. Mateus Silva',
    status: 'completed',
    statusLabel: 'Concluído',
  },
  {
    id: 's3',
    horario: '09:30',
    paciente: 'Mariana Ribeiro Alves',
    procedimento: 'Endodontia Molar',
    profissional: 'Dr. Mateus Silva',
    alerta: 'Alergia a Penicilina',
    status: 'in_progress',
    statusLabel: 'Em Atendimento',
  },
  {
    id: 's4',
    horario: '10:45',
    paciente: 'Luciana Martins Ferreira',
    procedimento: 'Restauração Resina',
    profissional: 'Dra. Beatriz Santos',
    status: 'confirmed',
    statusLabel: 'Confirmado',
  },
  {
    id: 's5',
    horario: '14:00',
    paciente: 'João Paulo de Albuquerque',
    procedimento: 'Exodontia 3º Molar',
    profissional: 'Dr. Mateus Silva',
    alerta: 'Uso de Anticoagulante',
    status: 'scheduled',
    statusLabel: 'Agendado',
  },
  {
    id: 's6',
    horario: '15:30',
    status: 'free',
  },
]

export const AgendaPage: React.FC = () => {
  const [selectedProfissional, setSelectedProfissional] = useState('all')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agenda Clínica</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão de agendamentos por profissional, cadeira e prevenção de conflitos de horário
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
            Próximo Dia
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Novo Agendamento
          </Button>
        </div>
      </div>

      <Alert variant="warning" title="Módulo em Estruturação (Etapa 1)">
        Grade interativa com dados fictícios. A prevenção ativa de conflitos de horários e a
        persistência no PostgreSQL com filtros por profissional serão implementadas na <strong>Etapa 7</strong>.
      </Alert>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase">Filtrar por Dentista:</span>
          <select
            value={selectedProfissional}
            onChange={(e) => setSelectedProfissional(e.target.value)}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Todos os Profissionais</option>
            <option value="mateus">Dr. Mateus Silva (CRO-SP 104.821)</option>
            <option value="beatriz">Dra. Beatriz Santos (CRO-SP 119.452)</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Visualização:</span>
          <Badge variant="neutral" size="sm">Diária</Badge>
          <span className="text-xs text-slate-400">Semanal • Mensal</span>
        </div>
      </div>

      {/* Daily schedule grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-teal-600" />
            <span>Grade do Dia — 29 de Outubro de 2026 (Quinta-feira)</span>
          </CardTitle>
          <CardDescription>
            Horários de consulta divididos em intervalos de 15 a 45 minutos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_SLOTS.map((slot) => {
            if (slot.status === 'free') {
              return (
                <div
                  key={slot.id}
                  className="p-3 rounded-lg border border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/50 flex items-center justify-between transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-slate-400 w-12">
                      {slot.horario}
                    </span>
                    <span className="text-xs text-slate-400 group-hover:text-teal-600 font-medium">
                      + Horário disponível para agendamento
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 text-xs">
                    Agendar
                  </Button>
                </div>
              )
            }

            return (
              <div
                key={slot.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 font-mono text-xs font-bold text-slate-800">
                    {slot.horario}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{slot.paciente}</span>
                      {slot.alerta && (
                        <Badge variant="critical" size="sm">
                          {slot.alerta}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                        {slot.procedimento}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {slot.profissional}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Badge
                    variant={
                      slot.status === 'completed'
                        ? 'success'
                        : slot.status === 'in_progress'
                        ? 'info'
                        : slot.status === 'confirmed'
                        ? 'success'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {slot.statusLabel}
                  </Badge>
                  <Button size="sm" variant="outline">
                    Detalhes
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
