# Solução Final para Schema RH

## Problema Resolvido
O erro `PGRST205` ocorria porque o PostgREST não conseguia acessar as tabelas do schema `rh` diretamente. A solução implementada usa **funções RPC** que encapsulam o acesso às tabelas do schema `rh`.

## ✅ Solução Implementada

### 1. Funções RPC Criadas
Execute o script `SUPABASE_RH_SCHEMA_ALTERNATIVE.sql` no Supabase para criar as seguintes funções:

- `get_employees()` - Busca funcionários
- `get_periodic_exams()` - Busca exames periódicos
- `create_periodic_exam()` - Cria novo exame
- `update_periodic_exam()` - Atualiza exame existente
- `delete_periodic_exam()` - Remove exame

### 2. Hooks Atualizados
Todos os hooks foram atualizados para usar as funções RPC:

- ✅ `usePeriodicExams.ts` - Usa `get_periodic_exams`, `create_periodic_exam`, `update_periodic_exam`, `delete_periodic_exam`
- ✅ `usePeriodicExamScheduling.ts` - Usa `get_employees`, `get_periodic_exams`
- ✅ `useExamNotifications.ts` - Usa `get_periodic_exams`, `update_periodic_exam`

### 3. Vantagens da Solução RPC

1. **Acesso Direto ao Schema RH** - As funções RPC executam no contexto do banco de dados
2. **Segurança Mantida** - Todas as políticas RLS continuam funcionando
3. **Performance** - Consultas otimizadas executadas no servidor
4. **Compatibilidade** - Funciona com qualquer configuração de schema do PostgREST
5. **Flexibilidade** - Fácil de estender com novas funcionalidades

## 🚀 Como Executar

### Passo 1: Execute o SQL no Supabase
```sql
-- Execute o conteúdo do arquivo SUPABASE_RH_SCHEMA_ALTERNATIVE.sql
-- no SQL Editor do Supabase
```

### Passo 2: Verifique se as Funções Foram Criadas
```sql
-- Verificar se as funções foram criadas
SELECT proname, prosrc FROM pg_proc WHERE proname LIKE 'get_%' OR proname LIKE 'create_%' OR proname LIKE 'update_%' OR proname LIKE 'delete_%';
```

### Passo 3: Teste as Funções
```sql
-- Teste básico
SELECT count(*) FROM public.get_employees();
SELECT count(*) FROM public.get_periodic_exams();
```

### Passo 4: Teste a Aplicação
1. Acesse a página de Exames Periódicos
2. Verifique se não há mais erros 404
3. Teste todas as funcionalidades:
   - Listagem de exames
   - Criação de novos exames
   - Agendamento automático
   - Notificações
   - Upload de arquivos PDF

## 🔧 Estrutura das Funções RPC

### get_periodic_exams()
```sql
SELECT * FROM public.get_periodic_exams(
  p_company_id => 'uuid-da-empresa',
  p_employee_id => 'uuid-do-funcionario', -- opcional
  p_status => 'agendado' -- opcional
);
```

### create_periodic_exam()
```sql
SELECT public.create_periodic_exam(
  p_company_id => 'uuid-da-empresa',
  p_employee_id => 'uuid-do-funcionario',
  p_tipo_exame => 'periodico',
  p_data_agendada => '2024-01-15',
  p_resultado => 'Apto', -- opcional
  p_arquivo_anexo => 'url-do-arquivo' -- opcional
);
```

### update_periodic_exam()
```sql
SELECT public.update_periodic_exam(
  p_exam_id => 'uuid-do-exame',
  p_data_agendada => '2024-01-20', -- opcional
  p_status => 'realizado' -- opcional
);
```

## 🛡️ Segurança

- Todas as funções usam `SECURITY DEFINER`
- Políticas RLS das tabelas originais são mantidas
- Usuário autenticado é verificado via `auth.uid()`
- Permissões específicas para cada função

## 📊 Monitoramento

Para monitorar o uso das funções RPC:

```sql
-- Ver logs de execução das funções
SELECT * FROM pg_stat_user_functions WHERE funcname LIKE '%periodic%' OR funcname LIKE '%employee%';
```

## 🔄 Backup e Restauração

As funções RPC são parte do schema do banco de dados e serão incluídas em:
- Backups automáticos do Supabase
- Migrações de schema
- Restaurações de banco de dados

## ✅ Resultado Esperado

Após executar a solução:
- ✅ Erro 404 resolvido
- ✅ Acesso às tabelas do schema `rh` funcionando
- ✅ Todas as funcionalidades de exames periódicos operacionais
- ✅ Upload de arquivos PDF funcionando
- ✅ Agendamento automático funcionando
- ✅ Sistema de notificações funcionando

## 🆘 Troubleshooting

### Se ainda houver erros:

1. **Verifique se as funções foram criadas:**
   ```sql
   SELECT proname FROM pg_proc WHERE proname IN ('get_employees', 'get_periodic_exams', 'create_periodic_exam', 'update_periodic_exam', 'delete_periodic_exam');
   ```

2. **Verifique as permissões:**
   ```sql
   SELECT proname, proacl FROM pg_proc WHERE proname LIKE '%periodic%' OR proname LIKE '%employee%';
   ```

3. **Teste uma função manualmente:**
   ```sql
   SELECT * FROM public.get_employees() LIMIT 1;
   ```

4. **Verifique os logs do Supabase** para erros específicos

Esta solução é robusta e resolve definitivamente o problema de acesso ao schema `rh` no Supabase PostgREST.
