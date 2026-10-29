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
