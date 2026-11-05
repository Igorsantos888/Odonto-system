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
-- ==============================================================================
-- MIGRAÇÃO 0002: Segurança, Papéis e Políticas RLS (Row Level Security)
-- Sistema Odontológico ODONTO
-- ==============================================================================

-- 1. FUNÇÕES AUXILIARES DE SEGURANÇA (SECURITY DEFINER para prevenir recursão de RLS)

-- Verifica se o usuário atual é membro ativo da clínica informada
CREATE OR REPLACE FUNCTION public.is_member_of_clinic(clinic_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.clinic_members
        WHERE clinic_id = clinic_uuid
          AND user_id = auth.uid()
          AND is_active = true
    );
$$;

COMMENT ON FUNCTION public.is_member_of_clinic(UUID) IS 'Verifica se auth.uid() é membro ativo da clínica especificada.';

-- Retorna o papel do usuário atual em determinada clínica
CREATE OR REPLACE FUNCTION public.get_user_clinic_role(clinic_uuid UUID)
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role
    FROM public.clinic_members
    WHERE clinic_id = clinic_uuid
      AND user_id = auth.uid()
      AND is_active = true
    LIMIT 1;
$$;

-- Verifica se o usuário atual é Administrador da Clínica
CREATE OR REPLACE FUNCTION public.is_clinic_admin(clinic_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.clinic_members
        WHERE clinic_id = clinic_uuid
          AND user_id = auth.uid()
          AND is_active = true
          AND role = 'admin_clinica'
    );
$$;

COMMENT ON FUNCTION public.is_clinic_admin(UUID) IS 'Verifica se auth.uid() possui o papel de admin_clinica na clínica informada.';

-- Retorna a lista de IDs de clínicas das quais o usuário autenticado faz parte
CREATE OR REPLACE FUNCTION public.get_user_clinic_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT clinic_id
    FROM public.clinic_members
    WHERE user_id = auth.uid()
      AND is_active = true;
$$;


-- ==============================================================================
-- 2. ATIVAÇÃO DE RLS EM TODAS AS TABELAS
-- ==============================================================================

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics FORCE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.clinic_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_members FORCE ROW LEVEL SECURITY;


-- ==============================================================================
-- 3. POLÍTICAS DE RLS: public.clinics
-- ==============================================================================

-- Leitura: Apenas membros ativos podem visualizar as clínicas a que pertencem
DROP POLICY IF EXISTS "Membros podem visualizar suas clinicas" ON public.clinics;
CREATE POLICY "Membros podem visualizar suas clinicas"
    ON public.clinics
    FOR SELECT
    TO authenticated
    USING (public.is_member_of_clinic(id));

-- Inserção: Qualquer usuário autenticado pode criar uma nova clínica (onboarding)
DROP POLICY IF EXISTS "Usuarios autenticados podem criar clinicas" ON public.clinics;
CREATE POLICY "Usuarios autenticados podem criar clinicas"
    ON public.clinics
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Atualização: Apenas administradores da clínica podem alterar dados institucionais
DROP POLICY IF EXISTS "Apenas admins podem atualizar dados da clinica" ON public.clinics;
CREATE POLICY "Apenas admins podem atualizar dados da clinica"
    ON public.clinics
    FOR UPDATE
    TO authenticated
    USING (public.is_clinic_admin(id))
    WITH CHECK (public.is_clinic_admin(id));

-- Exclusão: Apenas administradores da clínica podem remover a clínica
DROP POLICY IF EXISTS "Apenas admins podem excluir a clinica" ON public.clinics;
CREATE POLICY "Apenas admins podem excluir a clinica"
    ON public.clinics
    FOR DELETE
    TO authenticated
    USING (public.is_clinic_admin(id));


-- ==============================================================================
-- 4. POLÍTICAS DE RLS: public.profiles
-- ==============================================================================

-- Leitura: Usuário pode ver seu próprio perfil ou perfis de colegas que compartilham uma clínica ativa
DROP POLICY IF EXISTS "Usuarios podem ler seu perfil e de colegas de clinica" ON public.profiles;
CREATE POLICY "Usuarios podem ler seu perfil e de colegas de clinica"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.clinic_members cm_target
            WHERE cm_target.user_id = profiles.id
              AND cm_target.clinic_id IN (SELECT public.get_user_clinic_ids())
        )
    );

-- Inserção: Usuário pode inserir somente o seu próprio perfil
DROP POLICY IF EXISTS "Usuarios podem inserir seu proprio perfil" ON public.profiles;
CREATE POLICY "Usuarios podem inserir seu proprio perfil"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Atualização: Usuário pode atualizar somente o seu próprio perfil
DROP POLICY IF EXISTS "Usuarios podem atualizar seu proprio perfil" ON public.profiles;
CREATE POLICY "Usuarios podem atualizar seu proprio perfil"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Exclusão: Não permitida exclusão direta por clientes
DROP POLICY IF EXISTS "Nenhum usuario pode excluir perfis diretamente" ON public.profiles;
CREATE POLICY "Nenhum usuario pode excluir perfis diretamente"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (false);


-- ==============================================================================
-- 5. POLÍTICAS DE RLS: public.clinic_members
-- ==============================================================================

-- Leitura: Membro ativo da clínica pode listar os demais membros dessa clínica
DROP POLICY IF EXISTS "Membros podem ver membros da mesma clinica" ON public.clinic_members;
CREATE POLICY "Membros podem ver membros da mesma clinica"
    ON public.clinic_members
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_member_of_clinic(clinic_id)
    );

-- Inserção:
-- a) Administrador da clínica pode convidar/adicionar novos membros; OU
-- b) Criador da clínica pode se vincular como primeiro membro (admin_clinica)
DROP POLICY IF EXISTS "Admins podem adicionar membros ou criador se auto-adiciona" ON public.clinic_members;
CREATE POLICY "Admins podem adicionar membros ou criador se auto-adiciona"
    ON public.clinic_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_clinic_admin(clinic_id)
        OR (
            user_id = auth.uid()
            AND NOT EXISTS (
                SELECT 1 FROM public.clinic_members cm
                WHERE cm.clinic_id = clinic_members.clinic_id
            )
        )
    );

