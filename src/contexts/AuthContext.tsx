import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import type { Profile, Clinic, UserRole } from '../types'

export interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  clinics: Clinic[]
  activeClinic: Clinic | null
  activeRole: UserRole | null
  isLoading: boolean
  isConfigured: boolean
  setActiveClinicId: (clinicId: string) => void
  setSimulatedRole: (role: UserRole) => void // Para testes rápidos na demonstração
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  // Permissões
  isAdmin: boolean
  isDentist: boolean
  isReception: boolean
  isFinance: boolean
  isAssistant: boolean
  hasPermission: (allowedRoles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Dados de perfil e clínica para modo de teste/demonstração quando .env.local não estiver configurado
const MOCK_DEMO_CLINICS: Clinic[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'OdontoPrime Matriz',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 3321-4500',
    email: 'contato@odontoprime.com.br',
    address: 'Av. Paulista, 1500, Sala 1204 - Bela Vista, São Paulo - SP',
    timezone: 'America/Sao_Paulo',
    created_at: new Date().toISOString(),
  },
  {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    name: 'Clínica OdontoSul Filial',
    cnpj: '98.765.432/0001-10',
    phone: '(11) 4567-8900',
    email: 'sul@odontoprime.com.br',
    address: 'Rua Domingos de Morais, 800 - Vila Mariana, São Paulo - SP',
    timezone: 'America/Sao_Paulo',
    created_at: new Date().toISOString(),
  },
]

const MOCK_DEMO_PROFILE: Profile = {
  id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
  full_name: 'Dr. Mateus Silva',
  cro: 'CRO-SP 104.821',
  specialty: 'Cirurgia & Implantodontia',
  phone: '(11) 98765-4321',
  email: 'mateus.silva@odontoprime.com',
  active: true,
  created_at: new Date().toISOString(),
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [activeClinic, setActiveClinic] = useState<Clinic | null>(null)
  const [activeRole, setActiveRole] = useState<UserRole | null>('admin_clinica')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Carrega dados do perfil e membros no Supabase quando autenticado
  const fetchUserData = async (userId: string) => {
    try {
      // 1. Carrega Perfil
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileErr) {
        console.warn('Não foi possível carregar o perfil:', profileErr.message)
      } else if (profileData) {
        setProfile(profileData as Profile)
      }

      // 2. Carrega Clínicas e Membros associados
      const { data: membersData, error: membersErr } = await supabase
        .from('clinic_members')
        .select(`
          role,
          clinic:clinics (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (membersErr) {
        console.warn('Erro ao carregar vínculos com clínicas:', membersErr.message)
      } else if (membersData && membersData.length > 0) {
        const userClinics = membersData
          .map((m: any) => m.clinic)
          .filter(Boolean) as Clinic[]

        setClinics(userClinics)
        if (userClinics.length > 0) {
          setActiveClinic(userClinics[0])
          setActiveRole((membersData[0] as any).role as UserRole)
        }
      }
    } catch (err) {
      console.error('Falha inesperada ao carregar dados do usuário:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Modo de demonstração com dados simulados
      setClinics(MOCK_DEMO_CLINICS)
      setActiveClinic(MOCK_DEMO_CLINICS[0])
      setProfile(MOCK_DEMO_PROFILE)
      setActiveRole('admin_clinica')
      setIsLoading(false)
      return
    }

    // Inicialização da sessão com Supabase Auth
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      if (initialSession?.user) {
        fetchUserData(initialSession.user.id)
      } else {
        setIsLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        fetchUserData(currentSession.user.id)
      } else {
        setProfile(null)
        setClinics([])
        setActiveClinic(null)
        setActiveRole(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const setActiveClinicId = (clinicId: string) => {
    const found = clinics.find((c) => c.id === clinicId)
    if (found) {
      setActiveClinic(found)
    }
  }

  const setSimulatedRole = (role: UserRole) => {
    setActiveRole(role)
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Simulação rápida para demonstração
      setIsLoading(true)
      setTimeout(() => {
        setClinics(MOCK_DEMO_CLINICS)
        setActiveClinic(MOCK_DEMO_CLINICS[0])
        setProfile(MOCK_DEMO_PROFILE)
        setActiveRole('admin_clinica')
        setIsLoading(false)
      }, 300)
      return { error: null }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error ? new Error(error.message) : null }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      return { error: null }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error: error ? new Error(error.message) : null }
  }

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setSession(null)
    setUser(null)
    setProfile(null)
    setActiveClinic(null)
    setActiveRole(null)
  }

  // Helpers de papéis (RBAC)
  const isAdmin = activeRole === 'admin_clinica'
  const isDentist = activeRole === 'dentista' || isAdmin
  const isReception = activeRole === 'recepcao' || isAdmin
  const isFinance = activeRole === 'financeiro' || isAdmin
  const isAssistant = activeRole === 'assistente' || isDentist || isAdmin

  const hasPermission = (allowedRoles: UserRole[]): boolean => {
    if (!activeRole) return false
    if (activeRole === 'admin_clinica') return true // Admin da clínica tem acesso amplo
    return allowedRoles.includes(activeRole)
  }

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      clinics,
      activeClinic,
      activeRole,
      isLoading,
      isConfigured: isSupabaseConfigured,
      setActiveClinicId,
      setSimulatedRole,
      signIn,
      signUp,
      signOut,
      isAdmin,
      isDentist,
      isReception,
      isFinance,
      isAssistant,
      hasPermission,
    }),
    [
      session,
      user,
      profile,
      clinics,
      activeClinic,
      activeRole,
      isLoading,
      isAdmin,
      isDentist,
      isReception,
      isFinance,
      isAssistant,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
