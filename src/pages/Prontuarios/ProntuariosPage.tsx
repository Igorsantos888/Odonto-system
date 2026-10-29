import React from 'react'
import { Clock, Plus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'

export const ProntuariosPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Prontuários Odontológicos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Histórico clínico imutável, adendos rastreáveis e numeração vinculada por profissional
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nova Evolução Clínica
        </Button>
      </div>

      <Alert variant="warning" title="Especificação Clínica e Legal (Etapa 4)">
        Os prontuários odontológicos possuem valor jurídico. Conforme especificado no planejamento,
        não será permitida a exclusão irrestrita de registros clínicos. Correções e adendos deverão
        preservar a rastreabilidade total (data, hora e identificação do cirurgião-dentista).
      </Alert>

      {/* Selected Patient Record Banner Mock */}
      <Card className="border-teal-200 bg-teal-50/20">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              C-014
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Mariana Ribeiro Alves</h3>
                <Badge variant="critical" size="sm">
                  ALERGIA GRAVE: Penicilina
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Nascimento: 14/05/1992 (34 anos) • CPF: 123.456.789-01 • Cel: (11) 98765-4321
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                <span>Cirurgião Responsável: <strong>Dr. Mateus Silva (CRO-SP 104.821)</strong></span>
                <span>•</span>
                <span>Prontuário aberto em: <strong>12/03/2025</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <Button size="sm" variant="outline">
              Ver Anamnese
            </Button>
            <Button size="sm" variant="outline">
              Odontograma
            </Button>
            <Button size="sm" variant="primary">
              Novo Atendimento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evolution timeline mock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Linha do Tempo de Evoluções Clínicas</span>
          </CardTitle>
          <CardDescription>
            Registros sequenciais de consultas e condutas realizadas no paciente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative pl-6 border-l-2 border-teal-500 space-y-2">
            <div className="absolute -left-2 top-0 w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-700">Hoje às 09:30</span>
              <span className="text-[11px] text-slate-400">Dr. Mateus Silva</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              Endodontia - Dente 16 (Sessão 2)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              Realizada odontometria eletrônica (localizador apical). Canais MV, DV e P instrumentados
              com sistema rotatório. Irrigação abundante com hipoclorito de sódio 2,5%. Curativo de
              demora com pasta de hidróxido de cálcio (Calen). Selamento provisório com cimento de ionômero
              de vidro. Paciente sem sintomatologia dolorosa prévia.
            </p>
          </div>

          <div className="relative pl-6 border-l-2 border-slate-200 space-y-2 pt-4">
            <div className="absolute -left-2 top-4 w-3.5 h-3.5 rounded-full bg-slate-400 border-2 border-white shadow-xs" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">15 de Outubro de 2026</span>
              <span className="text-[11px] text-slate-400">Dr. Mateus Silva</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              Urgência Endodôntica - Dente 16 (Sessão 1)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              Abertura coronária, pulpotomia de urgência, neutralização do conteúdo séptico. Alívio de
              oclusão. Prescrito analgésico não derivado de penicilina (atentar ao alerta de alergia registrado).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
