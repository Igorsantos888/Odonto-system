# ODONTO — Sistema Profissional de Gestão Odontológica

Sistema completo e profissional para gestão de clínicas odontológicas construído com **React 19, TypeScript, Vite 6, Tailwind CSS v4, Supabase (PostgreSQL 15, Auth, Storage) e Vercel**, sem a necessidade de um backend tradicional separado para operações comuns.

---

## 1. Visão Geral da Arquitetura

O sistema adota uma arquitetura *BaaS (Backend as a Service)* orientada à nuvem:

```
[ Usuário / Navegador ]
         │
         ▼
[ React + TypeScript + Vite (Vercel) ]
         │
         ├─── Supabase Auth (Login, Sessões e RBAC com 5 papéis de acesso)
         │
         ├─── Supabase Database (PostgreSQL + Row Level Security - RLS estrito)
         │
         └─── Supabase Storage (Bucket Privado `clinical-exams` com URLs assinadas temporárias)
```

- **Isolamento de Dados (Multiclínica):** Todas as tabelas contêm `clinic_id`, protegidas por políticas RLS baseadas no usuário autenticado e na tabela `clinic_members`.
- **Privacidade de Arquivos (LGPD):** Nenhum arquivo clínico possui URL pública permanente; o acesso é liberado via URLs temporárias assinadas com validação de permissões no banco.
- **Não Repúdio & CFO:** Prontuários clínicos (`clinical_encounters`, `anamneses`, `audit_logs`) possuem exclusão estritamente desabilitada via banco de dados (`DELETE USING false`).

---

## 2. Estrutura de Pastas

```
odonto/
├── public/                     # Favicons e manifestos estáticos
├── src/
│   ├── assets/                 # Ícones e logotipos
│   ├── components/
│   │   ├── ui/                 # Botões, Badges, Modais, Tabelas, Inputs, Alertas
│   │   ├── layout/             # Sidebar, Header
│   │   └── shared/             # ProtectedRoute, RoleGate, ToothGraphic (FDI)
│   ├── layouts/
│   │   ├── AppLayout.tsx       # Layout com sidebar, header e banner de ambiente
│   │   └── AuthLayout.tsx      # Layout de autenticação isolado
│   ├── pages/                  # Páginas do sistema
│   │   ├── Dashboard/          # Visão geral e KPIs clínicos com Recharts
│   │   ├── Agenda/             # Grade de horários e agendamentos com validação de conflitos
│   │   ├── Pacientes/          # Cadastro, listagem e pesquisa com validação Zod
│   │   ├── Prontuarios/        # Histórico clínico e adendos imutáveis
│   │   ├── Anamnese/           # Questionário de saúde e alertas de alergias críticas
│   │   ├── Odontograma/        # Arcada dentária interativa (notação FDI 11-48 e faces dentárias)
│   │   ├── Exames/             # Galeria de radiografias e laudos em storage privado
│   │   ├── Tratamentos/        # Planos de tratamento e procedimentos por dente
│   │   ├── Financeiro/         # Orçamentos, despesas e fluxo de caixa
│   │   ├── Laboratorios/       # Controle de peças protéticas terceirizadas e prazos
│   │   ├── Tarefas/            # Lembretes operacionais da equipe
│   │   ├── Relatorios/         # Indicadores e trilha de auditoria LGPD (audit_logs)
│   │   ├── Configuracoes/      # Dados da clínica e papéis de acesso
│   │   └── Login/              # Acesso com Supabase Auth e simulação de papéis
│   ├── contexts/
│   │   └── AuthContext.tsx     # Gerenciamento de sessão, tenant ativo e RBAC
│   ├── services/
│   │   ├── supabase.ts         # Cliente oficial do Supabase com fallback gracioso
│   │   ├── patientService.ts   # CRUD de pacientes e dentistas
│   │   ├── clinicalRecordService.ts # Prontuários e anamneses
│   │   ├── examService.ts      # Upload seguro e geração de URLs assinadas
│   │   ├── odontogramService.ts # Odontograma e condições anatômicas
│   │   ├── appointmentService.ts # Agenda e detecção de sobreposição de horários
│   │   ├── financialService.ts # Transações financeiras, orçamentos e fluxo
│   │   ├── laboratoryService.ts # Ordens de serviço para prótese e alertas de prazos
│   │   └── auditService.ts     # Trilha de auditoria LGPD e exportação CSV
│   ├── types/                  # Tipagem TypeScript estrita de todo o domínio
│   ├── schemas/                # Schemas de validação Zod
│   ├── utils/                  # Formatadores de moeda, datas, máscaras CPF/telefone
│   ├── App.tsx                 # Roteador central (React Router com code-splitting)
│   ├── main.tsx                # Entrada React
│   └── index.css               # Tailwind CSS v4
├── supabase/
│   ├── migrations/             # 9 Migrações SQL versionadas
│   │   ├── 20261029000001_initial_schema.sql
│   │   ├── 20261029000002_rls_policies.sql
│   │   ├── 20261029000003_patients_schema.sql
│   │   ├── 20261029000004_medical_records_and_anamnesis.sql
│   │   ├── 20261029000005_storage_and_exams.sql
│   │   ├── 20261029000006_clinical_evolution_and_odontogram.sql
│   │   ├── 20261029000007_appointments_and_schedule.sql
│   │   ├── 20261029000008_financial_and_laboratories.sql
│   │   └── 20261029000009_audit_and_reporting.sql
│   ├── tests/
│   │   └── rls_tests.sql       # Testes automatizados de isolamento de clínicas e papéis
│   └── seed.sql                # Dados fictícios com pacientes, consultas e orçamentos
├── vercel.json                 # Configuração de rewrites SPA e cabeçalhos de segurança HTTP
├── .env.example                # Template de variáveis de ambiente
├── package.json
└── tsconfig.json
```

