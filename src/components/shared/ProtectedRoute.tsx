import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '../ui/Button'
import { getRoleLabel } from '../../utils/formatters'

export interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
}) => {
  const { user, isConfigured, isLoading, activeRole, hasPermission } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xs font-semibold text-teal-600 animate-pulse">
          Validando credenciais e permissões clínicas...
        </div>
      </div>
    )
  }

  // Se Supabase estiver configurado e o usuário não estiver autenticado, redireciona ao login
  if (isConfigured && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se houver exigência de papel e o papel ativo não for suficiente
  if (requiredRoles && requiredRoles.length > 0 && !hasPermission(requiredRoles)) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Acesso Restrito ao Módulo
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Seu papel atual (<strong>{getRoleLabel(activeRole || '')}</strong>) não possui
          permissão para acessar esta seção. Conforme a política de privilégio mínimo e a LGPD,
          apenas os seguintes papéis estão autorizados:
        </p>

        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {requiredRoles.map((role) => (
            <span
              key={role}
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200"
            >
              {getRoleLabel(role)}
            </span>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Voltar à Página Anterior
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