-- Atualização: Apenas Administrador da clínica pode alterar papel ou status de membros
DROP POLICY IF EXISTS "Apenas admins podem alterar membros" ON public.clinic_members;
CREATE POLICY "Apenas admins podem alterar membros"
    ON public.clinic_members
    FOR UPDATE
    TO authenticated
    USING (public.is_clinic_admin(clinic_id))
    WITH CHECK (public.is_clinic_admin(clinic_id));

-- Exclusão: Apenas Administrador da clínica pode remover membros
DROP POLICY IF EXISTS "Apenas admins podem remover membros" ON public.clinic_members;
CREATE POLICY "Apenas admins podem remover membros"
    ON public.clinic_members
    FOR DELETE
    TO authenticated
    USING (public.is_clinic_admin(clinic_id));


-- ==============================================================================
-- 6. TRIGGER AUTOMÁTICO: VINCULAR CRIADOR DA CLÍNICA COMO ADMIN
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_clinic_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o usuário autenticado for válido, adiciona-o como admin da nova clínica
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.clinic_members (clinic_id, user_id, role, is_active)
        VALUES (NEW.id, auth.uid(), 'admin_clinica', true)
        ON CONFLICT (clinic_id, user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_clinic_created ON public.clinics;
CREATE TRIGGER on_clinic_created
    AFTER INSERT ON public.clinics
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_clinic_admin();
-- ==============================================================================
-- MIGRAÇÃO 0003: Esquema e RLS para Pacientes e Vínculos com Profissionais
-- Sistema Odontológico ODONTO (Etapa 3)
-- ==============================================================================

-- 1. TABELA DE PACIENTES
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    cpf TEXT,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('M', 'F', 'outro')),
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.patients IS 'Cadastro de pacientes vinculados a uma unidade clínica.';

-- 2. TABELA DE VÍNCULOS N-N ENTRE PACIENTE E PROFISSIONAIS
CREATE TABLE IF NOT EXISTS public.patient_professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_patient_professional UNIQUE (patient_id, professional_id, clinic_id)
);

COMMENT ON TABLE public.patient_professionals IS 'Vínculo entre o paciente e seus cirurgiões-dentistas de referência.';

-- Índices de busca e ordenação
CREATE INDEX IF NOT EXISTS idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON public.patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON public.patients(cpf);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_prof_patient ON public.patient_professionals(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_prof_prof ON public.patient_professionals(professional_id);
CREATE INDEX IF NOT EXISTS idx_patient_prof_clinic ON public.patient_professionals(clinic_id);

-- Trigger de updated_at para tabela patients
DROP TRIGGER IF EXISTS set_patients_updated_at ON public.patients;
CREATE TRIGGER set_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) PARA PACIENTES
-- ==============================================================================

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients FORCE ROW LEVEL SECURITY;

-- Leitura: Qualquer membro ativo da clínica pode consultar os pacientes daquela clínica
DROP POLICY IF EXISTS "Membros da clinica podem ver pacientes" ON public.patients;
CREATE POLICY "Membros da clinica podem ver pacientes"
    ON public.patients
    FOR SELECT
    TO authenticated
    USING (public.is_member_of_clinic(clinic_id));

-- Inserção: Membros ativos da clínica podem cadastrar novos pacientes
DROP POLICY IF EXISTS "Membros da clinica podem cadastrar pacientes" ON public.patients;
CREATE POLICY "Membros da clinica podem cadastrar pacientes"
    ON public.patients
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_member_of_clinic(clinic_id));

-- Atualização: Membros ativos da clínica podem atualizar dados de pacientes
DROP POLICY IF EXISTS "Membros da clinica podem atualizar pacientes" ON public.patients;
CREATE POLICY "Membros da clinica podem atualizar pacientes"
    ON public.patients
    FOR UPDATE
    TO authenticated
    USING (public.is_member_of_clinic(clinic_id))
    WITH CHECK (public.is_member_of_clinic(clinic_id));

-- Exclusão: Apenas administradores da clínica podem remover pacientes
DROP POLICY IF EXISTS "Apenas admins da clinica podem excluir pacientes" ON public.patients;
CREATE POLICY "Apenas admins da clinica podem excluir pacientes"
    ON public.patients
    FOR DELETE
    TO authenticated
    USING (public.is_clinic_admin(clinic_id));


-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) PARA patient_professionals
-- ==============================================================================

ALTER TABLE public.patient_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_professionals FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membros podem ver vinculos de profissionais" ON public.patient_professionals;
CREATE POLICY "Membros podem ver vinculos de profissionais"
    ON public.patient_professionals
    FOR SELECT
    TO authenticated
    USING (public.is_member_of_clinic(clinic_id));

DROP POLICY IF EXISTS "Membros podem criar vinculos de profissionais" ON public.patient_professionals;
CREATE POLICY "Membros podem criar vinculos de profissionais"
    ON public.patient_professionals
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_member_of_clinic(clinic_id));

DROP POLICY IF EXISTS "Membros podem atualizar vinculos de profissionais" ON public.patient_professionals;
CREATE POLICY "Membros podem atualizar vinculos de profissionais"
    ON public.patient_professionals
    FOR UPDATE
    TO authenticated
    USING (public.is_member_of_clinic(clinic_id))
    WITH CHECK (public.is_member_of_clinic(clinic_id));

DROP POLICY IF EXISTS "Membros podem remover vinculos de profissionais" ON public.patient_professionals;
CREATE POLICY "Membros podem remover vinculos de profissionais"
    ON public.patient_professionals
    FOR DELETE
    TO authenticated
    USING (public.is_member_of_clinic(clinic_id));
