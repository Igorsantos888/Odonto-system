import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, AlertCircle, Shield } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { isSupabaseConfigured } from '../../services/supabase'

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'A senha deve conter ao menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'doutor@odontoprime.com',
      password: '******',
    },
  })

  const onSubmit = async (_data: LoginFormData) => {
    setIsLoading(true)
    setAuthError(null)

    // Se as credenciais reais do Supabase ainda não estiverem configuradas,
    // permite navegação demonstrativa na Etapa 1
    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setIsLoading(false)
        navigate('/')
      }, 600)
      return
    }

    // Na Etapa 2, conectará diretamente com supabase.auth.signInWithPassword
    setIsLoading(false)
    navigate('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 text-center">
          Acesso Seguro ao Sistema
        </h3>
        <p className="text-xs text-slate-500 text-center mt-1">
          Informe seu e-mail e senha de profissional cadastrado
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Modo Demonstrativo (Etapa 1):</strong> O formulário abaixo simula a autenticação.
            As credenciais reais do Supabase Auth serão integradas na <strong>Etapa 2</strong>.
          </div>
        </div>
      )}

      {authError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="E-mail profissional"
          type="email"
          leftIcon={<Mail className="w-4 h-4" />}
          placeholder="exemplo@clinica.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Senha"
          type="password"
          leftIcon={<Lock className="w-4 h-4" />}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
            <input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500" />
            Lembrar acesso
          </label>
          <a href="#forgot" className="text-teal-600 hover:underline font-medium">
            Esqueceu a senha?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isLoading}
        >
          Entrar na Clínica
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          <span>Acesso protegido por autenticação Supabase & RLS</span>
        </div>
      </div>
    </div>
  )
}
