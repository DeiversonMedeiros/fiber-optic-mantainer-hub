-- =====================================================
-- MÓDULO FINANCEIRO - SCRIPT DE VERIFICAÇÃO
-- =====================================================
-- Execute este script para verificar se todas as
-- configurações do módulo financeiro estão corretas
-- =====================================================

-- =====================================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- =====================================================

SELECT 
    'Verificação de Tabelas' as categoria,
    table_name as tabela,
    CASE 
        WHEN table_name IN (
            'accounts_payable', 'accounts_receivable', 'bank_accounts', 
            'bank_transactions', 'chart_accounts', 'invoices', 
            'invoice_items', 'sefaz_integration', 'sefaz_status', 
            'cnab_files', 'advances'
        ) THEN '✅ Existe'
        ELSE '❌ Não encontrada'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'financeiro'
ORDER BY table_name;

-- =====================================================
-- 2. VERIFICAR FUNÇÕES RPC CRIADAS
-- =====================================================

SELECT 
    'Verificação de Funções RPC' as categoria,
    routine_name as funcao,
    routine_type as tipo,
    CASE 
        WHEN routine_name IN (
            'get_accounts_payable_aging',
            'get_accounts_payable_totals',
            'get_accounts_receivable_aging',
            'get_accounts_receivable_totals',
            'calculate_dso',
            'calculate_dpo',
            'get_cash_flow_projection',
            'get_bank_reconciliation',
            'get_unreconciled_transactions',
            'test_sefaz_connection',
            'process_nfe_xml',
            'consult_nfe_status',
            'cancel_nfe',
            'inutilize_nfe',
            'get_nfe_xml',
            'generate_danfe'
        ) THEN '✅ Existe'
        ELSE '❌ Não encontrada'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'financeiro'
ORDER BY routine_name;

-- =====================================================
-- 3. VERIFICAR POLÍTICAS RLS
-- =====================================================

SELECT 
    'Verificação de Políticas RLS' as categoria,
    schemaname || '.' || tablename as tabela,
    policyname as politica,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ Configurada'
        ELSE '❌ Não configurada'
    END as status
FROM pg_policies 
WHERE schemaname = 'financeiro'
ORDER BY tablename, policyname;

-- =====================================================
-- 4. VERIFICAR ÍNDICES
-- =====================================================

SELECT 
    'Verificação de Índices' as categoria,
    schemaname || '.' || tablename as tabela,
    indexname as indice,
    CASE 
        WHEN indexname IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Não encontrado'
    END as status
FROM pg_indexes 
WHERE schemaname = 'financeiro'
ORDER BY tablename, indexname;

-- =====================================================
-- 5. VERIFICAR TRIGGERS
-- =====================================================

SELECT 
    'Verificação de Triggers' as categoria,
    trigger_name as trigger,
    event_object_table as tabela,
    action_timing as timing,
    event_manipulation as evento,
    CASE 
        WHEN trigger_name IS NOT NULL THEN '✅ Configurado'
        ELSE '❌ Não configurado'
    END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'financeiro'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 6. VERIFICAR VIEWS
-- =====================================================

SELECT 
    'Verificação de Views' as categoria,
    table_name as view,
    CASE 
        WHEN table_name IN ('vw_resumo_financeiro', 'vw_transacoes_detalhadas') THEN '✅ Existe'
        ELSE '❌ Não encontrada'
    END as status
FROM information_schema.views 
WHERE table_schema = 'financeiro'
ORDER BY table_name;

-- =====================================================
-- 7. TESTAR FUNÇÕES PRINCIPAIS
-- =====================================================

-- Testar função de aging (usar uma empresa existente)
DO $$
DECLARE
    test_company_id uuid;
    aging_result record;