-- ==============================================================================
-- MIGRAÇÃO 0004: Prontuários Odontológicos, Anamnese e Trilha de Rastreabilidade
-- Sistema Odontológico ODONTO (Etapa 4)
-- ==============================================================================

-- 1. TABELA DE PRONTUÁRIOS (medical_records)
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    record_number TEXT NOT NULL, -- Ex: 'C-001', 'C-014'
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Regra de unicidade: dentro da mesma clínica, o cirurgião possui sequência legível
    CONSTRAINT unique_clinic_prof_record UNIQUE (clinic_id, professional_id, record_number),
    -- Cada paciente possui um prontuário primário na unidade clínica
    CONSTRAINT unique_clinic_patient_record UNIQUE (clinic_id, patient_id)
);

COMMENT ON TABLE public.medical_records IS 'Prontuário odontológico do paciente associado ao cirurgião-dentista de referência.';

-- 2. TABELA DE ANAMNESE E HISTÓRICO DE SAÚDE SISTÊMICA (anamneses)
CREATE TABLE IF NOT EXISTS public.anamneses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    -- Dados de Alergia e Risco Imediato
    has_critical_alert BOOLEAN NOT NULL DEFAULT false,
    critical_alert_notes TEXT,
    allergies TEXT[] NOT NULL DEFAULT '{}',
    continuous_medications TEXT[] NOT NULL DEFAULT '{}',
    systemic_diseases TEXT[] NOT NULL DEFAULT '{}',
    -- Condições Sistêmicas Específicas
    has_cardiac_condition BOOLEAN NOT NULL DEFAULT false,
    has_diabetes BOOLEAN NOT NULL DEFAULT false,
    has_hypertension BOOLEAN NOT NULL DEFAULT false,
    has_bleeding_disorder BOOLEAN NOT NULL DEFAULT false,
    is_pregnant_or_lactating BOOLEAN NOT NULL DEFAULT false,
    clinical_notes TEXT,
    -- Rastreamento de autoria
    updated_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_patient_anamnese UNIQUE (clinic_id, patient_id)
);

COMMENT ON TABLE public.anamneses IS 'Questionário de anamnese, contraindicações clínicas e alergias graves do paciente.';

-- 3. TABELA DE HISTÓRICO E ADENDOS DE ANAMNESE (Rastreabilidade Legal / Imutabilidade)
CREATE TABLE IF NOT EXISTS public.anamnesis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anamnesis_id UUID NOT NULL REFERENCES public.anamneses(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.profiles(id),
    change_reason TEXT,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.anamnesis_history IS 'Trilha imutável de adendos e revisões da anamnese para fins jurídicos e do CFO.';

-- Índices de busca
CREATE INDEX IF NOT EXISTS idx_medical_records_clinic ON public.medical_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_prof ON public.medical_records(professional_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_number ON public.medical_records(record_number);

CREATE INDEX IF NOT EXISTS idx_anamneses_clinic ON public.anamneses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_patient ON public.anamneses(patient_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_alert ON public.anamneses(has_critical_alert);

CREATE INDEX IF NOT EXISTS idx_anamnesis_hist_patient ON public.anamnesis_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_hist_created ON public.anamnesis_history(created_at DESC);

-- Triggers de atualização de updated_at
DROP TRIGGER IF EXISTS set_medical_records_updated_at ON public.medical_records;
CREATE TRIGGER set_medical_records_updated_at
    BEFORE UPDATE ON public.medical_records
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_anamneses_updated_at ON public.anamneses;
CREATE TRIGGER set_anamneses_updated_at
    BEFORE UPDATE ON public.anamneses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger que grava histórico de alterações clínicas automaticamente na anamnese
CREATE OR REPLACE FUNCTION public.log_anamnesis_audit_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.anamnesis_history (
        anamnesis_id,
        clinic_id,
        patient_id,
        changed_by,
        snapshot_data
    )
    VALUES (
        OLD.id,
        OLD.clinic_id,
        OLD.patient_id,
        NEW.updated_by,
        to_jsonb(OLD)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_anamnesis_updated ON public.anamneses;
CREATE TRIGGER on_anamnesis_updated
    AFTER UPDATE ON public.anamneses
    FOR EACH ROW EXECUTE FUNCTION public.log_anamnesis_audit_history();


-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) PARA PRONTUÁRIOS E ANAMNESE
-- ==============================================================================

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records FORCE ROW LEVEL SECURITY;

ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamneses FORCE ROW LEVEL SECURITY;

ALTER TABLE public.anamnesis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_history FORCE ROW LEVEL SECURITY;

-- POLÍTICAS: medical_records
-- Leitura: Membros autorizados da clínica
DROP POLICY IF EXISTS "Membros podem consultar prontuarios da clinica" ON public.medical_records;
CREATE POLICY "Membros podem consultar prontuarios da clinica"
    ON public.medical_records
    FOR SELECT
    TO authenticated
    USING (public.is_member_of_clinic(clinic_id));

-- Inserção: Dentistas, recepção ou admins da clínica
DROP POLICY IF EXISTS "Membros autorizados podem criar prontuarios" ON public.medical_records;
CREATE POLICY "Membros autorizados podem criar prontuarios"
    ON public.medical_records
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista', 'recepcao')
    );

-- Atualização: Apenas Dentistas ou Admins
DROP POLICY IF EXISTS "Apenas dentistas e admins podem alterar prontuarios" ON public.medical_records;
CREATE POLICY "Apenas dentistas e admins podem alterar prontuarios"
    ON public.medical_records
    FOR UPDATE
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    )
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    );

-- Exclusão: VEDADA (Prontuários não podem ser apagados do banco)
DROP POLICY IF EXISTS "Exclusao de prontuarios e vedada" ON public.medical_records;
CREATE POLICY "Exclusao de prontuarios e vedada"
    ON public.medical_records
    FOR DELETE
    TO authenticated
    USING (false);


