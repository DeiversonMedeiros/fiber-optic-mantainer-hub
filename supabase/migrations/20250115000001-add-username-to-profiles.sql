-- Adicionar coluna username à tabela profiles
-- Data: 2025-01-15
-- Descrição: Adiciona campo username para permitir login por nome de usuário

-- Adicionar coluna username à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.profiles.username IS 'Nome de usuário único para login (alternativo ao email)';

-- Criar índice para melhorar performance em consultas por username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username); 