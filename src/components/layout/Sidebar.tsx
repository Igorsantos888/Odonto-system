import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  ClipboardList,
  Smile,
  Image as ImageIcon,
  Stethoscope,
  DollarSign,
  FlaskConical,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  X,
} from 'lucide-react'
import { Badge } from '../ui/Badge'

export interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  badge?: {
    text: string
    variant: 'critical' | 'warning' | 'success' | 'info' | 'neutral'
  }
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Visão Geral',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'Agenda', path: '/agenda', icon: Calendar, badge: { text: '6 hoje', variant: 'info' } },
    ],
  },
  {
    title: 'Módulos Clínicos',
    items: [
      { label: 'Pacientes', path: '/pacientes', icon: Users },
      { label: 'Prontuários', path: '/prontuarios', icon: FileText },
      { label: 'Anamnese', path: '/anamnese', icon: ClipboardList, badge: { text: 'Alertas', variant: 'critical' } },
      { label: 'Odontograma', path: '/odontograma', icon: Smile },
      { label: 'Exames & Imagens', path: '/exames', icon: ImageIcon },
      { label: 'Tratamentos', path: '/tratamentos', icon: Stethoscope },
    ],
  },
  {
    title: 'Gestão e Operações',
    items: [
      { label: 'Financeiro', path: '/financeiro', icon: DollarSign },
      { label: 'Laboratórios', path: '/laboratorios', icon: FlaskConical, badge: { text: '2 previstos', variant: 'warning' } },
      { label: 'Tarefas', path: '/tarefas', icon: CheckSquare },
      { label: 'Relatórios', path: '/relatorios', icon: BarChart3 },
    ],
  },
  {
    title: 'Configurações',
    items: [
      { label: 'Configurações', path: '/configuracoes', icon: Settings },
    ],
  },
]

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-200">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">ODONTO</span>
              <span className="block text-[10px] uppercase font-bold text-teal-600 tracking-wider">
                Gestão Odontológica
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clinic context badge / selector */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Clínica Ativa
              </span>
              <span className="block font-semibold text-slate-800 truncate">
                OdontoPrime Matriz
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold border border-teal-200">
              RLS ON
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {section.title}
              </h4>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => {
                        // Close sidebar on mobile when navigating
                        if (window.innerWidth < 1024) onClose()
                      }}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200/60 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`
                      }
                      end={item.path === '/'}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <item.icon
                              className={`w-4 h-4 transition-colors ${
                                isActive ? 'text-teal-600' : 'text-slate-400'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <Badge
                              variant={item.badge.variant}
                              size="sm"
                              showDefaultIcon={false}
                            >
                              {item.badge.text}
                            </Badge>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User profile & footer */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-semibold flex items-center justify-center text-xs ring-2 ring-teal-200/50">
              MS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">Dr. Mateus Silva</p>
              <p className="text-[11px] text-slate-500 truncate">CRO-SP 104.821 • Admin</p>
            </div>
            <NavLink
              to="/login"
              title="Sair / Login"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </NavLink>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Versão 1.0 (Etapa 1)</span>
            <span className="text-teal-600 font-medium">Modo Seguro</span>
          </div>
        </div>
      </aside>
    </>
  )
}
