# DenteCare Connect — Dashboard de Atendimento IA

Dashboard de monitoramento em tempo real para o agente de atendimento WhatsApp da Clínica Odontológica DenteCare, construído como parte do Desafio 2 do teste técnico de Analista de IA e Automações.

## Stack Utilizada

- **Framework**: React 19 + TanStack Start (TanStack Router + TanStack Query)
- **Linguagem**: TypeScript (strict mode)
- **Estilização**: Tailwind CSS v4 + Radix UI (shadcn/ui)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Gráficos**: Recharts
- **Deploy**: Cloudflare Workers
- **Vibe Coding**: Lovable

## Funcionalidades

- Listagem de todas as conversas com status (ativa, aguardando, encerrada)
- Métricas agregadas: total de conversas, mensagens, conversas hoje, tempo médio de resposta
- Gráfico de barras com volume de conversas nos últimos 7 dias
- Gráfico de pizza com distribuição de intenções (agendamento, orçamento, emergência, dúvida)
- Badge de sentimento por conversa (positivo, neutro, negativo)
- Indicador de conversas que precisam de atenção humana
- Painel lateral com histórico completo de mensagens em formato de chat
- Atualização automática a cada 30 segundos
- Tema claro/escuro
- Autenticação com email e senha

## Integração com o Agente (Desafio 1)

O agente de WhatsApp construído no N8N (Desafio 1) grava automaticamente cada conversa e mensagem no Supabase via HTTP Request nodes após cada interação. O dashboard consome esses dados em tempo real sem dados mockados.

Fluxo de dados:
```
WhatsApp → Evolution API → N8N → Supabase → Dashboard
```

## Como Rodar Localmente

### Pré-requisitos
- Node.js 20+ ou Bun
- Conta no Supabase (projeto já configurado)

### Instalação

```bash
git clone https://github.com/seu-usuario/dentecare-connect
cd dentecare-connect
bun install
```

### Variáveis de Ambiente

> **Nota:** As variáveis de ambiente estão incluídas no repositório pois este projeto foi gerado pela plataforma Lovable, que gerencia as credenciais do Supabase diretamente no repositório para facilitar o deploy contínuo. Em um ambiente de produção real, as credenciais seriam gerenciadas via secrets do CI/CD.

As credenciais do Supabase já estão no arquivo `.env` do repositório. Para rodar com seu próprio projeto Supabase, crie um `.env` baseado no `.env.example`:

```bash
cp .env.example .env
# Preencha com suas credenciais do Supabase
```

### Executar

```bash
bun run dev
```

Acesse `http://localhost:3000`

### Build para Produção

```bash
bun run build
wrangler deploy
```

## Estrutura de Pastas

```
src/
├── components/
│   ├── dashboard/
│   │   ├── Header.tsx              # Header com navegação e tema
│   │   ├── MetricsCards.tsx        # Cards de métricas agregadas
│   │   ├── ConversationsChart.tsx  # Gráfico de barras (7 dias)
│   │   ├── IntentsChart.tsx        # Gráfico de pizza (intenções)
│   │   ├── ConversationsTable.tsx  # Tabela com filtros
│   │   └── ConversationDetail.tsx  # Painel de chat lateral
│   └── ui/                         # Componentes base (shadcn/ui)
├── hooks/
│   ├── use-auth.tsx                # Contexto de autenticação
│   ├── use-theme.tsx               # Toggle de tema claro/escuro
│   └── use-mobile.tsx              # Detecção de dispositivo móvel
├── integrations/
│   └── supabase/
│       ├── client.ts               # Inicialização do cliente Supabase
│       └── types.ts                # Tipos gerados do schema do banco
├── lib/
│   └── conversation-analysis.ts   # Lógica de sentimento e intenções
└── routes/
    ├── index.tsx                   # Dashboard principal (protegido)
    └── login.tsx                   # Página de autenticação
```

## Decisões de Arquitetura

- **TanStack Start**: Escolhido pela integração nativa com TanStack Router e React Query, oferecendo SSR e file-based routing sem configuração extra
- **Supabase**: Backend completo com auth, banco PostgreSQL e real-time subscriptions em um só serviço
- **Análise no frontend**: Sentimento e classificação de intenções são calculados no cliente após buscar as mensagens, evitando a necessidade de funções serverless adicionais para o MVP
- **Cloudflare Workers**: Deploy na edge para baixa latência, configurado via `wrangler.jsonc`

## Schema do Banco de Dados

```sql
-- Conversas
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  contact_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'waiting', 'closed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  message_count INTEGER DEFAULT 0
);

-- Mensagens
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  content TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Vibe Coding Journal

**Ferramenta utilizada:** Lovable

**Estratégia adotada:** Prompt inicial detalhado descrevendo toda a stack, schema do banco e funcionalidades desejadas. A Lovable gerou a estrutura base completa com Supabase integrado, componentes de dashboard, autenticação e gráficos em uma única iteração.

**Prompts que funcionaram melhor:**
- Descrever o schema do banco antes de pedir os componentes — a IA usou os tipos corretos desde o início
- Especificar a stack completa (TanStack Start, Recharts, shadcn/ui) no primeiro prompt para evitar escolhas inconsistentes
- Pedir análise de sentimento e intenções com exemplos concretos de palavras-chave em português

**Onde a IA precisou de ajuste:**
- A análise de sentimento e intenções foi implementada no frontend com listas de palavras-chave; em produção seria mais robusto usar um modelo de linguagem via Edge Function do Supabase
- O cálculo de tempo médio de resposta assume que mensagens estão ordenadas por timestamp, o que depende de dados consistentes do N8N
