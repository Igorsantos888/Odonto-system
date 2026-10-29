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
