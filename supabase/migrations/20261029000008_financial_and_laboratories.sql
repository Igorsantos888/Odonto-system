-- ==============================================================================
-- MIGRAÇÃO 0008: Módulo Financeiro (Orçamentos, Receitas, Despesas) e Laboratórios
-- Sistema Odontológico ODONTO (Etapa 8)
-- ==============================================================================

-- 1. TABELA DE ORÇAMENTOS (budgets)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Orçamento Odontológico',
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    final_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'sent', 'approved', 'rejected', 'invoiced')
    ),
    payment_terms TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.budgets IS 'Orçamentos odontológicos propostos e aprovados para pacientes.';

-- 2. TABELA DE TRANSAÇÕES FINANCEIRAS (financial_transactions)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'paid', 'overdue', 'canceled')
    ),
    payment_method TEXT CHECK (
        payment_method IN ('cash', 'credit_card', 'debit_card', 'pix', 'bank_slip', 'transfer')
    ),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.financial_transactions IS 'Lançamentos financeiros de receitas clínicas, despesas operacionais e pagamentos.';

-- 3. TABELA DE CADASTRO DE LABORATÓRIOS PROTÉTICOS (laboratories)
CREATE TABLE IF NOT EXISTS public.laboratories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_clinic_lab_name UNIQUE (clinic_id, name)
);

COMMENT ON TABLE public.laboratories IS 'Laboratórios de prótese parceiros terceirizados.';

-- 4. TABELA DE TRABALHOS ENVIADOS AO LABORATÓRIO (laboratory_jobs)
CREATE TABLE IF NOT EXISTS public.laboratory_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    laboratory_id UUID NOT NULL REFERENCES public.laboratories(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prosthesis_type TEXT NOT NULL,
    tooth_numbers TEXT,
    color_shade TEXT,
    sent_at DATE NOT NULL DEFAULT CURRENT_DATE,
    due_at DATE NOT NULL,
    received_at DATE,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (
        status IN ('draft', 'sent', 'in_production', 'delayed', 'received', 'applied')
    ),
    cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.laboratory_jobs IS 'Trabalhos protéticos enviados, prazos de entrega e custos.';

-- Índices de busca
CREATE INDEX IF NOT EXISTS idx_budgets_clinic ON public.budgets(clinic_id);
CREATE INDEX IF NOT EXISTS idx_budgets_patient ON public.budgets(patient_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);

CREATE INDEX IF NOT EXISTS idx_fin_tx_clinic ON public.financial_transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_due_date ON public.financial_transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_fin_tx_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fin_tx_status ON public.financial_transactions(status);

CREATE INDEX IF NOT EXISTS idx_lab_jobs_clinic ON public.laboratory_jobs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_jobs_lab ON public.laboratory_jobs(laboratory_id);
CREATE INDEX IF NOT EXISTS idx_lab_jobs_patient ON public.laboratory_jobs(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_jobs_due_at ON public.laboratory_jobs(due_at);
CREATE INDEX IF NOT EXISTS idx_lab_jobs_status ON public.laboratory_jobs(status);

-- Triggers de updated_at
DROP TRIGGER IF EXISTS set_budgets_updated_at ON public.budgets;
CREATE TRIGGER set_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_fin_tx_updated_at ON public.financial_transactions;
CREATE TRIGGER set_fin_tx_updated_at
    BEFORE UPDATE ON public.financial_transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_labs_updated_at ON public.laboratories;
CREATE TRIGGER set_labs_updated_at
    BEFORE UPDATE ON public.laboratories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_lab_jobs_updated_at ON public.laboratory_jobs;
CREATE TRIGGER set_lab_jobs_updated_at
    BEFORE UPDATE ON public.laboratory_jobs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) COM CONTROLE ESTRITO POR PAPEL
-- ==============================================================================

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets FORCE ROW LEVEL SECURITY;

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratories FORCE ROW LEVEL SECURITY;

ALTER TABLE public.laboratory_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratory_jobs FORCE ROW LEVEL SECURITY;

-- POLÍTICAS: financial_transactions (Acesso Restrito a Administradores e Financeiro)
DROP POLICY IF EXISTS "Financeiro e Admins podem ler transacoes" ON public.financial_transactions;
CREATE POLICY "Financeiro e Admins podem ler transacoes"
    ON public.financial_transactions
    FOR SELECT
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro')
    );

DROP POLICY IF EXISTS "Financeiro e Admins podem cadastrar transacoes" ON public.financial_transactions;
CREATE POLICY "Financeiro e Admins podem cadastrar transacoes"
    ON public.financial_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro')
    );

DROP POLICY IF EXISTS "Financeiro e Admins podem atualizar transacoes" ON public.financial_transactions;
CREATE POLICY "Financeiro e Admins podem atualizar transacoes"
    ON public.financial_transactions
    FOR UPDATE
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro')
    )
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro')
    );

DROP POLICY IF EXISTS "Apenas admins podem excluir transacoes" ON public.financial_transactions;
CREATE POLICY "Apenas admins podem excluir transacoes"
    ON public.financial_transactions
    FOR DELETE
    TO authenticated
    USING (public.is_clinic_admin(clinic_id));

-- POLÍTICAS: budgets
DROP POLICY IF EXISTS "Membros autorizados podem ler orcamentos" ON public.budgets;
CREATE POLICY "Membros autorizados podem ler orcamentos"
    ON public.budgets
    FOR SELECT
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro', 'dentista', 'recepcao')
    );

DROP POLICY IF EXISTS "Dentistas e Financeiro podem criar orcamentos" ON public.budgets;
CREATE POLICY "Dentistas e Financeiro podem criar orcamentos"
    ON public.budgets
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro', 'dentista')
    );

DROP POLICY IF EXISTS "Dentistas e Financeiro podem atualizar orcamentos" ON public.budgets;
CREATE POLICY "Dentistas e Financeiro podem atualizar orcamentos"
    ON public.budgets
    FOR UPDATE
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro', 'dentista')
    )
    WITH CHECK (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'financeiro', 'dentista')
    );

-- POLÍTICAS: laboratories & laboratory_jobs
DROP POLICY IF EXISTS "Membros clinicos podem ler laboratorios" ON public.laboratories;
CREATE POLICY "Membros clinicos podem ler laboratorios"
    ON public.laboratories
    FOR SELECT
    TO authenticated
    USING (public.is_member_of_clinic(clinic_id));

DROP POLICY IF EXISTS "Membros clinicos podem gerenciar laboratorios" ON public.laboratories;
CREATE POLICY "Membros clinicos podem gerenciar laboratorios"
    ON public.laboratories
    FOR ALL
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista', 'assistente')
    );

DROP POLICY IF EXISTS "Membros clinicos podem ler trabalhos de laboratorio" ON public.laboratory_jobs;
CREATE POLICY "Membros clinicos podem ler trabalhos de laboratorio"
    ON public.laboratory_jobs
    FOR SELECT
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista', 'assistente')
    );

DROP POLICY IF EXISTS "Membros clinicos podem gerenciar trabalhos de laboratorio" ON public.laboratory_jobs;
CREATE POLICY "Membros clinicos podem gerenciar trabalhos de laboratorio"
    ON public.laboratory_jobs
    FOR ALL
    TO authenticated
    USING (
        public.is_member_of_clinic(clinic_id)
        AND public.get_user_clinic_role(clinic_id) IN ('admin_clinica', 'dentista', 'assistente')
    );
