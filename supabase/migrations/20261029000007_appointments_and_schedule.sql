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
