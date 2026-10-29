import React, { useState } from 'react'
import { Search, Filter, Phone, Mail, FileText, UserPlus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table'
import { maskCpf, maskPhone } from '../../utils/formatters'

const MOCK_PACIENTES = [
  {
    id: 'p1',
    nome: 'Mariana Ribeiro Alves',
    cpf: '12345678901',
    telefone: '11987654321',
    email: 'mariana.ribeiro@email.com',
    prontuario: 'C-014',
    dentistaPrincipal: 'Dr. Mateus Silva',
    alertaClinico: 'ALERGIA GRAVE: Penicilina',
    status: 'Em Tratamento',
  },
  {
    id: 'p2',
    nome: 'Carlos Eduardo Costa',
    cpf: '98765432100',
    telefone: '11976543210',
    email: 'carlos.costa@email.com',
    prontuario: 'C-001',
    dentistaPrincipal: 'Dr. Mateus Silva',
    alertaClinico: null,
    status: 'Em Tratamento',
  },
  {
    id: 'p3',
    nome: 'João Paulo de Albuquerque',
    cpf: '45678912345',
    telefone: '11965432109',
    email: 'joao.albuquerque@email.com',
    prontuario: 'C-033',
    dentistaPrincipal: 'Dr. Mateus Silva',
    alertaClinico: 'Cardiopata • Anticoagulante',
    status: 'Avaliação',
  },
  {
    id: 'p4',
    nome: 'Luciana Martins Ferreira',
    cpf: '32165498711',
    telefone: '11954321098',
    email: 'luciana.martins@email.com',
    prontuario: 'C-082',
    dentistaPrincipal: 'Dra. Beatriz Santos',
    alertaClinico: null,
    status: 'Tratamento Concluído',
  },
]

export const PacientesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPacientes = MOCK_PACIENTES.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prontuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cpf.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cadastro de Pacientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão cadastral, prontuários, contatos e vinculação aos cirurgiões-dentistas
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
          Novo Paciente
        </Button>
      </div>

      <Alert variant="warning" title="Planejado para Etapa 3">
        Este módulo receberá validação de CPF e telefone com Zod/React Hook Form,
        persistência direta no Supabase PostgreSQL e isolamento por clínica (RLS) na <strong>Etapa 3</strong>.
      </Alert>

      {/* Search & Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, prontuário (ex: C-014) ou CPF..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <span className="text-xs text-slate-400">
            {filteredPacientes.length} paciente(s) exibido(s)
          </span>
        </div>
      </div>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes Cadastrados</CardTitle>
          <CardDescription>
            Exibição com número legível de prontuário e destaque obrigatório para alertas clínicos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prontuário</TableHead>
                <TableHead>Nome do Paciente</TableHead>
                <TableHead>CPF / Documento</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Dentista Responsável</TableHead>
                <TableHead>Alerta Clínico / Alergia</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPacientes.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-800 border border-slate-200">
                      {p.prontuario}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-slate-900 block">{p.nome}</span>
                    <span className="text-xs text-slate-400">{p.status}</span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {maskCpf(p.cpf)}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{maskPhone(p.telefone)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{p.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {p.dentistaPrincipal}
                  </TableCell>
                  <TableCell>
                    {p.alertaClinico ? (
                      <Badge variant="critical" size="sm">
                        {p.alertaClinico}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Nenhum</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="outline" leftIcon={<FileText className="w-3.5 h-3.5" />}>
                        Prontuário
                      </Button>
                    </div>
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
