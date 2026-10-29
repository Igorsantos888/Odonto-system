import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, Mail, AlertCircle, Shield, User, CheckCircle2 } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types'
import { getRoleLabel } from '../../utils/formatters'

const authSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'A senha deve conter ao menos 6 caracteres'),
})

type AuthFormData = z.infer<typeof authSchema>

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, isConfigured, setSimulatedRole, activeRole } = useAuth()

  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const from = (location.state as any)?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: 'doutor@odontoprime.com',
      password: 'password123',
    },
  })

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true)
    setAuthError(null)
    setSuccessMessage(null)

    if (isSignUpMode) {
      const { error } = await signUp(data.email, data.password, data.fullName || 'Profissional')
      setIsLoading(false)
      if (error) {
        setAuthError(error.message)
      } else {
        setSuccessMessage('Conta cadastrada com sucesso! Verifique a confirmação em seu e-mail.')
        setIsSignUpMode(false)
      }
      return
    }

    const { error } = await signIn(data.email, data.password)
    setIsLoading(false)

    if (error) {
      setAuthError(error.message || 'Credenciais inválidas. Verifique seu e-mail e senha.')
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 text-center">
          {isSignUpMode ? 'Criar Acesso Clínico' : 'Acesso Seguro ao Sistema'}
        </h3>
        <p className="text-xs text-slate-500 text-center mt-1">
          {isSignUpMode
            ? 'Cadastre seu perfil profissional para integração ao Supabase Auth'
            : 'Informe seu e-mail e senha de profissional cadastrado'}
        </p>
      </div>

      {!isConfigured && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Simulador de Autenticação & Papéis (Etapa 2)</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            As variáveis do Supabase ainda não foram adicionadas no <code>.env.local</code>. Você
            pode alternar o papel ativo abaixo para testar permissões imediatas em cada módulo:
          </p>

          <div className="pt-1 flex flex-wrap gap-1.5">
            {(['admin_clinica', 'dentista', 'recepcao', 'financeiro', 'assistente'] as UserRole[]).map(
              (role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSimulatedRole(role)}
                  className={`text-[10px] px-2 py-1 rounded-md font-medium border transition-colors ${
                    activeRole === role
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  {getRoleLabel(role)}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {authError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isSignUpMode && (
          <Input
            label="Nome completo"
            type="text"
            leftIcon={<User className="w-4 h-4" />}
            placeholder="Dr. Mateus Silva"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
        )}

        <Input
          label="E-mail profissional"
          type="email"
          leftIcon={<Mail className="w-4 h-4" />}
          placeholder="exemplo@clinica.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Senha de acesso"
          type="password"
          leftIcon={<Lock className="w-4 h-4" />}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        {!isSignUpMode && (
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500" />
              Lembrar acesso
            </label>
            <a href="#forgot" className="text-teal-600 hover:underline font-medium">
              Esqueceu a senha?
            </a>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isLoading}
        >
          {isSignUpMode ? 'Cadastrar Conta' : 'Entrar na Clínica'}
        </Button>
      </form>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUpMode(!isSignUpMode)
            setAuthError(null)
            setSuccessMessage(null)
          }}
          className="text-xs text-teal-600 hover:underline font-semibold"
        >
          {isSignUpMode
            ? 'Já possui cadastro? Clique para entrar'
            : 'Primeiro acesso? Crie seu cadastro profissional'}
        </button>
      </div>

      <div className="pt-4 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          <span>PostgreSQL com isolamento via Row Level Security (RLS)</span>
        </div>
      </div>
    </div>
  )
}
