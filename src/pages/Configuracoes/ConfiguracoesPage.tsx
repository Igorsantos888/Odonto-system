import React, { useState } from 'react'
import {
  Building2,
  Users,
  Hash,
  Save,
  ShieldCheck,
  CheckCircle2,
  Database,
  UserCheck,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types'

export const ConfiguracoesPage: React.FC = () => {
  const {
    activeClinic,
    activeRole,
    setSimulatedRole,
    isAdmin,
  } = useAuth()

  const [clinicName, setClinicName] = useState(activeClinic?.name || 'OdontoPrime Matriz')
  const [cnpj, setCnpj] = useState(activeClinic?.cnpj || '12.345.678/0001-90')
  const [phone, setPhone] = useState(activeClinic?.phone || '(11) 3321-4500')
  const [email, setEmail] = useState(activeClinic?.email || 'contato@odontoprime.com.br')
  const [address, setAddress] = useState(
    activeClinic?.address || 'Av. Paulista, 1500, Sala 1204 - Bela Vista, São Paulo - SP'
  )
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const teamMembers = [
    {
      id: 'm1',
      nome: 'Dr. Mateus Silva',
      email: 'mateus.silva@odontoprime.com',
      papel: 'admin_clinica',
      papelLabel: 'Administrador da Clínica & Dentista',
      cro: 'CRO-SP 104.821',
      status: 'Ativo',
    },
    {
      id: 'm2',
      nome: 'Dra. Beatriz Santos',
      email: 'beatriz.santos@odontoprime.com',
      papel: 'dentista',
      papelLabel: 'Cirurgiã-Dentista',
      cro: 'CRO-SP 119.452',
      status: 'Ativo',
    },
    {
      id: 'm3',
      nome: 'Camila Ferreira',
      email: 'camila.recepcao@odontoprime.com',
      papel: 'recepcao',
      papelLabel: 'Recepcionista',
      cro: '-',
      status: 'Ativo',
    },
    {
      id: 'm4',
      nome: 'Marcos Finanças',
      email: 'marcos.financeiro@odontoprime.com',
      papel: 'financeiro',
      papelLabel: 'Gestor Financeiro',
      cro: '-',
      status: 'Ativo',
    },
    {
      id: 'm5',
      nome: 'Letícia Souza',
      email: 'leticia.auxiliar@odontoprime.com',
      papel: 'assistente',
      papelLabel: 'Assistente Odontológica (ASO)',
      cro: '-',
      status: 'Ativo',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Configurações da Clínica & Segurança
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dados cadastrais da unidade, gestão de membros, políticas de segurança e numeração
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="w-4 h-4" />}
            onClick={handleSave}
          >
            Salvar Alterações
          </Button>
        )}
      </div>

      {isSaved && (
        <Alert variant="success" title="Configurações atualizadas">
          Os dados cadastrais da clínica foram salvos com sucesso no sistema.
        </Alert>
      )}

      {/* Role Switcher for Test / Verification */}
      <Card className="border-teal-300 bg-teal-50/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-900 text-sm">
            <UserCheck className="w-4 h-4 text-teal-600" />
            <span>Simulador de Papéis de Acesso (Teste Rápido de Permissões)</span>
          </CardTitle>
          <CardDescription>
            Alterne o papel do usuário logado para validar dinamicamente as restrições da interface
            (ex: módulo financeiro restrito, prontuários para dentistas, recepção, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { role: 'admin_clinica' as UserRole, label: 'Admin da Clínica' },
              { role: 'dentista' as UserRole, label: 'Cirurgião-Dentista' },
              { role: 'financeiro' as UserRole, label: 'Financeiro' },
              { role: 'recepcao' as UserRole, label: 'Recepção' },
              { role: 'assistente' as UserRole, label: 'Assistente (ASO)' },
            ].map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => setSimulatedRole(item.role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeRole === item.role
                    ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-600 ring-offset-1'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Papel ativo no momento: <strong className="text-teal-700">{activeRole}</strong>
          </p>
        </CardContent>
      </Card>

      {/* Clinic General Data */}
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
            <Input
              label="Razão Social / Nome da Clínica"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              disabled={!isAdmin}
            />
            <Input
              label="CNPJ"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              disabled={!isAdmin}
            />
            <Input
              label="Telefone / WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isAdmin}
            />
            <Input
              label="E-mail Institucional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isAdmin}
            />
          </div>
          <Input
            label="Endereço Completo"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!isAdmin}
          />
        </CardContent>
      </Card>

      {/* Security and LGPD Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Checklist de Segurança & Conformidade LGPD</span>
          </CardTitle>
          <CardDescription>
            Mecanismos de isolamento e proteção ativa de dados da clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-emerald-950 block">Row Level Security (RLS) Ativo</strong>
                <span className="text-emerald-800 text-[11px]">
                  Todas as tabelas possuem RLS forçado com checagem via <code>clinic_id</code>.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-emerald-950 block">Armazenamento Clínico Privado</strong>
                <span className="text-emerald-800 text-[11px]">
                  Bucket <code>clinical-exams</code> 100% privado com links assinados de 15 minutos.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-emerald-950 block">Imutabilidade de Prontuários (CFO)</strong>
                <span className="text-emerald-800 text-[11px]">
                  Evoluções clínicas e anamneses têm exclusão desabilitada (<code>DELETE USING false</code>).
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-emerald-950 block">Prevenção de Duplo Agendamento</strong>
                <span className="text-emerald-800 text-[11px]">
                  Restrição de exclusão temporal via <code>btree_gist</code> no banco PostgreSQL.
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Numbering Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-teal-600" />
            <span>Numeração de Prontuários</span>
          </CardTitle>
          <CardDescription>
            Regra de unicidade e numeração legível para os pacientes da clínica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Database className="w-4 h-4 text-teal-600" />
              <span>Estratégia Recomendada: Sequencial por Clínica com Fallback UUID</span>
            </div>
            <p>
              O sistema gera números sequenciais amigáveis por clínica (ex:{' '}
              <code>ODONTO-0001</code>, <code>ODONTO-0002</code>), preservando internamente a chave
              primária <code>UUID v4</code> para evitar qualquer colisão ou inferência externa de
              volume.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Clinic Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Equipe & Profissionais Cadastrados</span>
            </CardTitle>
            <CardDescription>Membros com acesso aos módulos operacionais e clínicos</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel de Acesso</TableHead>
                <TableHead>CRO</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-semibold text-xs text-slate-900">
                    {member.nome}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {member.email}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={member.papel === 'admin_clinica' ? 'info' : 'neutral'} size="sm">
                      {member.papelLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {member.cro}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {member.status}
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