-- POLÍTICAS: anamneses (Acesso Clínico Restrito)
-- Leitura: Apenas perfis clínicos (Dentistas, Assistentes e Administrador)
DROP POLICY IF EXISTS "Perfis clinicos podem ler anamnese" ON public.anamneses;
CREATE POLICY "Perfis clinicos podem ler anamnese"
    ON public.anamneses
    FOR SELECT
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista', 'assistente')
    );

-- Inserção: Dentistas e Administradores
DROP POLICY IF EXISTS "Dentistas podem criar anamnese" ON public.anamneses;
CREATE POLICY "Dentistas podem criar anamnese"
    ON public.anamneses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    );

-- Atualização: Dentistas e Administradores
DROP POLICY IF EXISTS "Dentistas podem atualizar anamnese" ON public.anamneses;
CREATE POLICY "Dentistas podem atualizar anamnese"
    ON public.anamneses
    FOR UPDATE
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    )
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    );

-- Exclusão: VEDADA
DROP POLICY IF EXISTS "Exclusao de anamnese e vedada" ON public.anamneses;
CREATE POLICY "Exclusao de anamnese e vedada"
    ON public.anamneses
    FOR DELETE
    TO authenticated
    USING (false);


-- POLÍTICAS: anamnesis_history (Trilha de Auditoria Imutável)
DROP POLICY IF EXISTS "Perfis clinicos podem ler historico de anamnese" ON public.anamnesis_history;
CREATE POLICY "Perfis clinicos podem ler historico de anamnese"
    ON public.anamnesis_history
    FOR SELECT
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    );

-- Inserção permitida internamente pelo trigger (Security Definer)
DROP POLICY IF EXISTS "Sistema pode registrar historico" ON public.anamnesis_history;
CREATE POLICY "Sistema pode registrar historico"
    ON public.anamnesis_history
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_member_of_clinic(clinic_id));

-- Atualização e Exclusão estritamente PROIBIDAS para preservar imutabilidade
DROP POLICY IF EXISTS "Historico de anamnese e imutavel" ON public.anamnesis_history;
CREATE POLICY "Historico de anamnese e imutavel"
    ON public.anamnesis_history
    FOR UPDATE
    TO authenticated
    USING (false);

DROP POLICY IF EXISTS "Historico de anamnese nao pode ser deletado" ON public.anamnesis_history;
CREATE POLICY "Historico de anamnese nao pode ser deletado"
    ON public.anamnesis_history
    FOR DELETE
    TO authenticated
    USING (false);
-- ==============================================================================
-- MIGRAÇÃO 0005: Armazenamento Privado de Exames e Imagens Clínicas (Supabase Storage)
-- Sistema Odontológico ODONTO (Etapa 5)
-- ==============================================================================

-- 1. TABELA DE METADADOS DE EXAMES DE IMAGEM (imaging_exams)
CREATE TABLE IF NOT EXISTS public.imaging_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    exam_type TEXT NOT NULL CHECK (
        exam_type IN ('panoramic', 'periapical', 'bite_wing', 'tomography', 'photo', 'report_pdf')
    ),
    exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
    storage_path TEXT NOT NULL, -- Caminho no bucket: clinic_id/patient_id/uuid.ext
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL CHECK (
        mime_type IN ('image/jpeg', 'image/png', 'image/jpg', 'application/pdf')
    ),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.imaging_exams IS 'Metadados de exames radiográficos, fotografias intraorais e laudos em PDF.';
COMMENT ON COLUMN public.imaging_exams.storage_path IS 'Caminho seguro e ofuscado por UUID dentro do bucket privado clinical-exams.';

-- Índices de busca
CREATE INDEX IF NOT EXISTS idx_imaging_exams_clinic ON public.imaging_exams(clinic_id);
CREATE INDEX IF NOT EXISTS idx_imaging_exams_patient ON public.imaging_exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_imaging_exams_type ON public.imaging_exams(exam_type);
CREATE INDEX IF NOT EXISTS idx_imaging_exams_date ON public.imaging_exams(exam_date DESC);

-- Trigger de updated_at
DROP TRIGGER IF EXISTS set_imaging_exams_updated_at ON public.imaging_exams;
CREATE TRIGGER set_imaging_exams_updated_at
    BEFORE UPDATE ON public.imaging_exams
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 2. CRIAÇÃO DO BUCKET PRIVADO NO SUPABASE STORAGE
-- ==============================================================================
-- public = false garante que nenhum link público seja acessível sem autorização

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'clinical-exams',
    'clinical-exams',
    false, -- BUCKET PRIVADO (LGPD)
    15728640, -- Limite de 15MB por arquivo
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 15728640,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];


-- ==============================================================================
-- 3. POLÍTICAS DE RLS PARA TABELA public.imaging_exams
-- ==============================================================================

ALTER TABLE public.imaging_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_exams FORCE ROW LEVEL SECURITY;

-- Leitura: Membros autorizados da clínica
DROP POLICY IF EXISTS "Membros podem consultar exames da clinica" ON public.imaging_exams;
CREATE POLICY "Membros podem consultar exames da clinica"
    ON public.imaging_exams
    FOR SELECT
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista', 'assistente')
    );

-- Inserção: Dentistas, Assistentes ou Administradores da clínica
DROP POLICY IF EXISTS "Profissionais autorizados podem cadastrar exames" ON public.imaging_exams;
CREATE POLICY "Profissionais autorizados podem cadastrar exames"
    ON public.imaging_exams
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista', 'assistente')
    );

-- Atualização: Dentistas e Administradores
DROP POLICY IF EXISTS "Dentistas podem atualizar metadados do exame" ON public.imaging_exams;
CREATE POLICY "Dentistas podem atualizar metadados do exame"
    ON public.imaging_exams
    FOR UPDATE
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    )
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    );