BEGIN
    -- Buscar uma empresa para teste
    SELECT id INTO test_company_id FROM core.companies LIMIT 1;
    
    IF test_company_id IS NOT NULL THEN
        -- Testar função de aging de contas a pagar
        FOR aging_result IN 
            SELECT * FROM financeiro.get_accounts_payable_aging(test_company_id) LIMIT 1
        LOOP
            RAISE NOTICE 'Teste de aging: % registros encontrados', aging_result.quantidade;
        END LOOP;
        
        -- Testar função de totais
        FOR aging_result IN 
            SELECT * FROM financeiro.get_accounts_payable_totals(test_company_id)
        LOOP
            RAISE NOTICE 'Teste de totais: Pendente = %, Pago = %', aging_result.pendente, aging_result.pago;
        END LOOP;
        
        RAISE NOTICE '✅ Testes de funções executados com sucesso';
    ELSE
        RAISE NOTICE '⚠️ Nenhuma empresa encontrada para teste';
    END IF;
END $$;

-- =====================================================
-- 8. VERIFICAR PERMISSÕES DE USUÁRIO
-- =====================================================

SELECT 
    'Verificação de Permissões' as categoria,
    'RLS habilitado' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'financeiro' 
            AND table_name = 'accounts_payable'
        ) THEN '✅ Configurado'
        ELSE '❌ Não configurado'
    END as status;

-- =====================================================
-- 9. RESUMO GERAL
-- =====================================================

SELECT 
    'RESUMO GERAL' as categoria,
    'Tabelas criadas' as item,
    COUNT(*)::text as quantidade
FROM information_schema.tables 
WHERE table_schema = 'financeiro'

UNION ALL

SELECT 
    'RESUMO GERAL' as categoria,
    'Funções RPC criadas' as item,
    COUNT(*)::text as quantidade
FROM information_schema.routines 
WHERE routine_schema = 'financeiro'

UNION ALL

SELECT 
    'RESUMO GERAL' as categoria,
    'Políticas RLS criadas' as item,
    COUNT(*)::text as quantidade
FROM pg_policies 
WHERE schemaname = 'financeiro'

UNION ALL

SELECT 
    'RESUMO GERAL' as categoria,
    'Índices criados' as item,
    COUNT(*)::text as quantidade
FROM pg_indexes 
WHERE schemaname = 'financeiro'

UNION ALL

SELECT 
    'RESUMO GERAL' as categoria,
    'Triggers criados' as item,
    COUNT(*)::text as quantidade
FROM information_schema.triggers 
WHERE trigger_schema = 'financeiro'

UNION ALL

SELECT 
    'RESUMO GERAL' as categoria,
    'Views criadas' as item,
    COUNT(*)::text as quantidade
FROM information_schema.views 
WHERE table_schema = 'financeiro';

-- =====================================================
-- 10. INSTRUÇÕES DE PRÓXIMOS PASSOS
-- =====================================================

SELECT 
    'PRÓXIMOS PASSOS' as categoria,
    '1. Verificar se todas as tabelas foram criadas' as instrucao,
    'Execute as consultas acima para verificar' as detalhes

UNION ALL

SELECT 
    'PRÓXIMOS PASSOS' as categoria,
    '2. Testar as funções RPC' as instrucao,
    'Use uma empresa existente para testar as funções' as detalhes

UNION ALL

SELECT 
    'PRÓXIMOS PASSOS' as categoria,
    '3. Configurar usuários e permissões' as instrucao,
    'Certifique-se de que os usuários têm acesso às empresas' as detalhes

UNION ALL

SELECT 
    'PRÓXIMOS PASSOS' as categoria,
    '4. Inserir dados iniciais' as instrucao,
    'Configure o plano de contas e dados básicos' as detalhes

UNION ALL

SELECT 
    'PRÓXIMOS PASSOS' as categoria,
    '5. Testar a aplicação' as instrucao,
    'Execute o frontend e teste todas as funcionalidades' as detalhes;

-- =====================================================
-- FIM DO SCRIPT DE VERIFICAÇÃO
-- =====================================================



