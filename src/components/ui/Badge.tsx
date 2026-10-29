import React from 'react'
import { Clock, CheckCircle2, Info, AlertOctagon } from 'lucide-react'

export type BadgeVariant =
  | 'critical' // Vermelho: alerta clínico, alergia grave (com ícone)
  | 'warning'  // Amarelo: pendência, prazo próximo, laboratório
  | 'success'  // Verde: concluído ou confirmado
  | 'info'     // Azul/Ciano: agendado, informativo
  | 'neutral'  // Cinza: rascunho, arquivado

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  showDefaultIcon?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  showDefaultIcon = true,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
  }

  const variantStyles = {
    critical: 'bg-rose-50 text-rose-700 border border-rose-200 ring-1 ring-rose-200/50',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200 ring-1 ring-amber-200/50',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-200/50',
    info: 'bg-sky-50 text-sky-700 border border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  }

  const renderDefaultIcon = () => {
    if (!showDefaultIcon) return null
    switch (variant) {
      case 'critical':
        return <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
      case 'warning':
        return <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
      case 'info':
        return <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" aria-hidden="true" />
      default:
        return null
    }
  }

  return (
    <span
      className={`inline-flex items-center rounded-full leading-none tracking-wide ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon || renderDefaultIcon()}
      <span>{children}</span>
    </span>
  )
}
