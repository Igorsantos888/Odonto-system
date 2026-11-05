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