-- Exclusão: Apenas o criador do exame ou administrador da clínica
DROP POLICY IF EXISTS "Criador ou Admin pode excluir exame" ON public.imaging_exams;
CREATE POLICY "Criador ou Admin pode excluir exame"
    ON public.imaging_exams
    FOR DELETE
    TO authenticated
    USING (
        public.is_clinic_admin(clinic_id)
        OR (created_by = auth.uid() AND public.is_member_of_clinic(clinic_id))
    );


-- ==============================================================================
-- 4. POLÍTICAS DE SEGURANÇA NO SUPABASE STORAGE (storage.objects)
-- ==============================================================================
-- O caminho do objeto segue a convenção: clinical-exams/{clinic_id}/{patient_id}/{uuid}.{ext}

-- Leitura de arquivos: Somente membros da clínica referente ao primeiro segmento do caminho
DROP POLICY IF EXISTS "Membros podem ler exames do bucket privado" ON storage.objects;
CREATE POLICY "Membros podem ler exames do bucket privado"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'clinical-exams'
        AND public.is_member_of_clinic((storage.foldername(name))[1]::UUID)
    );

-- Upload de arquivos: Somente profissionais clínicos membros da respectiva clínica
DROP POLICY IF EXISTS "Profissionais podem fazer upload no bucket privado" ON storage.objects;
CREATE POLICY "Profissionais podem fazer upload no bucket privado"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'clinical-exams'
        AND public.is_member_of_clinic((storage.foldername(name))[1]::UUID)
        AND public.get_user_clinic_role((storage.foldername(name))[1]::UUID) IN ('admin_clinica', 'dentista', 'assistente')
    );

-- Exclusão de arquivos no storage
DROP POLICY IF EXISTS "Admins podem remover arquivos de exames" ON storage.objects;
CREATE POLICY "Admins podem remover arquivos de exames"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'clinical-exams'
        AND public.is_clinic_admin((storage.foldername(name))[1]::UUID)
    );
-- ==============================================================================
-- MIGRAÇÃO 0006: Evolução Clínica, Procedimentos e Odontograma Interativo
-- Sistema Odontológico ODONTO (Etapa 6)
-- ==============================================================================

-- 1. TABELA DE CATÁLOGO DE PROCEDIMENTOS (procedures)
CREATE TABLE IF NOT EXISTS public.procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- Ex: 'REST-01', 'ENDO-01', 'EXO-01'
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Ex: 'Dentística', 'Endodontia', 'Cirurgia', 'Prótese', 'Periodontia'
    default_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    estimated_minutes INT NOT NULL DEFAULT 30,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_clinic_proc_code UNIQUE (clinic_id, code)
);

COMMENT ON TABLE public.procedures IS 'Catálogo de procedimentos odontológicos padronizados da clínica com preços base.';

-- 2. TABELA DE CONSULTAS E EVOLUÇÃO CLÍNICA (clinical_encounters)
CREATE TABLE IF NOT EXISTS public.clinical_encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_id UUID, -- Opcional: vínculo com a agenda
    chief_complaint TEXT, -- Queixa principal
    notes TEXT NOT NULL, -- Anotação clínica e conduta realizada
    conduct TEXT,
    prescriptions TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clinical_encounters IS 'Histórico cronológico de atendimentos, anotações de evolução clínica e condutas.';

-- 3. TABELA DE ESTADO E VERSÕES DO ODONTOGRAMA (odontograms)
CREATE TABLE IF NOT EXISTS public.odontograms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES public.clinical_encounters(id) ON DELETE SET NULL,
    data JSONB NOT NULL DEFAULT '{}'::JSONB, -- Mapeamento dos 32 dentes, faces e condições
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.odontograms IS 'Registros de versões do odontograma interativo anatômico por paciente.';

-- 4. TABELAS DE PLANOS DE TRATAMENTO E ITENS DE PROCEDIMENTOS
CREATE TABLE IF NOT EXISTS public.treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'presented', 'approved', 'in_progress', 'completed', 'canceled')
    ),
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    final_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.treatment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
    procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE RESTRICT,
    tooth_code INT, -- FDI 11 a 48
    face_codes TEXT, -- Ex: 'O', 'M-O-D', 'V'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'in_progress', 'completed', 'canceled')
    ),
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de alto desempenho
CREATE INDEX IF NOT EXISTS idx_procedures_clinic ON public.procedures(clinic_id);
CREATE INDEX IF NOT EXISTS idx_procedures_active ON public.procedures(active);

CREATE INDEX IF NOT EXISTS idx_encounters_clinic ON public.clinical_encounters(clinic_id);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON public.clinical_encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_created ON public.clinical_encounters(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_odontograms_patient ON public.odontograms(patient_id);
CREATE INDEX IF NOT EXISTS idx_odontograms_created ON public.odontograms(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON public.treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_items_plan ON public.treatment_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_treatment_items_tooth ON public.treatment_items(tooth_code);

-- Triggers de updated_at
DROP TRIGGER IF EXISTS set_procedures_updated_at ON public.procedures;
CREATE TRIGGER set_procedures_updated_at
    BEFORE UPDATE ON public.procedures
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_clinical_encounters_updated_at ON public.clinical_encounters;
CREATE TRIGGER set_clinical_encounters_updated_at
    BEFORE UPDATE ON public.clinical_encounters
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_treatment_plans_updated_at ON public.treatment_plans;
CREATE TRIGGER set_treatment_plans_updated_at
    BEFORE UPDATE ON public.treatment_plans
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_treatment_items_updated_at ON public.treatment_items;
CREATE TRIGGER set_treatment_items_updated_at
    BEFORE UPDATE ON public.treatment_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures FORCE ROW LEVEL SECURITY;

ALTER TABLE public.clinical_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_encounters FORCE ROW LEVEL SECURITY;

ALTER TABLE public.odontograms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odontograms FORCE ROW LEVEL SECURITY;

ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans FORCE ROW LEVEL SECURITY;

ALTER TABLE public.treatment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_items FORCE ROW LEVEL SECURITY;

-- POLÍTICAS: procedures
DROP POLICY IF EXISTS "Membros podem ver catalogo de procedimentos" ON public.procedures;
CREATE POLICY "Membros podem ver catalogo de procedimentos"
    ON public.procedures
    FOR SELECT
    TO authenticated
    USING (public.is_member_of_clinic(clinic_id));

DROP POLICY IF EXISTS "Admins e Dentistas podem gerenciar procedimentos" ON public.procedures;
CREATE POLICY "Admins e Dentistas podem gerenciar procedimentos"
    ON public.procedures
    FOR ALL
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    );

-- POLÍTICAS: clinical_encounters (Evolução Clínica Imutável)
DROP POLICY IF EXISTS "Membros clinicos podem ler evolucoes" ON public.clinical_encounters;
CREATE POLICY "Membros clinicos podem ler evolucoes"
    ON public.clinical_encounters
    FOR SELECT
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista', 'assistente')
    );

