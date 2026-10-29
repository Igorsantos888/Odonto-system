import React from 'react'
import { CheckSquare, Plus, Clock, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'

const MOCK_TAREFAS = [
  {
    id: 't-1',
    titulo: 'Confirmar comparecimento de pacientes da tarde',
    responsavel: 'Recepção (Camila)',
    paciente: 'Vários (3 agendamentos)',
    prioridade: 'high',
    prazo: 'Hoje até 12:00',
    concluida: false,
  },
  {
    id: 't-2',
    titulo: 'Cobrar laudo da Tomografia de João Paulo de Albuquerque',
    responsavel: 'Dr. Mateus Silva',
    paciente: 'João Paulo (C-033)',
    prioridade: 'urgent',
    prazo: 'Hoje até 16:00',
    concluida: false,
  },
  {
    id: 't-3',
    titulo: 'Repor kit cirúrgico e anestésicos sem vasoconstritor',
    responsavel: 'Assistente (Letícia)',
    paciente: 'Clínica Geral',
    prioridade: 'medium',
    prazo: '30/10/2026',
    concluida: true,
  },
]

export const TarefasPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tarefas & Lembretes da Clínica
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão operacional de pendências clínicas, confirmações e avisos internos
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nova Tarefa
        </Button>
      </div>

      <Alert variant="info" title="Módulo Operacional">
        As tarefas podem ser atribuídas a qualquer membro da clínica ou vinculadas
        diretamente ao prontuário de um paciente específico.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-teal-600" />
            <span>Lista de Tarefas da Equipe</span>
          </CardTitle>
          <CardDescription>Pendências classificadas por nível de urgência e prazo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_TAREFAS.map((tarefa) => (
            <div
              key={tarefa.id}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                tarefa.concluida
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  defaultChecked={tarefa.concluida}
                  className="mt-1 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <div>
                  <h4 className={`text-sm font-semibold ${tarefa.concluida ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {tarefa.titulo}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {tarefa.responsavel}
                    </span>
                    <span>•</span>
                    <span>Ref: {tarefa.paciente}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {tarefa.prazo}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Badge
                  variant={
                    tarefa.concluida
                      ? 'success'
                      : tarefa.prioridade === 'urgent'
                      ? 'critical'
                      : tarefa.prioridade === 'high'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {tarefa.concluida ? 'Concluída' : `Prioridade ${tarefa.prioridade}`}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
