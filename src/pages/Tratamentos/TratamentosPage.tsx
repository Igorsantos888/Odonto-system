import React from 'react'
import { Plus, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { formatCurrency } from '../../utils/formatters'

export const TratamentosPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Planos de Tratamento
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Planejamento clínico integrado, orçamentos e evolução dos procedimentos por dente
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Criar Novo Plano
        </Button>
      </div>

      <Alert variant="warning" title="Planejado para Etapas 6 e 8">
        Módulo que conecta o odontograma (dentes/faces) ao orçamento financeiro.
        Na <strong>Etapa 6</strong> serão associados os itens planejados aos dentes e na <strong>Etapa 8</strong>
        o faturamento correspondente.
      </Alert>

      {/* Treatment Plan Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Plano: Reabilitação Posterior & Endodontia</CardTitle>
              <Badge variant="warning" size="sm">
                Em Andamento (60%)
              </Badge>
            </div>
            <CardDescription>
              Paciente: <strong>Mariana Ribeiro Alves (C-014)</strong> • Responsável: Dr. Mateus Silva
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Valor Total do Plano:</span>
            <span className="text-lg font-bold text-teal-700">
              {formatCurrency(3850)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-semibold text-slate-800">
                  Dente 16 — Tratamento Endodôntico (Canais Radiculares)
                </span>
                <p className="text-slate-500">2 sessões concluídas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatCurrency(1200)}</span>
              <Badge variant="success" size="sm">Realizado</Badge>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <div>
                <span className="font-semibold text-slate-800">
                  Dente 16 — Núcleo Metálico Fundido + Coroa em E-Max
                </span>
                <p className="text-slate-500">Aguardando término da endodontia e moldagem</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatCurrency(1900)}</span>
              <Badge variant="warning" size="sm">Pendente</Badge>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <div>
                <span className="font-semibold text-slate-800">
                  Dente 25 — Restauração em Resina Composta (Faces M-O-D)
                </span>
                <p className="text-slate-500">Cárie interproximal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatCurrency(450)}</span>
              <Badge variant="warning" size="sm">Planejado</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