DROP POLICY IF EXISTS "Dentistas podem registrar evolucoes" ON public.clinical_encounters;
CREATE POLICY "Dentistas podem registrar evolucoes"
    ON public.clinical_encounters
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    );

DROP POLICY IF EXISTS "Dentistas podem atualizar evolucoes" ON public.clinical_encounters;
CREATE POLICY "Dentistas podem atualizar evolucoes"
    ON public.clinical_encounters
    FOR UPDATE
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    );

-- Proibição expressa de exclusão de anotações médicas
DROP POLICY IF EXISTS "Exclusao de evolucoes clinicas e vedada" ON public.clinical_encounters;
CREATE POLICY "Exclusao de evolucoes clinicas e vedada"
    ON public.clinical_encounters
    FOR DELETE
    TO authenticated
    USING (false);

-- POLÍTICAS: odontograms
DROP POLICY IF EXISTS "Perfis clinicos podem ler odontogramas" ON public.odontograms;
CREATE POLICY "Perfis clinicos podem ler odontogramas"
    ON public.odontograms
    FOR SELECT
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista', 'assistente')
    );

DROP POLICY IF EXISTS "Dentistas podem salvar odontogramas" ON public.odontograms;
CREATE POLICY "Dentistas podem salvar odontogramas"
    ON public.odontograms
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    );

DROP POLICY IF EXISTS "Exclusao de odontogramas e vedada" ON public.odontograms;
CREATE POLICY "Exclusao de odontogramas e vedada"
    ON public.odontograms
    FOR DELETE
    TO authenticated
    USING (false);

-- POLÍTICAS: treatment_plans & treatment_items
DROP POLICY IF EXISTS "Membros podem ver planos de tratamento" ON public.treatment_plans;
CREATE POLICY "Membros podem ver planos de tratamento"
    ON public.treatment_plans
    FOR SELECT
    TO authenticated
    USING (public.is_member_of_clinic(clinic_id));

DROP POLICY IF EXISTS "Dentistas e admins podem gerenciar planos de tratamento" ON public.treatment_plans;
CREATE POLICY "Dentistas e admins podem gerenciar planos de tratamento"
    ON public.treatment_plans
    FOR ALL
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    );

DROP POLICY IF EXISTS "Membros podem ler itens do plano" ON public.treatment_items;
CREATE POLICY "Membros podem ler itens do plano"
    ON public.treatment_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.treatment_plans tp
            WHERE tp.id = treatment_items.plan_id
              AND public.is_member_of_clinic(tp.clinic_id)
        )
    );

DROP POLICY IF EXISTS "Dentistas podem gerenciar itens do plano" ON public.treatment_items;
CREATE POLICY "Dentistas podem gerenciar itens do plano"
    ON public.treatment_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.treatment_plans tp
            WHERE tp.id = treatment_items.plan_id
              AND public.is_member_of_clinic(tp.clinic_id)
              AND public.get_user_clinic_role(tp.clinic_id) IN ('admin_clinica', 'dentista')
        )
    );
-- ==============================================================================
-- MIGRAÇÃO 0007: Agenda Clínica, Agendamentos e Prevenção de Conflitos
-- Sistema Odontológico ODONTO (Etapa 7)
-- ==============================================================================

-- Habilita btree_gist para suporte a restrições de exclusão temporal
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. TABELA DE AGENDAMENTOS (appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show')
    ),
    procedure_title TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Validação cronológica
    CONSTRAINT check_appointment_dates CHECK (ends_at > starts_at)
);

COMMENT ON TABLE public.appointments IS 'Agendamentos de consultas odontológicas com controle de horários e status.';

-- 2. RESTRIÇÃO DE EXCLUSÃO PARA PREVENIR CONFLITOS DE HORÁRIOS CONCORRENTES
-- Garante que um mesmo cirurgião-dentista na mesma clínica não receba dois agendamentos simultâneos ativos
ALTER TABLE public.appointments
    DROP CONSTRAINT IF EXISTS no_overlapping_appointments;

ALTER TABLE public.appointments
    ADD CONSTRAINT no_overlapping_appointments
    EXCLUDE USING gist (
        clinic_id WITH =,
        professional_id WITH =,
        tstzrange(starts_at, ends_at) WITH &&
    )
    WHERE (status NOT IN ('canceled', 'no_show'));

-- Índices de busca e ordenação
CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_prof ON public.appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON public.appointments(starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Trigger de updated_at
DROP TRIGGER IF EXISTS set_appointments_updated_at ON public.appointments;
CREATE TRIGGER set_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. FUNÇÃO PARA DETECÇÃO PRÉVIA DE CONFLITOS
CREATE OR REPLACE FUNCTION public.check_appointment_conflict(
    p_clinic_id UUID,
    p_professional_id UUID,
    p_starts_at TIMESTAMPTZ,
    p_ends_at TIMESTAMPTZ,
    p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.appointments
        WHERE clinic_id = p_clinic_id
          AND professional_id = p_professional_id
          AND status NOT IN ('canceled', 'no_show')
          AND (p_exclude_id IS NULL OR id <> p_exclude_id)
          AND tstzrange(starts_at, ends_at) && tstzrange(p_starts_at, p_ends_at)
    );
$$;

COMMENT ON FUNCTION public.check_appointment_conflict IS 'Verifica se existe sobreposição de horário para o dentista informado.';


-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) PARA AGENDAMENTOS
-- ==============================================================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments FORCE ROW LEVEL SECURITY;

