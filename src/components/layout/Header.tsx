import React, { useState } from 'react'
import {
  Menu,
  Search,
  Bell,
  Plus,
  AlertOctagon,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export interface HeaderProps {
  onToggleSidebar: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left side: Hamburger button + search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar por paciente, prontuário (ex: C-001) ou CPF..."
            className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
          />
        </div>
      </div>

      {/* Right side: Actions, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick action button */}
        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          className="hidden sm:inline-flex"
        >
          Novo Agendamento
        </Button>

        {/* Notifications dropdown trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            type="button"
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Notificações e Alertas"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Alertas Clínicos & Prazos</h4>
                  <Badge variant="critical" size="sm">2 novos</Badge>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-teal-600 hover:underline font-medium"
                >
                  Fechar
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                <div className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-200 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-800 mb-0.5">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>Alergia Grave Detectada</span>
                  </div>
                  <p className="text-rose-700">
                    Paciente <strong>Mariana Ribeiro</strong> possui alergia severa a Penicilina e derivados.
                  </p>
                  <span className="block text-[10px] text-rose-500 mt-1">Hoje às 10:30 • Prontuário C-014</span>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800 mb-0.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Trabalho de Prótese Aguardando</span>
                  </div>
                  <p className="text-amber-700">
                    Coroa Metalocerâmica dente 26 (Lab DentalArt) com entrega prevista para amanhã.
                  </p>
                  <span className="block text-[10px] text-amber-500 mt-1">Paciente: Carlos Eduardo Costa</span>
                </div>

                <div className="p-2.5 rounded-lg bg-sky-50/80 border border-sky-200 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-sky-800 mb-0.5">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>Lembrete de Consulta</span>
                  </div>
                  <p className="text-sky-700">
                    3 pacientes confirmaram presença para a tarde de hoje via mensagem.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-medium flex items-center justify-center text-xs shadow-2xs">
            MS
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-semibold text-slate-800 leading-none">
              Dr. Mateus
            </span>
            <span className="block text-[10px] text-slate-500 leading-none mt-1">
              OdontoPrime
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
