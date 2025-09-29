# Configuração do Schema no Supabase

## Problema Identificado
O erro `PGRST205` ocorre porque o PostgREST do Supabase não suporta a sintaxe `schema.table` diretamente. As tabelas estão no schema `rh`, mas o PostgREST precisa ser configurado para acessá-las corretamente.

## Solução Implementada

### 1. Correção nos Hooks
Todos os hooks foram corrigidos para remover o prefixo `rh.` das consultas:
- `usePeriodicExams.ts`
- `usePeriodicExamScheduling.ts` 
- `useExamNotifications.ts`

### 2. Configuração Necessária no Supabase

#### Opção A: Configurar PostgREST para usar schema 'rh' como padrão

1. **Acesse o Dashboard do Supabase**
2. **Vá para Settings > API**
3. **Configure o Schema Search Path:**

```sql
-- Execute este comando no SQL Editor do Supabase
ALTER DATABASE postgres SET search_path TO rh, public;
```

#### Opção B: Criar Views no Schema Public (Recomendado)

Execute o seguinte SQL no Supabase para criar views que expõem as tabelas do schema `rh` no schema `public`:

```sql
-- =====================================================
-- CONFIGURAÇÃO DO SCHEMA PARA POSTGREST
-- =====================================================

-- Criar views no schema public para as tabelas do rh
CREATE OR REPLACE VIEW public.employees AS 
SELECT * FROM rh.employees;

CREATE OR REPLACE VIEW public.periodic_exams AS 
SELECT * FROM rh.periodic_exams;

-- Configurar permissões para as views
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.periodic_exams TO authenticated;

-- Configurar RLS nas views
ALTER VIEW public.employees ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.periodic_exams ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para employees
CREATE POLICY "Enable all operations for employees" ON public.employees
FOR ALL USING (true) WITH CHECK (true);

-- Políticas RLS para periodic_exams
CREATE POLICY "Enable all operations for periodic_exams" ON public.periodic_exams
FOR ALL USING (true) WITH CHECK (true);

-- Política específica para managers
CREATE POLICY "Managers can view team periodic exams" ON public.periodic_exams
FOR SELECT USING (
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE manager_id = auth.uid()
  )
);
```

#### Opção C: Usar Funções RPC (Mais Avançado)

Se preferir manter as tabelas apenas no schema `rh`, crie funções RPC:

```sql
-- =====================================================
-- FUNÇÕES RPC PARA ACESSO AO SCHEMA RH
-- =====================================================

-- Função para buscar exames periódicos
CREATE OR REPLACE FUNCTION public.get_periodic_exams(p_company_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  employee_id uuid,
  tipo_exame text,
  data_agendada date,
  data_realizacao date,
  resultado text,
  arquivo_anexo text,
  status core.status_geral,
  created_at timestamptz,
  employee jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.company_id,
    pe.employee_id,
    pe.tipo_exame,
    pe.data_agendada,
    pe.data_realizacao,
    pe.resultado,
    pe.arquivo_anexo,
    pe.status,
    pe.created_at,
    jsonb_build_object(
      'id', e.id,
      'nome', e.nome,
      'matricula', e.matricula
    ) as employee
  FROM rh.periodic_exams pe
  LEFT JOIN rh.employees e ON e.id = pe.employee_id
  WHERE (p_company_id IS NULL OR pe.company_id = p_company_id)
  ORDER BY pe.data_agendada DESC;
END;
$$;

-- Função para criar exame periódico
CREATE OR REPLACE FUNCTION public.create_periodic_exam(
  p_company_id uuid,
  p_employee_id uuid,
  p_tipo_exame text,
  p_data_agendada date,
  p_resultado text DEFAULT NULL,
  p_arquivo_anexo text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_exam_id uuid;
BEGIN
  INSERT INTO rh.periodic_exams (
    company_id,
    employee_id,
    tipo_exame,
    data_agendada,
    resultado,
    arquivo_anexo,
    status
  ) VALUES (
    p_company_id,
    p_employee_id,
    p_tipo_exame,
    p_data_agendada,
    p_resultado,
    p_arquivo_anexo,
    CASE WHEN p_resultado IS NOT NULL THEN 'realizado' ELSE 'agendado' END
  ) RETURNING id INTO new_exam_id;
  
  RETURN new_exam_id;
END;
$$;

-- Configurar permissões
GRANT EXECUTE ON FUNCTION public.get_periodic_exams TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_periodic_exam TO authenticated;
```

## Recomendação

**Use a Opção B (Views)** - É a mais simples e mantém a compatibilidade com o código existente.

## Verificação

Após aplicar a solução, teste:

1. **Acesse a página de Exames Periódicos**
2. **Verifique se não há mais erros 404**
3. **Teste as funcionalidades:**
   - Listagem de exames
   - Criação de novos exames
   - Agendamento automático
   - Notificações

## Troubleshooting

### Se ainda houver erros:

1. **Verifique se as views foram criadas:**
   ```sql
   SELECT * FROM public.employees LIMIT 1;
   SELECT * FROM public.periodic_exams LIMIT 1;
   ```

2. **Verifique as permissões:**
   ```sql
   SELECT * FROM information_schema.table_privileges 
   WHERE table_name IN ('employees', 'periodic_exams') 
   AND table_schema = 'public';
   ```

3. **Verifique o RLS:**
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename IN ('employees', 'periodic_exams');
   ```

## Notas Importantes

- As views são apenas "espelhos" das tabelas originais
- Todas as operações (INSERT, UPDATE, DELETE) funcionam normalmente
- As políticas RLS são aplicadas nas views
- O desempenho é praticamente idêntico às tabelas originais