-- Leitura: Qualquer membro da clínica pode consultar a agenda
DROP POLICY IF EXISTS "Membros podem consultar agendamentos da clinica" ON public.appointments;
CREATE POLICY "Membros podem consultar agendamentos da clinica"
    ON public.appointments
    FOR SELECT
    TO authenticated
    USING (public.is_member_of_clinic(clinic_id));

-- Inserção: Membros da clínica (Recepção, Dentistas, Admins, etc.)
DROP POLICY IF EXISTS "Membros da clinica podem agendar consultas" ON public.appointments;
CREATE POLICY "Membros da clinica podem agendar consultas"
    ON public.appointments
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_member_of_clinic(clinic_id));

-- Atualização: Membros da clínica podem atualizar status, horário e notas
DROP POLICY IF EXISTS "Membros da clinica podem atualizar agendamentos" ON public.appointments;
CREATE POLICY "Membros da clinica podem atualizar agendamentos"
    ON public.appointments
    FOR UPDATE
    TO authenticated
    USING (public.is_member_of_clinic(clinic_id))
    WITH CHECK (public.is_member_of_clinic(clinic_id));

-- Exclusão: Apenas Administrador da clínica pode excluir fisicamente
DROP POLICY IF EXISTS "Apenas admins podem excluir agendamentos" ON public.appointments;
CREATE POLICY "Apenas admins podem excluir agendamentos"
    ON public.appointments
    FOR DELETE
    TO authenticated
    USING (public.is_clinic_admin(clinic_id));
-- ==============================================================================
-- MIGRAÇÃO 0008: Módulo Financeiro (Orçamentos, Receitas, Despesas) e Laboratórios
-- Sistema Odontológico ODONTO (Etapa 8)
-- ==============================================================================

-- 1. TABELA DE ORÇAMENTOS (budgets)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Orçamento Odontológico',
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    final_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'sent', 'approved', 'rejected', 'invoiced')
    ),
    payment_terms TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.budgets IS 'Orçamentos odontológicos propostos e aprovados para pacientes.';

-- 2. TABELA DE TRANSAÇÕES FINANCEIRAS (financial_transactions)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'paid', 'overdue', 'canceled')
    ),
    payment_method TEXT CHECK (
        payment_method IN ('cash', 'credit_card', 'debit_card', 'pix', 'bank_slip', 'transfer')
    ),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.financial_transactions IS 'Lançamentos financeiros de receitas clínicas, despesas operacionais e pagamentos.';

-- 3. TABELA DE CADASTRO DE LABORATÓRIOS PROTÉTICOS (laboratories)
CREATE TABLE IF NOT EXISTS public.laboratories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_clinic_lab_name UNIQUE (clinic_id, name)
);

COMMENT ON TABLE public.laboratories IS 'Laboratórios de prótese parceiros terceirizados.';

-- 4. TABELA DE TRABALHOS ENVIADOS AO LABORATÓRIO (laboratory_jobs)
CREATE TABLE IF NOT EXISTS public.laboratory_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    laboratory_id UUID NOT NULL REFERENCES public.laboratories(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prosthesis_type TEXT NOT NULL,
    tooth_numbers TEXT,
    color_shade TEXT,
    sent_at DATE NOT NULL DEFAULT CURRENT_DATE,
    due_at DATE NOT NULL,
    received_at DATE,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (
        status IN ('draft', 'sent', 'in_production', 'delayed', 'received', 'applied')
    ),
    cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.laboratory_jobs IS 'Trabalhos protéticos enviados, prazos de entrega e custos.';

-- Índices de busca
CREATE INDEX IF NOT EXISTS idx_budgets_clinic ON public.budgets(clinic_id);
CREATE INDEX IF NOT EXISTS idx_budgets_patient ON public.budgets(patient_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);

CREATE INDEX IF NOT EXISTS idx_fin_tx_clinic ON public.financial_transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_due_date ON public.financial_transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_fin_tx_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fin_tx_status ON public.financial_transactions(status);

CREATE INDEX IF NOT EXISTS idx_lab_jobs_clinic ON public.laboratory_jobs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_jobs_lab ON public.laboratory_jobs(laboratory_id);
CREATE INDEX IF NOT EXISTS idx_lab_jobs_patient ON public.laboratory_jobs(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_jobs_due_at ON public.laboratory_jobs(due_at);
CREATE INDEX IF NOT EXISTS idx_lab_jobs_status ON public.laboratory_jobs(status);

-- Triggers de updated_at
DROP TRIGGER IF EXISTS set_budgets_updated_at ON public.budgets;
CREATE TRIGGER set_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_fin_tx_updated_at ON public.financial_transactions;
CREATE TRIGGER set_fin_tx_updated_at
    BEFORE UPDATE ON public.financial_transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_labs_updated_at ON public.laboratories;
CREATE TRIGGER set_labs_updated_at
    BEFORE UPDATE ON public.laboratories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_lab_jobs_updated_at ON public.laboratory_jobs;
CREATE TRIGGER set_lab_jobs_updated_at
    BEFORE UPDATE ON public.laboratory_jobs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) COM CONTROLE ESTRITO POR PAPEL
-- ==============================================================================

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets FORCE ROW LEVEL SECURITY;

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratories FORCE ROW LEVEL SECURITY;

ALTER TABLE public.laboratory_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratory_jobs FORCE ROW LEVEL SECURITY;

-- POLÍTICAS: financial_transactions (Acesso Restrito a Administradores e Financeiro)
DROP POLICY IF EXISTS "Financeiro e Admins podem ler transacoes" ON public.financial_transactions;
CREATE POLICY "Financeiro e Admins podem ler transacoes"
    ON public.financial_transactions
    FOR SELECT
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro')
    );

