import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { Loader2 } from 'lucide-react'

// Lazy loading das páginas para otimização de bundle e performance
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
const LoginPage = lazy(() => import('./pages/Login/LoginPage').then(m => ({ default: m.LoginPage })))
const AgendaPage = lazy(() => import('./pages/Agenda/AgendaPage').then(m => ({ default: m.AgendaPage })))
const PacientesPage = lazy(() => import('./pages/Pacientes/PacientesPage').then(m => ({ default: m.PacientesPage })))
const ProntuariosPage = lazy(() => import('./pages/Prontuarios/ProntuariosPage').then(m => ({ default: m.ProntuariosPage })))
const AnamnesePage = lazy(() => import('./pages/Anamnese/AnamnesePage').then(m => ({ default: m.AnamnesePage })))
const OdontogramaPage = lazy(() => import('./pages/Odontograma/OdontogramaPage').then(m => ({ default: m.OdontogramaPage })))
const ExamesPage = lazy(() => import('./pages/Exames/ExamesPage').then(m => ({ default: m.ExamesPage })))
const TratamentosPage = lazy(() => import('./pages/Tratamentos/TratamentosPage').then(m => ({ default: m.TratamentosPage })))
const FinanceiroPage = lazy(() => import('./pages/Financeiro/FinanceiroPage').then(m => ({ default: m.FinanceiroPage })))
const LaboratoriosPage = lazy(() => import('./pages/Laboratorios/LaboratoriosPage').then(m => ({ default: m.LaboratoriosPage })))
const TarefasPage = lazy(() => import('./pages/Tarefas/TarefasPage').then(m => ({ default: m.TarefasPage })))
const RelatoriosPage = lazy(() => import('./pages/Relatorios/RelatoriosPage').then(m => ({ default: m.RelatoriosPage })))
const ConfiguracoesPage = lazy(() => import('./pages/Configuracoes/ConfiguracoesPage').then(m => ({ default: m.ConfiguracoesPage })))

const PageLoader: React.FC = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="flex items-center gap-2.5 text-teal-600 text-sm font-medium">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Carregando módulo clínico...</span>
    </div>
  </div>
)

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rotas Autenticadas com AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/pacientes" element={<PacientesPage />} />
            <Route path="/prontuarios" element={<ProntuariosPage />} />
            <Route path="/anamnese" element={<AnamnesePage />} />
            <Route path="/odontograma" element={<OdontogramaPage />} />
            <Route path="/exames" element={<ExamesPage />} />
            <Route path="/tratamentos" element={<TratamentosPage />} />
            <Route path="/financeiro" element={<FinanceiroPage />} />
            <Route path="/laboratorios" element={<LaboratoriosPage />} />
            <Route path="/tarefas" element={<TarefasPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          </Route>

          {/* Rotas de Autenticação com AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Fallback de rotas desconhecidas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
