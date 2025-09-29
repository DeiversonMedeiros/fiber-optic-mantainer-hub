-- =====================================================
-- MÓDULO FINANCEIRO - CORREÇÃO DE ERRO
-- =====================================================
-- Script para corrigir o erro de parâmetro duplicado
-- na função get_unreconciled_transactions
-- =====================================================

-- Corrigir função para obter transações não conciliadas
CREATE OR REPLACE FUNCTION financeiro.get_unreconciled_transactions(company_id uuid, p_bank_account_id uuid DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    bank_account_id uuid,
    tipo text,
    descricao text,
    valor numeric,
    data_movimento date,
    conciliado boolean,
    banco text,
    conta text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bt.id,
        bt.bank_account_id,
        bt.tipo,
        bt.descricao,
        bt.valor,
        bt.data_movimento,
        bt.conciliado,
        ba.banco,
        ba.conta
    FROM financeiro.bank_transactions bt
    JOIN financeiro.bank_accounts ba ON bt.bank_account_id = ba.id
    WHERE bt.company_id = $1 
    AND bt.conciliado = false
    AND (p_bank_account_id IS NULL OR bt.bank_account_id = p_bank_account_id)
    ORDER BY bt.data_movimento DESC;
END;
$$;

-- Verificar se a função foi criada corretamente
SELECT 
    'Função corrigida' as status,
    routine_name as funcao,
    routine_type as tipo
FROM information_schema.routines 
WHERE routine_schema = 'financeiro'
AND routine_name = 'get_unreconciled_transactions';



