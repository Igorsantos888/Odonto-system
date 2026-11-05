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
