# LeadFlow - SDR CRM com Gerador de Mensagens IA

Mini CRM para times de SDR com funil Kanban, campanhas, geração de mensagens com IA e regras de qualidade de dados por etapa.

## Links da entrega

- **Aplicação publicada:** `ADICIONAR_LINK_DEPLOY`
- **Vídeo (até 10 min):** `ADICIONAR_LINK_VIDEO`
- **Repositório:** `https://github.com/juliomonteiiro/leadFlow`

## Tecnologias utilizadas

- **Frontend:** React 18, TypeScript, Vite, React Router
- **UI:** Tailwind CSS, Lucide Icons, dnd-kit
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **IA:** Supabase Edge Function `generate-messages` integrada a provedor LLM
- **Qualidade:** ESLint, TypeScript strict, Vitest + Testing Library

## Arquitetura e organização

- `src/pages`: páginas de rota (Kanban, Dashboard, Campanhas, Configurações)
- `src/components`: componentes de UI e componentes de domínio
- `src/hooks`: hooks de regras de negócio e acesso a dados
- `src/contexts`: providers de estado global (workspace, tema, toast)
- `supabase/migrations`: schema, RLS, grants e evolução do banco
- `supabase/functions`: funções server-side (ex.: geração de mensagens)

## Decisões técnicas

- **Multi-tenancy por `workspace_id`:** todas as entidades de negócio são isoladas por workspace.
- **Segurança no banco (RLS-first):** políticas no Supabase garantem acesso apenas ao workspace do usuário.
- **Hooks por domínio:** separação de responsabilidades (`useLeads`, `useStages`, `useCampaigns`, `useMessages`, etc.).
- **Fluxo orientado a eventos:** histórico em `activity_logs` para criação de lead, mudanças de etapa, geração e envio de mensagem.
- **Automação por gatilho de etapa:** campanhas podem gerar mensagens automaticamente ao entrar na etapa configurada.
- **Validação de transição:** bloqueio de avanço de etapa quando campos obrigatórios não estão preenchidos.

## Como a integração com LLM foi estruturada

- O frontend chama a Edge Function `generate-messages` com `lead_id` e `campaign_id`.
- A função monta prompt com:
  - contexto da campanha
  - prompt/instruções da campanha
  - dados padrão e personalizados do lead
- O retorno é persistido em `generated_messages` com variações.
- O envio simulado marca `was_sent = true` e move o lead para **Tentando Contato**.

## Desafios encontrados e soluções

- **403 em consultas do workspace:** ajuste de grants e bootstrap de sessão/workspace com RPC.
- **Persistência de sessão no refresh:** estabilização do fluxo de autenticação antes de carregar dados.
- **Qualidade de dados do lead:** validação de email/telefone e origem padronizada por select.
- **Consistência visual:** refinamento de dashboard, kanban e temas escuro/claro.
- **Fast Refresh warnings (`only-export-components`):** separação entre contexto e hooks sem `eslint-disable`.

## Funcionalidades implementadas (checklist)

### Requisitos obrigatórios

- [x] Cadastro e login de usuários (Supabase Auth)
- [x] Isolamento de dados por workspace
- [x] CRUD de leads com campos padrão
- [x] Campos personalizados por workspace
- [x] Kanban com movimentação entre etapas
- [x] Detalhes/edição do lead
- [x] Campanhas com contexto, prompt e etapa gatilho
- [x] Geração de mensagens por lead/campanha
- [x] Ação de envio simulada com movimentação para "Tentando Contato"
- [x] Regras de transição por campos obrigatórios
- [x] Dashboard com métricas do workspace

### Diferenciais implementados

- [x] Geração automática por etapa gatilho
- [x] Histórico de atividades
- [x] Histórico de mensagens enviadas
- [x] Métricas adicionais no dashboard (taxa de envio e eficiência)
- [x] RLS estruturado no Supabase

## Testes e qualidade

Comandos principais:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:coverage`
- `npm run build`

Cobertura atual focada em regras de negócio (hooks): criação de leads, regras obrigatórias, métricas, campanhas, estágios e campos customizados.

## Rodando localmente

1. Instalar dependências:
   - `npm install`
2. Configurar variáveis de ambiente em `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Executar:
   - `npm run dev`

## Deploy (passo a passo)

### Frontend (Vercel recomendado)

1. Subir repositório no GitHub.
2. Importar projeto no Vercel.
3. Definir variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Publicar e copiar URL para a seção "Links da entrega".

### Supabase

1. Confirmar migrations aplicadas no projeto Supabase.
2. Publicar/confirmar Edge Function `generate-messages`.
3. Validar políticas RLS com um usuário de teste.

## Fluxo para demonstração em vídeo

1. Cadastro/login
2. Criação de lead
3. Configuração/criação de campanha
4. Geração de mensagens com IA
5. Envio simulado e mudança automática de etapa
6. Regras de transição e validação
7. Dashboard e métricas
