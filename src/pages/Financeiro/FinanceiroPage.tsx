import React from 'react'
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, CreditCard, Filter } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { formatCurrency } from '../../utils/formatters'

const MOCK_TRANSACOES = [
  {
    id: 'tx-1',
    data: '29/10/2026',
    descricao: 'Pagamento de Consulta - Carlos Eduardo Costa',
    tipo: 'income',
    valor: 1850,
    metodo: 'Cartão de Crédito (3x)',
    status: 'paid',
    statusLabel: 'Recebido',
  },
  {
    id: 'tx-2',
    data: '28/10/2026',
    descricao: 'Fornecedor Dental Cremer (Resinas e Anestésicos)',
    tipo: 'expense',
    valor: 3240,
    metodo: 'Boleto Bancário',
    status: 'paid',
    statusLabel: 'Pago',
  },
  {
    id: 'tx-3',
    data: '27/10/2026',
    descricao: 'Entrada Tratamento Endodôntico - Mariana Ribeiro',
    tipo: 'income',
    valor: 600,
    metodo: 'PIX',
    status: 'paid',
    statusLabel: 'Recebido',
  },
  {
    id: 'tx-4',
    data: '05/11/2026',
    descricao: 'Serviço Laboratório DentalArt (Coroas do Mês)',
    tipo: 'expense',
    valor: 2100,
    metodo: 'Transferência',
    status: 'pending',
    statusLabel: 'A Pagar',
  },
]

export const FinanceiroPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Controle Financeiro & Caixa
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Orçamentos clínicos, fluxo de caixa, despesas operacionais e controle de recebíveis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nova Despesa
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Novo Recebimento
          </Button>
        </div>
      </div>

      <Alert variant="warning" title="Restrição de Acesso por Papel (Etapa 8)">
        Conforme as políticas de autorização especificadas, as informações financeiras completas
        são restritas aos perfis de <strong>Administrador da Clínica</strong> e <strong>Financeiro</strong>.
        Dentistas e recepcionistas terão permissões de visualização segmentadas.
      </Alert>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-emerald-50/40 border-emerald-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Total Recebido no Mês
              </span>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {formatCurrency(42850)}
              </p>
              <span className="text-[11px] text-emerald-600 mt-1 block flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14% vs mês anterior
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/40 border-rose-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Despesas Pagas & Previstas
              </span>
              <p className="text-2xl font-bold text-rose-900 mt-1">
                {formatCurrency(14200)}
              </p>
              <span className="text-[11px] text-rose-600 mt-1 block flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" /> 33% da receita bruta
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-teal-50/40 border-teal-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                Saldo Líquido em Caixa
              </span>
              <p className="text-2xl font-bold text-teal-900 mt-1">
                {formatCurrency(28650)}
              </p>
              <span className="text-[11px] text-teal-600 mt-1 block">
                Contas conciliadas
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lançamentos e Extrato do Período</CardTitle>
            <CardDescription>Receitas e despesas com identificação de paciente e categoria</CardDescription>
          </div>
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-3.5 h-3.5" />}>
            Filtrar
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição / Lançamento</TableHead>
                <TableHead>Forma de Pagamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TRANSACOES.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">
                    {tx.data}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800 text-xs">
                    {tx.descricao}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {tx.metodo}
                  </TableCell>
                  <TableCell>
                    {tx.tipo === 'income' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Receita
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-semibold">
                        <ArrowDownRight className="w-3.5 h-3.5" /> Despesa
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-bold text-xs text-slate-900 whitespace-nowrap">
                    {formatCurrency(tx.valor)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'paid' ? 'success' : 'warning'} size="sm">
                      {tx.statusLabel}
                    </Badge>
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
