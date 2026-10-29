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
