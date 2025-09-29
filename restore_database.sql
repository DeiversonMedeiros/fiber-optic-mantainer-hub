-- Script para restaurar o banco de dados
-- Aplicando todas as migrações principais

-- Criar schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS rh;
CREATE SCHEMA IF NOT EXISTS financeiro;

-- Tabelas principais do sistema
-- (Vou aplicar as migrações mais importantes primeiro)



