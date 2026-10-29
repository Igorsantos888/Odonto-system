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
