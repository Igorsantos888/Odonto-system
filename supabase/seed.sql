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

-- 4. Pacientes de Demonstração (Etapa 3)
INSERT INTO public.patients (id, clinic_id, full_name, cpf, birth_date, gender, phone, email, address, notes)
VALUES
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01'::UUID,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'Mariana Ribeiro Alves',
        '12345678901',
        '1992-05-14',
        'F',
        '11987654321',
        'mariana.ribeiro@email.com',
        'Rua Augusta, 1200, Apto 42 - Consolação, São Paulo - SP',
        'ALERGIAS GRAVES: Penicilina e Dipirona. Histórico de broncoespasmo.'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02'::UUID,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'Carlos Eduardo Costa',
        '98765432100',
        '1985-11-20',
        'M',
        '11976543210',
        'carlos.costa@email.com',
        'Alameda Santos, 450 - Jardins, São Paulo - SP',
        'Paciente em fase de reabilitação protética superior (dentes 16 e 26).'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03'::UUID,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'João Paulo de Albuquerque',
        '45678912345',
        '1978-03-08',
        'M',
        '11965432109',
        'joao.albuquerque@email.com',
        'Rua Pamplona, 900 - Bela Vista, São Paulo - SP',
        'Cardiopata (stent coronário em 2022). Em uso contínuo de anticoagulante oral.'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04'::UUID,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'Luciana Martins Ferreira',
        '32165498711',
        '1996-08-25',
        'F',
        '11954321098',
        'luciana.martins@email.com',
        'Rua Vergueiro, 2200 - Paraíso, São Paulo - SP',
        'Manutenção preventiva periódica e clareamento dental.'
    )
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name;

-- 5. Vínculo Paciente - Cirurgião-Dentista
INSERT INTO public.patient_professionals (patient_id, professional_id, clinic_id)
VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01'::UUID, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::UUID, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02'::UUID, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::UUID, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03'::UUID, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::UUID, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04'::UUID, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02'::UUID, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID)
ON CONFLICT (patient_id, professional_id, clinic_id) DO NOTHING;

-- 6. Prontuários Médicos Odontológicos (medical_records)
INSERT INTO public.medical_records (id, clinic_id, patient_id, professional_id, record_number, status)
VALUES
    (
        'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01'::UUID,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01'::UUID,
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::UUID,
        'C-014',
        'active'
    ),
    (
        'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02'::UUID,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02'::UUID,
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::UUID,
        'C-001',
        'active'
    ),
    (
        'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e03'::UUID,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03'::UUID,
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::UUID,
        'C-033',
        'active'
    ),
    (
        'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e04'::UUID,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04'::UUID,
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02'::UUID,
        'C-082',
        'active'
    )
ON CONFLICT (clinic_id, patient_id) DO NOTHING;

-- 7. Fichas de Anamnese com Alertas de Alergias
INSERT INTO public.anamneses (
    id, clinic_id, patient_id, has_critical_alert, critical_alert_notes,
    allergies, continuous_medications, systemic_diseases,
    has_cardiac_condition, has_diabetes, has_hypertension, has_bleeding_disorder, is_pregnant_or_lactating,
    clinical_notes, updated_by
)
VALUES
    (
        'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01'::UUID,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01'::UUID,
        true,
        'ALERGIA SEVERA: Penicilina e Dipirona (choque anafilático e edema de glote relatados). Proibida Amoxicilina.',
        ARRAY['Penicilina e derivados', 'Dipirona Sódica'],
        ARRAY['Anticoncepcional oral combinado'],
        ARRAY['Enxaqueca crônica'],
        false, false, false, false, false,
        'Paciente orientada quanto a alternativas terapêuticas analgésicas e antibióticas (ex: Clindamicina / Azitromicina).',
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::UUID
    ),
    (
        'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02'::UUID,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03'::UUID,
        true,
        'CARDIOPATA: Uso contínuo de Varfarina/Marevan (anticoagulante oral). Monitorar RNI antes de exodontias.',
        ARRAY[]::TEXT[],
        ARRAY['Varfarina 5mg', 'Atenolol 25mg'],
        ARRAY['Cardiopatia Isquêmica', 'Hipertensão Arterial Sistêmica'],
        true, false, true, true, false,
        'Solicitar coagulograma e liberação cardiológica antes de intervenções cirúrgicas invasivas.',
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::UUID
    )
ON CONFLICT (clinic_id, patient_id) DO NOTHING;
