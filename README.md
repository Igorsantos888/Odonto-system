# ODONTO — Sistema Profissional de Gestão Odontológica

Sistema completo para gestão de clínicas odontológicas construído com **React, TypeScript, Vite, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage) e Vercel**, sem a necessidade de um backend tradicional separado para operações comuns.

---

## 1. Visão Geral da Arquitetura

O sistema adota uma arquitetura *BaaS (Backend as a Service)* orientada à nuvem:

```
[ Usuário / Navegador ]
         │
         ▼
[ React + TypeScript + Vite (Vercel) ]
         │
         ├─── Supabase Auth (Login, Sessões e RBAC)
         │
         ├─── Supabase Database (PostgreSQL + Row Level Security - RLS)
         │
         └─── Supabase Storage (Buckets Privados com URLs assinadas para exames e radiografias)
```

- **Isolamento de Dados (Multiclínica):** Todas as tabelas contêm `clinic_id`, protegidas por políticas RLS baseadas no usuário autenticado e na tabela `clinic_members`.
- **Privacidade de Arquivos (LGPD):** Nenhum arquivo clínico possui URL pública permanente; o acesso é liberado via URLs temporárias assinadas com validação de permissões no banco.

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
│   │   └── shared/             # Componentes reutilizados entre domínios
│   ├── layouts/
│   │   ├── AppLayout.tsx       # Layout com sidebar, header e banner de ambiente
│   │   └── AuthLayout.tsx      # Layout de autenticação isolado
│   ├── pages/                  # Páginas do sistema
│   │   ├── Dashboard/          # Visão geral e KPIs clínicos com Recharts
│   │   ├── Agenda/             # Grade de horários e agendamentos
│   │   ├── Pacientes/          # Cadastro e listagem de pacientes
│   │   ├── Prontuarios/        # Histórico clínico e adendos rastreáveis
│   │   ├── Anamnese/           # Questionário de saúde e alertas de alergias
│   │   ├── Odontograma/        # Arcada dentária interativa (FDI)
│   │   ├── Exames/             # Galeria de radiografias e laudos em storage privado
│   │   ├── Tratamentos/        # Planos de tratamento e itens clínicos
│   │   ├── Financeiro/         # Orçamentos, despesas e fluxo de caixa
│   │   ├── Laboratorios/       # Controle de peças protéticas terceirizadas
│   │   ├── Tarefas/            # Lembretes operacionais da equipe
│   │   ├── Relatorios/         # Indicadores e trilha de auditoria (audit_logs)
│   │   ├── Configuracoes/      # Dados da clínica e papéis de acesso
│   │   └── Login/              # Acesso com Supabase Auth
│   ├── features/               # Lógica por domínio
│   ├── services/
│   │   └── supabase.ts         # Cliente oficial do Supabase
│   ├── hooks/                  # Custom hooks React
│   ├── types/                  # Tipagem TypeScript estrita de todo o domínio
│   ├── schemas/                # Schemas de validação Zod
│   ├── utils/                  # Formatadores de moeda, datas, máscaras CPF/telefone
│   ├── App.tsx                 # Roteador central (React Router)
│   ├── main.tsx                # Entrada React
│   └── index.css               # Tailwind CSS v4
├── supabase/
│   ├── migrations/             # Migrações SQL versionadas
│   └── seed.sql                # Dados fictícios de teste
├── .env.example                # Template de variáveis de ambiente
├── package.json
└── tsconfig.json
```

---

## 3. Padrão de Alertas Visuais (Acessibilidade)

Conforme a especificação, as cores dos alertas são acompanhadas obrigatoriamente de **texto descritivo e ícones específicos**:

- 🔴 **Vermelho (`critical`):** Informação clínica importante, alergia severa ou alerta que exige atenção imediata (ex: Alergia a Penicilina, uso de anticoagulante). Acompanhado de `AlertOctagon`.
- 🟡 **Amarelo (`warning`):** Pendência, prazo próximo ou trabalho aguardando retorno do laboratório de prótese. Acompanhado de `Clock`.
- 🟢 **Verde (`success`):** Consulta concluída, pagamento confirmado ou procedimento finalizado. Acompanhado de `CheckCircle2`.
- 🔵 **Azul/Neutro (`info` / `neutral`):** Agendamento confirmado, status informativo.

---

## 4. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-anon
```

> **Atenção:** Nunca insira senhas de banco de dados ou a chave `service_role` no código frontend.

---

## 5. Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor local de desenvolvimento
npm run dev

# Gerar build de produção
npm run build
```

---

## 6. Status do Desenvolvimento por Etapas

- [x] **Etapa 1 — Estrutura inicial:** Projeto criado, Tailwind CSS, rotas, componentes visuais e dashboard com dados fictícios.
- [ ] **Etapa 2 — Banco de dados e segurança:** Migrações SQL, Supabase Auth, RBAC e políticas RLS.
- [ ] **Etapa 3 — Pacientes:** Cadastro com validação Zod e persistência real no Supabase.
- [ ] **Etapa 4 — Prontuários e anamnese:** Histórico clínico rastreável e alertas médicos.
- [ ] **Etapa 5 — Exames e arquivos:** Upload para storage privado e URLs assinadas.
- [ ] **Etapa 6 — Evolução clínica e odontograma:** Arcada anatômica por faces dentárias.
- [ ] **Etapa 7 — Agenda:** Calendário com prevenção de conflitos de horários.
- [ ] **Etapa 8 — Financeiro e laboratórios:** Orçamentos, despesas e pedidos protéticos.
- [ ] **Etapa 9 — Relatórios e produção:** Auditoria LGPD e deploy na Vercel.
