import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Header } from '../components/layout/Header'
import { AlertCircle } from 'lucide-react'

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main app wrapper (with left margin on lg screens to accommodate fixed 72-width sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Development & Mock data banner */}
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 border-b border-amber-600 shadow-2xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>Etapa 1 — Ambiente de Desenvolvimento:</strong> Interface base em execução com dados fictícios claramente identificados.
          </span>
        </div>

        {/* Global sticky header */}
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        {/* Scrollable page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
