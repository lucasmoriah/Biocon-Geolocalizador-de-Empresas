-- ==============================================================================
-- SCRIPT DE CONFIGURAÇÃO UNIFICADO - BIOCON GEOLOCALIZADOR
-- ==============================================================================

-- 1. TABELA ÚNICA: LOCATIONS
-- Substitui as antigas tabelas aterros, clientes e tecnicos
create table if not exists public.locations (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  
  -- Coluna que define o que é o registro
  type text not null, -- 'aterros', 'clientes', 'tecnicos'
  
  -- Dados Unificados
  nome text,         -- Nome ou Razão Social
  detalhe text,      -- Localização, CNPJ ou Especialidade
  contato text,      -- Telefone, Email ou Contato
  
  -- Endereço e Geo
  cep text,
  estado text,
  latitude double precision,
  longitude double precision,
  radius double precision default 0,
  
  constraint locations_pkey primary key (id)
);

-- ==============================================================================
-- SEGURANÇA (RLS) & PERMISSÕES
-- ==============================================================================

-- 1. Garantir que o RLS está ativo
alter table public.locations enable row level security;

-- 2. Limpar políticas antigas para evitar conflitos
drop policy if exists "Locations select" on public.locations;
drop policy if exists "Locations insert" on public.locations;
drop policy if exists "Locations update" on public.locations;
drop policy if exists "Locations delete" on public.locations;
drop policy if exists "Public access" on public.locations;
drop policy if exists "Public insert" on public.locations;
drop policy if exists "Public update" on public.locations;
drop policy if exists "Public delete" on public.locations;

-- 3. Criar políticas permissivas para o papel 'anon' (público/sem login)
-- Isso permite que qualquer pessoa com a URL da API Key leia e escreva dados.
-- Essencial para demos públicas onde não há autenticação de usuário.

create policy "Public access"
on public.locations
for select
to public
using (true);

create policy "Public insert"
on public.locations
for insert
to public
with check (true);

create policy "Public update"
on public.locations
for update
to public
using (true);

create policy "Public delete"
on public.locations
for delete
to public
using (true);

-- 4. Garantir permissões de Schema (MUITO IMPORTANTE para acesso anônimo)
grant usage on schema public to anon;
grant all on public.locations to anon;
grant usage on schema public to authenticated;
grant all on public.locations to authenticated;