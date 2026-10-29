import React from 'react'
import { AlertOctagon, Heart, Save } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'

export const AnamnesePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ficha de Anamnese & Histórico Médico
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Questionário de saúde sistêmica, alergias medicamentosas e contraindicações clínicas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="critical" size="md">
            Alerta Crítico Ativo
          </Badge>
          <Button variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />}>
            Salvar Atualização
          </Button>
        </div>
      </div>

      {/* Critical Alert banner according to Page 3 */}
      <Alert
        variant="critical"
        title="Alerta Clínico Obrigatório — Paciente: Mariana Ribeiro Alves (Prontuário C-014)"
      >
        O paciente possui <strong>hipersensibilidade grave a Penicilina e Dipirona</strong> relatada
        com histórico de edema de glote. Não prescrever Amoxicilina, Ampicilina, Augmentin ou Dipirona Sódica.
        Última confirmação em 12/03/2025 pelo Dr. Mateus Silva.
      </Alert>

      {/* Form sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alergias e Medicações */}
        <Card className="border-rose-200">
          <CardHeader className="bg-rose-50/50">
            <CardTitle className="text-rose-900 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Alergias e Reações Adversas</span>
            </CardTitle>
            <CardDescription className="text-rose-700">
              Medicamentos, anestésicos locais, látex e substâncias químicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <span className="text-xs font-semibold text-rose-900 block mb-1">
                Alergias Confirmadas:
              </span>
              <div className="flex flex-wrap gap-2">
                <Badge variant="critical" size="sm">Penicilina (Choque Anafilático prévio)</Badge>
                <Badge variant="critical" size="sm">Dipirona Sódica</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Uso contínuo de medicamentos:
              </label>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                • Anticoncepcional oral combinado (Etinilestradiol + Levonorgestrel)<br />
                • Nega uso de bifosfonatos ou anticoagulantes
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Condições Sistêmicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-teal-600" />
              <span>Condições Sistêmicas e Doenças Crônicas</span>
            </CardTitle>
            <CardDescription>
              Avaliação de risco cirúrgico e anestésico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-700">Hipertensão Arterial:</span>
                <span className="font-semibold text-slate-500">Não relatado</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-700">Diabetes Mellitus:</span>
                <span className="font-semibold text-slate-500">Não relatado</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-700">Cardiopatias:</span>
                <span className="font-semibold text-slate-500">Não relatado</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-700">Gestante / Lactante:</span>
                <span className="font-semibold text-slate-500">Não</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Observações Clínicas Adicionais:
              </label>
              <textarea
                readOnly
                rows={3}
                className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
                value="Paciente relata episódios esporádicos de enxaqueca com aura. Sem alterações de hemostasia ou coagulograma."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
