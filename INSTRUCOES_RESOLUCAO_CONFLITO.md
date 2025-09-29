# Instruções para Resolver Conflito de Funções

## Problema Identificado
O erro `function name "public.get_employees" is not unique` indica que já existe uma função com esse nome no schema `public`.

## ✅ Solução Implementada

### 1. Scripts Criados

**`IDENTIFY_FUNCTION_CONFLICTS.sql`** - Para identificar onde está o conflito:
- Lista todas as funções com nome `get_employees`
- Mostra dependências e uso das funções
- Identifica o schema onde está a função conflitante

**`RESOLVE_FUNCTION_CONFLICT.sql`** - Para resolver o conflito:
- Cria funções com nomes únicos: `get_rh_employees`, `get_rh_periodic_exams`, etc.
- Mantém a funcionalidade original
- Evita conflitos com funções existentes

### 2. Hooks Atualizados

Todos os hooks foram atualizados para usar os novos nomes das funções:
- ✅ `usePeriodicExams.ts` - Usa `get_rh_periodic_exams`, `create_rh_periodic_exam`, etc.
- ✅ `usePeriodicExamScheduling.ts` - Usa `get_rh_employees`, `get_rh_periodic_exams`
- ✅ `useExamNotifications.ts` - Usa `get_rh_periodic_exams`, `update_rh_periodic_exam`

## 🚀 Como Executar

### Passo 1: Identificar o Conflito
```sql
-- Execute o script IDENTIFY_FUNCTION_CONFLICTS.sql
-- Isso mostrará onde está a função conflitante
```

### Passo 2: Resolver o Conflito
```sql
-- Execute o script RESOLVE_FUNCTION_CONFLICT.sql
-- Isso criará as funções com nomes únicos
```

### Passo 3: Verificar se Funcionou
```sql
-- Verificar se as novas funções foram criadas
SELECT proname FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' AND p.proname LIKE 'get_rh_%'
ORDER BY p.proname;

-- Testar as funções
SELECT count(*) FROM public.get_rh_employees();
SELECT count(*) FROM public.get_rh_periodic_exams();
```

### Passo 4: Testar a Aplicação
1. Acesse a página de Exames Periódicos
2. Verifique se não há mais erros
3. Teste todas as funcionalidades

## 🔧 Funções Criadas

| Função Original | Nova Função | Descrição |
|----------------|-------------|-----------|
| `get_employees` | `get_rh_employees` | Busca funcionários do schema RH |
| `get_periodic_exams` | `get_rh_periodic_exams` | Busca exames periódicos |
| `create_periodic_exam` | `create_rh_periodic_exam` | Cria novo exame |
| `update_periodic_exam` | `update_rh_periodic_exam` | Atualiza exame |
| `delete_periodic_exam` | `delete_rh_periodic_exam` | Remove exame |

## 🛡️ Vantagens da Solução

1. **Sem Conflitos** - Nomes únicos evitam problemas
2. **Funcionalidade Mantida** - Todas as operações funcionam igual
3. **Segurança Preservada** - Políticas RLS mantidas
4. **Compatibilidade** - Funciona com qualquer configuração
5. **Facilidade de Manutenção** - Nomes descritivos e organizados

## 🔍 Troubleshooting

### Se ainda houver erros:

1. **Verifique se as funções foram criadas:**
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE 'get_rh_%';
   ```

2. **Verifique as permissões:**
   ```sql
   SELECT proname, proacl FROM pg_proc WHERE proname LIKE 'get_rh_%';
   ```

3. **Teste uma função manualmente:**
   ```sql
   SELECT * FROM public.get_rh_employees() LIMIT 1;
   ```

4. **Verifique os logs do Supabase** para erros específicos

## ✅ Resultado Esperado

Após executar a solução:
- ✅ Conflito de funções resolvido
- ✅ Funções RPC criadas com nomes únicos
- ✅ Hooks atualizados para usar novas funções
- ✅ Sistema de exames periódicos funcionando
- ✅ Erro 404 resolvido
- ✅ Todas as funcionalidades operacionais

## 📝 Notas Importantes

- As funções antigas não foram removidas (para segurança)
- Os novos nomes são mais descritivos (`get_rh_employees`)
- A funcionalidade é idêntica à versão anterior
- Todas as permissões e políticas RLS foram mantidas

Esta solução resolve definitivamente o conflito de funções e permite que o sistema funcione corretamente!
