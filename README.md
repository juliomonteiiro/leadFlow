# LeadFlow

CRM para gestão de leads com funil Kanban, campanhas e geração de mensagens com IA via Supabase Edge Functions.

## Stack

- React + TypeScript + Vite
- Tailwind CSS (tokens em `src/styles/global.css`)
- Supabase (Auth, PostgREST, RLS, Functions)

## Arquitetura

- `src/pages`: telas de rota
- `src/components`: UI e componentes de domínio
- `src/hooks`: acesso a dados e regras de orquestração de fluxo
- `src/contexts`: estado global leve (workspace, tema, toast)
- `supabase/migrations`: schema, RLS e grants
- `supabase/functions`: integrações server-side (ex: `generate-messages`)

## Decisões técnicas

- **RLS first**: autorização no banco, não no frontend.
- **Hooks por domínio**: `useLeads`, `useStages`, `useCampaigns`, etc., para isolar acesso ao Supabase.
- **UI otimista controlada**: atualizações locais após operações para experiência fluida.
- **Fluxo orientado a eventos**: logs de atividade em mudanças de etapa, geração e envio de mensagens.
- **Evolução incremental**: prompts entregues em commits pequenos e revisáveis.

## Rodando localmente

1. Instale dependências:
   - `npm install`
2. Configure `.env` com:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Rode:
   - `npm run dev`

## Build

- `npm run build`
