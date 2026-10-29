import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Smile, ShieldCheck, HeartHandshake } from 'lucide-react'

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background soft ambient blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-500/30 mb-4">
          <Smile className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Sistema Odontológico
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Plataforma clínica multiclínica segura com PostgreSQL & RLS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800/10">
          <Outlet />
        </div>

        {/* Security badges below card */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>PostgreSQL RLS Habilitado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-teal-400" />
            <span>Em conformidade com a LGPD</span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-white transition-colors underline"
          >
            ← Voltar para o Dashboard de demonstração
          </Link>
        </div>
      </div>
    </div>
  )
}
