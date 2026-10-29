import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types'

export interface RoleGateProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const RoleGate: React.FC<RoleGateProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { hasPermission } = useAuth()

  if (!hasPermission(allowedRoles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
