import React from 'react'
import { Building2, Users, Hash, Save } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'

const MOCK_MEMBROS = [
  {
    id: 'm1',
    nome: 'Dr. Mateus Silva',
    email: 'mateus.silva@odontoprime.com',
    papel: 'Administrador da Clínica / Dentista',
    cro: 'CRO-SP 104.821',
    status: 'Ativo',
  },
  {
    id: 'm2',
    nome: 'Dra. Beatriz Santos',
    email: 'beatriz.santos@odontoprime.com',
    papel: 'Dentista',
    cro: 'CRO-SP 119.452',
    status: 'Ativo',
  },
  {
    id: 'm3',
    nome: 'Camila Ferreira',
    email: 'camila.recepcao@odontoprime.com',
    papel: 'Recepção',
    cro: '-',
    status: 'Ativo',
  },
  {
    id: 'm4',
    nome: 'Letícia Souza',
    email: 'leticia.auxiliar@odontoprime.com',
    papel: 'Assistente (ASO)',
    cro: '-',
    status: 'Ativo',
  },
]

export const ConfiguracoesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Configurações da Clínica & Segurança
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dados cadastrais da clínica, gestão de membros, papéis de acesso e numeração de prontuários
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />}>
          Salvar Alterações
        </Button>
      </div>

      <Alert variant="info" title="Isolamento Multiclínica & RLS (Etapa 2)">
        Todas as configurações são isoladas pelo identificador <code>clinic_id</code>. Membros
        de uma clínica não têm visibilidade de dados ou configurações de outras clínicas no banco PostgreSQL.
      </Alert>

      {/* Clinic General Data Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Dados da Unidade Clínica</span>
          </CardTitle>
          <CardDescription>Informações institucionais para documentos e cabeçalhos de receitas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Razão Social / Nome da Clínica" defaultValue="OdontoPrime Odontologia Especializada Ltda." />
            <Input label="CNPJ" defaultValue="12.345.678/0001-90" />
            <Input label="Telefone / WhatsApp" defaultValue="(11) 3321-4500" />
            <Input label="E-mail Institucional" defaultValue="contato@odontoprime.com.br" />
          </div>
          <Input label="Endereço Completo" defaultValue="Av. Paulista, 1500, Sala 1204 - Bela Vista, São Paulo - SP" />
        </CardContent>
      </Card>

      {/* Record Numbering Strategy (PDF page 6 & 12 requirement) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-teal-600" />
            <span>Numeração de Prontuários</span>
          </CardTitle>
          <CardDescription>
            Regra de unicidade e numeração legível para os pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <input type="radio" name="record_mode" defaultChecked className="text-teal-600 focus:ring-teal-500" />
              <span>Numeração com Prefixo por Profissional (Recomendado na especificação)</span>
            </div>
            <p className="text-slate-500 pl-5">
              Cada cirurgião-dentista possui sua própria sequência legível (ex: Dr. Mateus utiliza <code>C-001</code>,
              Dra. Beatriz também pode ter <code>C-001</code>). A unicidade é garantida pela combinação
              <code>(clinic_id, professional_id, record_number)</code> com UUID interno.
            </p>

            <div className="flex items-center gap-2 font-semibold text-slate-900 pt-2">
              <input type="radio" name="record_mode" className="text-teal-600 focus:ring-teal-500" />
              <span>Numeração Sequencial Unificada da Clínica</span>
            </div>
            <p className="text-slate-500 pl-5">
              Sequência global para toda a clínica (ex: PAC-0001, PAC-0002 independentemente do profissional atendente).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Team & Permissions Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Equipe & Papéis de Acesso</span>
            </CardTitle>
            <CardDescription>Membros autorizados nesta unidade clínica</CardDescription>
          </div>
          <Button size="sm" variant="outline" leftIcon={<Users className="w-3.5 h-3.5" />}>
            Convidar Membro
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro / Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Registro / CRO</TableHead>
                <TableHead>Papel no Sistema</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_MEMBROS.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-semibold text-xs text-slate-900">
                    {m.nome}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {m.email}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-600">
                    {m.cro}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {m.papel}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" size="sm">{m.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">Editar</Button>
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
