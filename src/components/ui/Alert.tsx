import React from 'react'
import { AlertOctagon, Clock, CheckCircle2, Info, X } from 'lucide-react'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'critical' | 'warning' | 'success' | 'info'
  title?: string
  children: React.ReactNode
  onClose?: () => void
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
  ...props
}) => {
  const configs = {
    critical: {
      container: 'bg-rose-50 border-rose-300 text-rose-900',
      icon: <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" aria-label="Alerta Crítico" />,
      titleColor: 'text-rose-900',
    },
    warning: {
      container: 'bg-amber-50 border-amber-300 text-amber-900',
      icon: <Clock className="w-5 h-5 text-amber-700 shrink-0" aria-label="Aviso de Pendência" />,
      titleColor: 'text-amber-900',
    },
    success: {
      container: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-label="Sucesso" />,
      titleColor: 'text-emerald-900',
    },
    info: {
      container: 'bg-sky-50 border-sky-300 text-sky-900',
      icon: <Info className="w-5 h-5 text-sky-700 shrink-0" aria-label="Informação" />,
      titleColor: 'text-sky-900',
    },
  }

  const current = configs[variant]

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-4 border rounded-xl shadow-xs transition-all ${current.container} ${className}`}
      {...props}
    >
      <div className="mt-0.5">{current.icon}</div>
      <div className="flex-1 text-sm">
        {title && <h4 className={`font-semibold mb-0.5 ${current.titleColor}`}>{title}</h4>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="text-slate-400 hover:text-slate-600 rounded-md p-1 transition-colors"
          aria-label="Fechar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