DROP POLICY IF EXISTS "Financeiro e Admins podem cadastrar transacoes" ON public.financial_transactions;
CREATE POLICY "Financeiro e Admins podem cadastrar transacoes"
    ON public.financial_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro')
    );

DROP POLICY IF EXISTS "Financeiro e Admins podem atualizar transacoes" ON public.financial_transactions;
CREATE POLICY "Financeiro e Admins podem atualizar transacoes"
    ON public.financial_transactions
    FOR UPDATE
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro')
    )
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro')
    );

DROP POLICY IF EXISTS "Apenas admins podem excluir transacoes" ON public.financial_transactions;
CREATE POLICY "Apenas admins podem excluir transacoes"
    ON public.financial_transactions
    FOR DELETE
    TO authenticated
    USING (public.is_clinic_admin(clinic_id));

-- POLÍTICAS: budgets
DROP POLICY IF EXISTS "Membros autorizados podem ler orcamentos" ON public.budgets;
CREATE POLICY "Membros autorizados podem ler orcamentos"
    ON public.budgets
    FOR SELECT
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro', 'dentista', 'recepcao')
    );

DROP POLICY IF EXISTS "Dentistas e Financeiro podem criar orcamentos" ON public.budgets;
CREATE POLICY "Dentistas e Financeiro podem criar orcamentos"
    ON public.budgets
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro', 'dentista')
    );

DROP POLICY IF EXISTS "Dentistas e Financeiro podem atualizar orcamentos" ON public.budgets;
CREATE POLICY "Dentistas e Financeiro podem atualizar orcamentos"
    ON public.budgets
    FOR UPDATE
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro', 'dentista')
    )
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro', 'dentista')
    );

-- POLÍTICAS: laboratories & laboratory_jobs
DROP POLICY IF EXISTS "Membros clinicos podem ler laboratorios" ON public.laboratories;
CREATE POLICY "Membros clinicos podem ler laboratorios"
    ON public.laboratories
    FOR SELECT
    TO authenticated
    USING (public.is_member_of_clinic(clinic_id));

DROP POLICY IF EXISTS "Membros clinicos podem gerenciar laboratorios" ON public.laboratories;
CREATE POLICY "Membros clinicos podem gerenciar laboratorios"
    ON public.laboratories
    FOR ALL
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista', 'assistente')
    );

DROP POLICY IF EXISTS "Membros clinicos podem ler trabalhos de laboratorio" ON public.laboratory_jobs;
CREATE POLICY "Membros clinicos podem ler trabalhos de laboratorio"
    ON public.laboratory_jobs
    FOR SELECT
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista', 'assistente')
    );

DROP POLICY IF EXISTS "Membros clinicos podem gerenciar trabalhos de laboratorio" ON public.laboratory_jobs;
CREATE POLICY "Membros clinicos podem gerenciar trabalhos de laboratorio"
    ON public.laboratory_jobs
    FOR ALL
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista', 'assistente')
    );
-- ==============================================================================
-- MIGRAÇÃO 0009: Auditoria LGPD, Trilha Imutável e Relatórios Operacionais
-- Sistema Odontológico ODONTO (Etapa 9)
-- ==============================================================================

-- 1. TABELA DE AUDITORIA IMUTÁVEL (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL CHECK (
        action IN ('insert', 'update', 'delete', 'access', 'export', 'login')
    ),
    entity TEXT NOT NULL,
    entity_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_logs IS 'Trilha imutável de auditoria em conformidade com LGPD e normas do CFO. Exclusão e alteração desabilitadas.';

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_audit_clinic ON public.audit_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity, entity_id);

-- ==============================================================================
-- 2. ROW LEVEL SECURITY (RLS) - IMUTABILIDADE ABSOLUTA
-- ==============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

-- Leitura restrita a Administradores da Clínica e Dentistas responsáveis
DROP POLICY IF EXISTS "Admins e Dentistas podem consultar logs da clinica" ON public.audit_logs;
CREATE POLICY "Admins e Dentistas podem consultar logs da clinica"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista')
    );

-- Inserção permitida para membros autenticados registrarem eventos de sua clínica
DROP POLICY IF EXISTS "Membros autenticados podem gravar logs de auditoria" ON public.audit_logs;
CREATE POLICY "Membros autenticados podem gravar logs de auditoria"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_member_of_clinic(clinic_id));

-- ALTERAÇÃO E EXCLUSÃO SÃO ESTRITAMENTE VEDADAS (NON-REPUDIATION)
DROP POLICY IF EXISTS "Imutabilidade de auditoria - Proibido UPDATE" ON public.audit_logs;
CREATE POLICY "Imutabilidade de auditoria - Proibido UPDATE"
    ON public.audit_logs
    FOR UPDATE
    TO authenticated
    USING (false);

DROP POLICY IF EXISTS "Imutabilidade de auditoria - Proibido DELETE" ON public.audit_logs;
CREATE POLICY "Imutabilidade de auditoria - Proibido DELETE"
    ON public.audit_logs
    FOR DELETE
    TO authenticated
    USING (false);

-- ==============================================================================
-- 3. FUNÇÃO AUXILIAR DE REGISTRO AUTOMÁTICO DE AUDITORIA
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_clinic_id UUID,
    p_actor_id UUID,
    p_action TEXT,
    p_entity TEXT,
    p_entity_id TEXT,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        clinic_id,
        actor_id,
        action,
        entity,
        entity_id,
        details,
        ip_address
    ) VALUES (
        p_clinic_id,
        p_actor_id,
        p_action,
        p_entity,
        p_entity_id,
        p_details,
        p_ip_address
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;
