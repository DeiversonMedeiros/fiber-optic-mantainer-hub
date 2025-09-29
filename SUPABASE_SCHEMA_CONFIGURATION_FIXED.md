# Configuração Corrigida do Schema no Supabase

## Problema Identificado
O erro `ALTER action ENABLE ROW SECURITY cannot be performed on relation "employees"` ocorre porque **não é possível habilitar RLS diretamente em views**. As views herdam automaticamente as políticas RLS das tabelas subjacentes.

## Solução Corrigida

### Script SQL Atualizado
Use o arquivo `SUPABASE_SCHEMA_CONFIGURATION_FIXED.sql` que contém:

1. **Criação das Views** (sem tentar habilitar RLS nelas)
2. **Configuração de Permissões** nas views
3. **Habilitação de RLS nas Tabelas Originais** (rh.employees e rh.periodic_exams)
4. **Criação de Políticas RLS** nas tabelas originais
5. **Verificações** para garantir que tudo está funcionando

### Como Funciona

```sql
-- ✅ CORRETO: Views herdam RLS das tabelas subjacentes
CREATE OR REPLACE VIEW public.employees AS 
SELECT * FROM rh.employees;

-- ❌ INCORRETO: Não é possível habilitar RLS em views
-- ALTER VIEW public.employees ENABLE ROW LEVEL SECURITY;

-- ✅ CORRETO: Habilitar RLS na tabela original
ALTER TABLE rh.employees ENABLE ROW LEVEL SECURITY;
```

### Passos para Executar

1. **Execute o script corrigido** `SUPABASE_SCHEMA_CONFIGURATION_FIXED.sql` no Supabase
2. **Verifique se as views foram criadas** executando:
   ```sql
   SELECT * FROM public.employees LIMIT 1;
   SELECT * FROM public.periodic_exams LIMIT 1;
   ```
3. **Teste a aplicação** - os erros 404 devem ter desaparecido

### Verificação Final

O script inclui consultas de verificação que mostrarão:
- Se as tabelas têm RLS habilitado
- Quantas políticas existem para cada tabela
- Se as views estão funcionando corretamente

### Por que Esta Abordagem Funciona

1. **Views são transparentes** - elas apenas "espelham" as tabelas originais
2. **RLS é herdado** - as políticas das tabelas `rh.employees` e `rh.periodic_exams` são aplicadas automaticamente
3. **PostgREST acessa as views** - sem precisar conhecer o schema `rh`
4. **Segurança mantida** - todas as políticas RLS continuam funcionando

### Resultado Esperado

Após executar o script corrigido:
- ✅ Views criadas no schema `public`
- ✅ RLS habilitado nas tabelas originais
- ✅ Políticas RLS configuradas
- ✅ PostgREST pode acessar as tabelas via views
- ✅ Erro 404 resolvido
- ✅ Sistema de exames periódicos funcionando
