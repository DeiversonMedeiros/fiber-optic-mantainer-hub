# Configuração do Banco de Dados - Módulo Financeiro

Este documento contém todas as instruções necessárias para configurar o banco de dados do módulo financeiro no Supabase.

## 📋 Pré-requisitos

- Acesso ao Supabase Dashboard
- Permissões de administrador no banco de dados
- Tabelas do schema `core` já criadas (companies, user_companies, etc.)

## 🚀 Instruções de Execução

### 1. Script Principal
Execute o arquivo `financial_module_database_setup.sql` no Supabase SQL Editor:

```sql
-- Execute todo o conteúdo do arquivo
-- Este script cria todas as funções RPC, triggers e políticas RLS
```

### 2. Script Adicional (Opcional)
Execute o arquivo `financial_module_additional_config.sql` para configurações extras:

```sql
-- Execute para funcionalidades adicionais como views e auditoria
```

### 3. Verificação
Execute o arquivo `financial_module_verification.sql` para verificar se tudo foi configurado corretamente:

```sql
-- Execute para verificar se todas as configurações estão corretas
```

## 📊 O que é criado

### Tabelas (já existentes)
- `financeiro.accounts_payable` - Contas a pagar
- `financeiro.accounts_receivable` - Contas a receber
- `financeiro.bank_accounts` - Contas bancárias
- `financeiro.bank_transactions` - Transações bancárias
- `financeiro.chart_accounts` - Plano de contas
- `financeiro.invoices` - Notas fiscais
- `financeiro.invoice_items` - Itens das notas fiscais
- `financeiro.sefaz_integration` - Integrações SEFAZ
- `financeiro.sefaz_status` - Status SEFAZ
- `financeiro.cnab_files` - Arquivos CNAB
- `financeiro.advances` - Adiantamentos

### Funções RPC Criadas

#### Contas a Pagar/Receber
- `get_accounts_payable_aging(company_id)` - Relatório de aging
- `get_accounts_payable_totals(company_id)` - Totais por status
- `get_accounts_receivable_aging(company_id)` - Relatório de aging
- `get_accounts_receivable_totals(company_id)` - Totais por status
- `calculate_dso(company_id)` - Cálculo de DSO
- `calculate_dpo(company_id)` - Cálculo de DPO

#### Tesouraria
- `get_cash_flow_projection(company_id, days_ahead)` - Projeção de fluxo
- `get_bank_reconciliation(bank_account_id, data_inicio, data_fim)` - Conciliação
- `get_unreconciled_transactions(company_id, bank_account_id)` - Transações não conciliadas

#### Integração SEFAZ
- `test_sefaz_connection(integration_id)` - Teste de conexão
- `process_nfe_xml(file_path, company_id, uf)` - Processar XML
- `consult_nfe_status(chave_acesso, uf, company_id)` - Consultar status
- `cancel_nfe(invoice_id, justificativa, company_id)` - Cancelar NF-e
- `inutilize_nfe(serie, numero_inicial, numero_final, justificativa, uf, company_id)` - Inutilizar NF-e
- `get_nfe_xml(invoice_id, company_id)` - Obter XML
- `generate_danfe(invoice_id, company_id)` - Gerar DANFE

### Triggers Criados
- `verificar_vencimento_titulos()` - Atualiza status para vencido
- `atualizar_saldo_bancario()` - Atualiza saldo das contas
- `encontro_contas_automatico()` - Encontro de contas automático
- `log_financial_changes()` - Auditoria de alterações

### Políticas RLS
Todas as tabelas do módulo financeiro têm políticas RLS configuradas para:
- SELECT: Usuários podem ver dados de suas empresas
- INSERT: Usuários podem inserir dados para suas empresas
- UPDATE: Usuários podem atualizar dados de suas empresas
- DELETE: Usuários podem excluir dados de suas empresas

### Índices de Performance
- Índices em campos de busca frequente
- Índices em campos de ordenação
- Índices em campos de filtro

## 🔧 Configurações Adicionais

### 1. Configurar Storage para XMLs
No Supabase Dashboard, vá para Storage e crie um bucket chamado `documents`:

```sql
-- Criar bucket para documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);
```

### 2. Configurar Políticas de Storage
```sql
-- Política para upload de XMLs
CREATE POLICY "Users can upload XMLs for their company" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IN (
        SELECT user_id FROM core.user_companies 
        WHERE company_id::text = (storage.foldername(name))[1]
    )
);

-- Política para visualizar XMLs
CREATE POLICY "Users can view XMLs from their company" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid() IN (
        SELECT user_id FROM core.user_companies 
        WHERE company_id::text = (storage.foldername(name))[1]
    )
);
```

### 3. Configurar Webhooks (Opcional)
Para notificações em tempo real, configure webhooks no Supabase:

```sql
-- Exemplo de webhook para notificar vencimentos
-- Configure no Supabase Dashboard > Database > Webhooks
```

## 🧪 Testes

### 1. Teste Básico
Execute o script de verificação para garantir que tudo foi criado:

```sql
-- Execute financial_module_verification.sql
```

### 2. Teste de Funções
```sql
-- Testar função de aging (substitua pelo ID de uma empresa existente)
SELECT * FROM financeiro.get_accounts_payable_aging('seu-company-id-aqui');

-- Testar função de totais
SELECT * FROM financeiro.get_accounts_payable_totals('seu-company-id-aqui');
```

### 3. Teste de Permissões
```sql
-- Verificar se RLS está funcionando
SELECT * FROM financeiro.accounts_payable;
-- Deve retornar apenas dados da empresa do usuário logado
```

## 🚨 Solução de Problemas

### Erro: "function does not exist"
- Verifique se todas as funções foram criadas executando o script de verificação
- Certifique-se de que está executando no schema correto

### Erro: "permission denied"
- Verifique se as políticas RLS estão configuradas
- Certifique-se de que o usuário tem acesso à empresa

### Erro: "relation does not exist"
- Verifique se as tabelas do schema `financeiro` existem
- Certifique-se de que está executando no banco correto

### Performance lenta
- Execute `ANALYZE` nas tabelas principais
- Verifique se os índices foram criados
- Considere ajustar as configurações de conexão

## 📝 Notas Importantes

1. **Backup**: Sempre faça backup antes de executar scripts em produção
2. **Teste**: Execute primeiro em ambiente de desenvolvimento
3. **Permissões**: Verifique se todos os usuários têm as permissões necessárias
4. **Monitoramento**: Configure alertas para erros de banco de dados
5. **Atualizações**: Mantenha os scripts versionados para futuras atualizações

## 🔄 Atualizações Futuras

Para atualizar o módulo financeiro:

1. Faça backup do banco atual
2. Execute os novos scripts de atualização
3. Execute o script de verificação
4. Teste todas as funcionalidades
5. Documente as mudanças

## 📞 Suporte

Em caso de problemas:

1. Execute o script de verificação
2. Verifique os logs do Supabase
3. Consulte a documentação do Supabase
4. Entre em contato com a equipe de desenvolvimento

---

**Versão**: 1.0  
**Data**: $(date)  
**Autor**: Sistema ERP - Módulo Financeiro



