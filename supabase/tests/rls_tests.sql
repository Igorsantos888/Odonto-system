-- ==============================================================================
-- SCRIPT DE TESTE DE POLÍTICAS RLS (Row Level Security) E ISOLAMENTO
-- Sistema Odontológico ODONTO (Etapa 2)
-- ==============================================================================
-- Este script valida o isolamento estrito entre clínicas e o controle por papel (RBAC).
-- Pode ser executado em ambiente de teste/staging no SQL Editor do Supabase.

DO $$
DECLARE
    v_clinic_a_id UUID;
    v_clinic_b_id UUID;
    v_admin_a_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    v_dentist_a_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
    v_reception_a_id UUID := '33333333-3333-3333-3333-333333333333'::UUID;
    v_admin_b_id UUID := '44444444-4444-4444-4444-444444444444'::UUID;
    v_count INT;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'INICIANDO TESTES DE SEGURANÇA E POLÍTICAS RLS...';
    RAISE NOTICE '==================================================';

    -- 1. Cria clínicas de teste temporárias
    INSERT INTO public.clinics (name, cnpj, timezone)
    VALUES ('Clínica Alpha Matriz', '11.111.111/0001-11', 'America/Sao_Paulo')
    RETURNING id INTO v_clinic_a_id;

    INSERT INTO public.clinics (name, cnpj, timezone)
    VALUES ('Clínica Beta Concorrente', '22.222.222/0001-22', 'America/Sao_Paulo')
    RETURNING id INTO v_clinic_b_id;

    -- 2. Insere perfis de teste
    INSERT INTO public.profiles (id, full_name, email, active)
    VALUES 
        (v_admin_a_id, 'Admin Alpha', 'admin@alpha.com', true),
        (v_dentist_a_id, 'Dentista Alpha', 'dentista@alpha.com', true),
        (v_reception_a_id, 'Recepção Alpha', 'recepcao@alpha.com', true),
        (v_admin_b_id, 'Admin Beta', 'admin@beta.com', true)
    ON CONFLICT (id) DO NOTHING;

    -- 3. Vincula membros às respectivas clínicas
    INSERT INTO public.clinic_members (clinic_id, user_id, role, is_active)
    VALUES
        (v_clinic_a_id, v_admin_a_id, 'admin_clinica', true),
        (v_clinic_a_id, v_dentist_a_id, 'dentista', true),
        (v_clinic_a_id, v_reception_a_id, 'recepcao', true),
        (v_clinic_b_id, v_admin_b_id, 'admin_clinica', true)
    ON CONFLICT (clinic_id, user_id) DO NOTHING;

    -- =========================================================================
    -- TESTE 1: Função is_member_of_clinic()
    -- =========================================================================
    -- Simula autenticação do usuário Admin Alpha
    PERFORM set_config('request.jwt.claim.sub', v_admin_a_id::text, true);
    PERFORM set_config('role', 'authenticated', true);

    IF NOT public.is_member_of_clinic(v_clinic_a_id) THEN
        RAISE EXCEPTION 'TESTE 1 FALHOU: Admin Alpha deveria ser membro da Clínica Alpha';
    END IF;

    IF public.is_member_of_clinic(v_clinic_b_id) THEN
        RAISE EXCEPTION 'TESTE 1 FALHOU: Admin Alpha NÃO deve ser membro da Clínica Beta';
    END IF;
    RAISE NOTICE '✓ TESTE 1 PASSOU: is_member_of_clinic isola membros corretamente.';

    -- =========================================================================
    -- TESTE 2: Função is_clinic_admin() e papéis
    -- =========================================================================
    IF NOT public.is_clinic_admin(v_clinic_a_id) THEN
        RAISE EXCEPTION 'TESTE 2 FALHOU: Admin Alpha deveria ter papel admin_clinica';
    END IF;

    -- Simula autenticação da Recepção Alpha
    PERFORM set_config('request.jwt.claim.sub', v_reception_a_id::text, true);

    IF public.is_clinic_admin(v_clinic_a_id) THEN
        RAISE EXCEPTION 'TESTE 2 FALHOU: Recepção Alpha NÃO pode ser admin_clinica';
    END IF;
    RAISE NOTICE '✓ TESTE 2 PASSOU: is_clinic_admin valida papel admin_clinica estritamente.';

    -- =========================================================================
    -- TESTE 3: RLS em public.clinics — Isolamento entre clínicas
    -- =========================================================================
    -- Usuário Admin Alpha consultando tabela clinics
    PERFORM set_config('request.jwt.claim.sub', v_admin_a_id::text, true);

    SELECT COUNT(*) INTO v_count FROM public.clinics WHERE id = v_clinic_b_id;
    IF v_count > 0 THEN
        RAISE EXCEPTION 'TESTE 3 FALHOU: RLS permitiu ver clínica de outra organização!';
    END IF;

    SELECT COUNT(*) INTO v_count FROM public.clinics WHERE id = v_clinic_a_id;
    IF v_count <> 1 THEN
        RAISE EXCEPTION 'TESTE 3 FALHOU: Membro não conseguiu visualizar sua própria clínica!';
    END IF;
    RAISE NOTICE '✓ TESTE 3 PASSOU: RLS impede visibilidade de clínicas de outras organizações.';

    -- =========================================================================
    -- TESTE 4: RLS em public.clinic_members — Proteção de membros
    -- =========================================================================
    -- Usuário de Beta não pode ver membros de Alpha
    PERFORM set_config('request.jwt.claim.sub', v_admin_b_id::text, true);

    SELECT COUNT(*) INTO v_count FROM public.clinic_members WHERE clinic_id = v_clinic_a_id;
    IF v_count > 0 THEN
        RAISE EXCEPTION 'TESTE 4 FALHOU: Membro da Clínica Beta conseguiu listar membros da Clínica Alpha!';
    END IF;
    RAISE NOTICE '✓ TESTE 4 PASSOU: RLS protege a lista de membros por clínica.';

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'TODOS OS TESTES DE SEGURANÇA E RLS FORAM CONCLUÍDOS COM SUCESSO!';
    RAISE NOTICE '==================================================';

    -- Limpa registros de teste
    DELETE FROM public.clinic_members WHERE clinic_id IN (v_clinic_a_id, v_clinic_b_id);
    DELETE FROM public.clinics WHERE id IN (v_clinic_a_id, v_clinic_b_id);
    DELETE FROM public.profiles WHERE id IN (v_admin_a_id, v_dentist_a_id, v_reception_a_id, v_admin_b_id);
END;
$$;
