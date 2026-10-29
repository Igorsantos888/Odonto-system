// ==========================================
// Formatadores e Utilitários de Apresentação
// ==========================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatTime(dateString?: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function maskCpf(value?: string | null): string {
  if (!value) return '-'
  const clean = value.replace(/\D/g, '')
  if (clean.length !== 11) return value
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function maskPhone(value?: string | null): string {
  if (!value) return '-'
  const clean = value.replace(/\D/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return value
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin_clinica':
      return 'Administrador da Clínica'
    case 'dentista':
      return 'Cirurgião-Dentista'
    case 'recepcao':
      return 'Recepção'
    case 'financeiro':
      return 'Financeiro'
    case 'assistente':
      return 'Assistente Odontológico (ASO)'
    default:
      return role
  }
}
