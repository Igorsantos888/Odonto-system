import React from 'react'
import { Image as ImageIcon, Upload, FileText, Lock, Eye, Download, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'

const MOCK_EXAMES = [
  {
    id: 'ex-1',
    titulo: 'Radiografia Panorâmica Inicial',
    tipo: 'Panorâmica',
    paciente: 'Mariana Ribeiro Alves (C-014)',
    data: '12/03/2025',
    formato: 'PNG',
    tamanho: '2.4 MB',
    seguro: true,
  },
  {
    id: 'ex-2',
    titulo: 'Periapical Dente 16 (Pós-Instrumentação)',
    tipo: 'Periapical',
    paciente: 'Mariana Ribeiro Alves (C-014)',
    data: '29/10/2026',
    formato: 'JPEG',
    tamanho: '840 KB',
    seguro: true,
  },
  {
    id: 'ex-3',
    titulo: 'Laudo Tomografia Cone Beam - Mandíbula',
    tipo: 'Laudo PDF',
    paciente: 'João Paulo de Albuquerque (C-033)',
    data: '20/10/2026',
    formato: 'PDF',
    tamanho: '5.1 MB',
    seguro: true,
  },
]

export const ExamesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Exames & Radiografias
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Galeria de imagens clínicas, laudos em PDF e armazenamento em bucket privado seguro
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
          Enviar Exame
        </Button>
      </div>

      <Alert variant="warning" title="Segurança de Dados Clínicos (Etapa 5)">
        Conforme a especificação, arquivos clínicos (radiografias, fotos intraorais e laudos em PDF)
        serão armazenados <strong>exclusivamente em buckets privados</strong> do Supabase Storage.
        O acesso será concedido apenas via URLs assinadas e autenticadas, sem URLs públicas permanentes.
      </Alert>

      {/* Upload Dropzone Preview */}
      <Card className="border-dashed border-2 border-slate-300 hover:border-teal-500 transition-colors">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">
            Arraste ou selecione exames para upload seguro
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Formatos aceitos: JPG, JPEG, PNG e PDF (até 15MB por arquivo). Nomes de arquivo
            são ofuscados por UUID antes do envio ao storage.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="outline">
              Selecionar do Computador
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_EXAMES.map((exame) => (
          <Card key={exame.id} className="overflow-hidden flex flex-col justify-between">
            <div>
              <div className="h-40 bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-4 relative">
                {exame.formato === 'PDF' ? (
                  <FileText className="w-12 h-12 text-rose-400" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-teal-400" />
                )}
                <span className="text-[11px] font-mono mt-2 text-slate-300">
                  Visualização protegida por token
                </span>
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-800/90 text-teal-300 text-[10px] px-2 py-0.5 rounded-full border border-teal-500/30">
                  <Lock className="w-3 h-3" />
                  <span>Bucket Privado</span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="info" size="sm">{exame.tipo}</Badge>
                  <span className="text-[11px] text-slate-400">{exame.data}</span>
                </div>
                <h4 className="font-semibold text-sm text-slate-900 mt-2">
                  {exame.titulo}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{exame.paciente}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{exame.formato} • {exame.tamanho}</span>
                  <span className="text-emerald-600 flex items-center gap-1 font-sans">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Auditado
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Button size="sm" variant="ghost" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                Visualizar
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Download className="w-3.5 h-3.5" />}>
                Baixar
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
