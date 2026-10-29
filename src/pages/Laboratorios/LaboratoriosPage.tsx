import React from 'react'
import { FlaskConical, Plus, Phone } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { formatCurrency } from '../../utils/formatters'

const MOCK_LAB_ORDERS = [
  {
    id: 'lo-1',
    laboratorio: 'DentalArt Laboratório',
    contato: '(11) 3321-9988',
    paciente: 'Carlos Eduardo Costa (C-001)',
    servico: 'Coroa Zircônia Monolítica (Dente 26)',
    cor: 'A2 Vita',
    envio: '22/10/2026',
    previsao: '30/10/2026 (Amanhã)',
    custo: 380,
    status: 'warning',
    statusLabel: 'Aguardando Retorno (Prazo Próximo)',
  },
  {
    id: 'lo-2',
    laboratorio: 'Precision Dental Tech',
    contato: '(11) 98123-4567',
    paciente: 'Renata Vasconcelos (C-045)',
    servico: 'Placa de Bruxismo em Acetato Rígido',
    cor: 'Transparente',
    envio: '24/10/2026',
    previsao: '03/11/2026',
    custo: 180,
    status: 'info',
    statusLabel: 'Em Confecção',
  },
  {
    id: 'lo-3',
    laboratorio: 'DentalArt Laboratório',
    contato: '(11) 3321-9988',
    paciente: 'Roberto Mendes (C-019)',
    servico: 'Prótese Parcial Removível com Grampos',
    cor: 'A3',
    envio: '18/10/2026',
    previsao: '28/10/2026',
    custo: 650,
    status: 'critical',
    statusLabel: 'Prazo Vencido (Cobrança Necessária)',
  },
  {
    id: 'lo-4',
    laboratorio: 'MasterLab Próteses',
    contato: '(11) 2234-8899',
    paciente: 'Mariana Ribeiro Alves (C-014)',
    servico: 'Núcleo Metálico Fundido Dente 16',
    cor: 'Metal',
    envio: '14/10/2026',
    previsao: '21/10/2026',
    custo: 120,
    status: 'success',
    statusLabel: 'Recebido & Concluído',
  },
]

export const LaboratoriosPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laboratórios de Prótese & Peças Protéticas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle de pedidos enviados a laboratórios parceiros, prazos de entrega e custos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Cadastrar Laboratório
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Enviar Novo Trabalho
          </Button>
        </div>
      </div>

      <Alert variant="warning" title="Regra de Alerta Visual Amarelo (Etapa 8)">
        Conforme diretriz do projeto: a cor <strong>amarela</strong> sinaliza pendências, prazos
        próximos ou trabalhos aguardando retorno do laboratório com textos e ícones acessíveis.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-600" />
            <span>Trabalhos em Aberto & Histórico Recente</span>
          </CardTitle>
          <CardDescription>
            Acompanhamento de prazos para evitar atrasos na consulta de instalação do paciente
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trabalho / Prótese</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Laboratório / Contato</TableHead>
                <TableHead>Cor / Especificação</TableHead>
                <TableHead>Datas (Envio / Previsão)</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Status / Alerta</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_LAB_ORDERS.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="font-semibold text-slate-900 text-xs block">
                      {item.servico}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">ID: {item.id}</span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-800">
                    {item.paciente}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <span className="font-medium text-slate-800 block">{item.laboratorio}</span>
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {item.contato}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-600">
                    {item.cor}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                    <div>Envio: {item.envio}</div>
                    <div className="font-semibold text-slate-800">Prev: {item.previsao}</div>
                  </TableCell>
                  <TableCell className="font-bold text-xs text-slate-900 whitespace-nowrap">
                    {formatCurrency(item.custo)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === 'critical'
                          ? 'critical'
                          : item.status === 'warning'
                          ? 'warning'
                          : item.status === 'success'
                          ? 'success'
                          : 'info'
                      }
                      size="sm"
                    >
                      {item.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      Receber
                    </Button>
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
