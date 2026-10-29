-- ==============================================================================
-- MIGRAÇÃO 0001: Esquema Inicial — Clínicas, Perfis e Membros
-- Sistema Odontológico ODONTO
-- ==============================================================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipo enumerado para papéis do sistema clínico
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'admin_clinica',
            'dentista',
            'recepcao',
            'financeiro',
            'assistente'
        );
    END IF;
END$$;

-- 1. TABELA DE CLÍNICAS (Multitenancy / Unidades de Atendimento)
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    record_numbering_mode TEXT NOT NULL DEFAULT 'per_professional' 
        CHECK (record_numbering_mode IN ('per_professional', 'per_clinic')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentários da tabela de clínicas
COMMENT ON TABLE public.clinics IS 'Unidades clínicas odontológicas atendidas pela plataforma.';
COMMENT ON COLUMN public.clinics.record_numbering_mode IS 'Estratégia de prontuário: por profissional (ex: C-001) ou global da clínica.';

-- 2. TABELA DE PERFIS DE USUÁRIOS (Vinculada a auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    cro TEXT, -- Conselho Regional de Odontologia (obrigatório para dentistas)
    specialty TEXT,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfil público e dados profissionais associados à conta de autenticação.';

-- 3. TABELA DE MEMBROS DA CLÍNICA (Relacionamento N-N entre Clínicas e Usuários com Papel)
CREATE TABLE IF NOT EXISTS public.clinic_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'dentista',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_clinic_member UNIQUE (clinic_id, user_id)
);

COMMENT ON TABLE public.clinic_members IS 'Vínculo do usuário com a clínica, seu papel e status ativo de acesso.';

-- Índices de alto desempenho para consultas frequentes e RLS
CREATE INDEX IF NOT EXISTS idx_clinic_members_user ON public.clinic_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_members_clinic ON public.clinic_members(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_members_role ON public.clinic_members(role);
CREATE INDEX IF NOT EXISTS idx_clinic_members_active ON public.clinic_members(is_active);

-- Função utilitária para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de atualização automática de updated_at
DROP TRIGGER IF EXISTS set_clinics_updated_at ON public.clinics;
CREATE TRIGGER set_clinics_updated_at
    BEFORE UPDATE ON public.clinics
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_clinic_members_updated_at ON public.clinic_members;
CREATE TRIGGER set_clinic_members_updated_at
    BEFORE UPDATE ON public.clinic_members
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger que cria perfil automaticamente ao registrar novo usuário em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