---

## 3. Padrão de Alertas Visuais (Acessibilidade)

Conforme a especificação, as cores dos alertas são acompanhadas obrigatoriamente de **texto descritivo e ícones específicos**:

- 🔴 **Vermelho (`critical`):** Informação clínica importante, alergia severa ou alerta que exige atenção imediata (ex: Alergia a Penicilina, uso de anticoagulante, prazo vencido). Acompanhado de `AlertOctagon`.
- 🟡 **Amarelo (`warning`):** Pendência, prazo próximo ou trabalho aguardando retorno do laboratório de prótese (dentro de 48h). Acompanhado de `Clock`.
- 🟢 **Verde (`success`):** Consulta concluída, pagamento confirmado ou procedimento finalizado. Acompanhado de `CheckCircle2`.
- 🔵 **Azul/Neutro (`info` / `neutral`):** Agendamento confirmado, status informativo.

---

## 4. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-anon
```

> **Atenção:** Nunca insira senhas de banco de dados ou a chave privilegiada `service_role` no código frontend.

---

## 5. Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor local de desenvolvimento
npm run dev

# Gerar build de produção otimizado
npm run build
```

---

## 6. Publicação na Vercel

O projeto está configurado com `vercel.json` contendo:
- Roteamento SPA (*Single-Page Application*) via rewrite para `/index.html`.
- Cabeçalhos de segurança HTTP modernos:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Para publicar:
1. Conecte o repositório Git na [Vercel](https://vercel.com).
2. Configure as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no painel da Vercel.
3. O comando de compilação automático é `npm run build` com diretório de saída `dist`.

---

## 7. Status do Desenvolvimento por Etapas (100% Concluído)

- [x] **Etapa 1 — Estrutura inicial:** Projeto criado, Tailwind CSS, rotas, componentes visuais e dashboard com dados identificados.
- [x] **Etapa 2 — Banco de dados e segurança:** Migrações SQL versionadas, Supabase Auth, RBAC e políticas RLS testadas com isolamento entre clínicas.
- [x] **Etapa 3 — Pacientes:** Cadastro com validação Zod, máscaras de CPF e telefone, vinculação de dentistas e persistência real.
- [x] **Etapa 4 — Prontuários e anamnese:** Histórico clínico rastreável, alergias em alerta vermelho e imutabilidade de adendos clínicos (CFO).
- [x] **Etapa 5 — Exames e arquivos:** Upload para bucket privado do Supabase Storage com geração de URLs assinadas temporárias (15 min).
- [x] **Etapa 6 — Evolução clínica e odontograma:** Odontograma vetorial interativo (FDI 11-48), faces dentárias (MODVP) e procedimentos associados.
- [x] **Etapa 7 — Agenda:** Calendário por profissional, status de comparecimento e validação de conflitos de horários via PostgreSQL `btree_gist`.
- [x] **Etapa 8 — Financeiro e laboratórios:** Orçamentos odontológicos, despesas operacionais, fluxo de caixa e gestão de trabalhos protéticos com controle de prazos.
- [x] **Etapa 9 — Relatórios e produção:** Trilha de auditoria imutável (LGPD), métricas de produtividade, exportação CSV e configuração para deploy na Vercel.
