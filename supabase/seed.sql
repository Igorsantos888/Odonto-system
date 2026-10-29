-- ==============================================================================
-- DADOS FICTÍCIOS DE DESENVOLVIMENTO (seed.sql)
-- Sistema Odontológico ODONTO (Etapa 2)
-- AVISO: Apenas para ambiente de desenvolvimento local / teste.
-- ==============================================================================

-- 1. Inserção de Clínicas de Demonstração
INSERT INTO public.clinics (id, name, cnpj, phone, email, address, timezone, record_numbering_mode)
VALUES 
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'OdontoPrime Matriz',
        '12.345.678/0001-90',
        '(11) 3321-4500',
        'contato@odontoprime.com.br',
        'Av. Paulista, 1500, Sala 1204 - Bela Vista, São Paulo - SP',
        'America/Sao_Paulo',
        'per_professional'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22'::UUID,
        'Clínica OdontoSul Filial',
        '98.765.432/0001-10',
        '(11) 4567-8900',
        'sul@odontoprime.com.br',
        'Rua Domingos de Morais, 800 - Vila Mariana, São Paulo - SP',
        'America/Sao_Paulo',
        'per_clinic'
    )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;

-- 2. Perfis de Demonstração (Simulando usuários do Supabase Auth)
INSERT INTO public.profiles (id, full_name, cro, specialty, phone, email, active)
VALUES
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::UUID,
        'Dr. Mateus Silva',
        'CRO-SP 104.821',
        'Cirurgia & Implantodontia',
        '(11) 98765-4321',
        'mateus.silva@odontoprime.com',
        true
    ),
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02'::UUID,
        'Dra. Beatriz Santos',
        'CRO-SP 119.452',
        'Endodontia & Dentística',
        '(11) 97654-3210',
        'beatriz.santos@odontoprime.com',
        true
    ),
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03'::UUID,
        'Camila Ferreira',
        NULL,
        'Recepção e Atendimento',
        '(11) 96543-2109',
        'camila.recepcao@odontoprime.com',
        true
    ),
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04'::UUID,
        'Rodrigo Mendes',
        NULL,
        'Gestão Financeira',
        '(11) 95432-1098',
        'rodrigo.financeiro@odontoprime.com',
        true
    ),
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05'::UUID,
        'Letícia Souza',
        'ASO-SP 45.120',
        'Assistente em Saúde Bucal',
        '(11) 94321-0987',
        'leticia.auxiliar@odontoprime.com',
        true
    )
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name;

-- 3. Vínculo dos Membros com a Clínica Matriz
INSERT INTO public.clinic_members (clinic_id, user_id, role, is_active)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::UUID, 'admin_clinica', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02'::UUID, 'dentista', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03'::UUID, 'recepcao', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04'::UUID, 'financeiro', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05'::UUID, 'assistente', true)
ON CONFLICT (clinic_id, user_id) DO UPDATE
SET role = EXCLUDED.role;
