# Módulo Financeiro - Sistema ERP

Este módulo implementa todas as funcionalidades financeiras essenciais do sistema ERP, incluindo contas a pagar/receber, tesouraria, contabilidade e integração fiscal com SEFAZ.

## Estrutura do Módulo

### Hooks (`src/hooks/financial/`)
- `useAccountsPayable.ts` - Gerenciamento de contas a pagar
- `useAccountsReceivable.ts` - Gerenciamento de contas a receber
- `useBankAccounts.ts` - Gerenciamento de contas bancárias
- `useBankTransactions.ts` - Gerenciamento de transações bancárias
- `useChartAccounts.ts` - Gerenciamento do plano de contas
- `useSefazIntegration.ts` - Integração com SEFAZ

### Páginas (`src/pages/financial/`)
- `FinancialDashboard.tsx` - Dashboard principal com KPIs
- `AccountsPayable.tsx` - Gestão de contas a pagar
- `AccountsReceivable.tsx` - Gestão de contas a receber
- `Treasury.tsx` - Tesouraria e conciliação bancária
- `FiscalIntegration.tsx` - Integração fiscal e SEFAZ
- `Accounting.tsx` - Contabilidade e plano de contas

### Componentes (`src/components/financial/`)
- `FinancialKPICard.tsx` - Cartões de KPIs reutilizáveis
- `FinancialTable.tsx` - Tabela genérica para dados financeiros
- `FinancialFilters.tsx` - Componente de filtros reutilizável

### Serviços (`src/services/financial/`)
- `financialService.ts` - Serviço principal para integração com banco de dados

## Funcionalidades Implementadas

### 1. Contas a Pagar/Receber
- ✅ Listagem com filtros avançados
- ✅ Cadastro e edição de títulos
- ✅ Controle de status (pendente, pago, vencido, cancelado)
- ✅ Relatórios de aging
- ✅ Cálculo de DSO (Days Sales Outstanding)
- ✅ Cálculo de DPO (Days Payable Outstanding)

### 2. Tesouraria
- ✅ Gestão de contas bancárias
- ✅ Registro de transações bancárias
- ✅ Conciliação bancária
- ✅ Projeção de fluxo de caixa (D+0 a D+90)
- ✅ Multi-conta e multi-moeda
- ✅ Controle de saldos

### 3. Contabilidade
- ✅ Plano de contas hierárquico
- ✅ Centros de custo
- ✅ Validação de códigos contábeis
- ✅ Estrutura de níveis
- ✅ Controle de ativação/desativação

### 4. Integração Fiscal (SEFAZ)
- ✅ Configuração de integrações por UF
- ✅ Upload e processamento de XMLs
- ✅ Consulta de status de NF-e
- ✅ Cancelamento de NF-e
- ✅ Inutilização de sequências
- ✅ Geração de DANFE
- ✅ Monitoramento de status SEFAZ

### 5. Dashboard e KPIs
- ✅ Saldo bancário total
- ✅ Contas a pagar/receber pendentes
- ✅ DSO e DPO
- ✅ Projeção de fluxo de caixa
- ✅ Alertas de vencimento
- ✅ Status de conciliação

## Estrutura do Banco de Dados

O módulo utiliza as seguintes tabelas no schema `financeiro`:

### Tabelas Principais
- `accounts_payable` - Contas a pagar
- `accounts_receivable` - Contas a receber
- `bank_accounts` - Contas bancárias
- `bank_transactions` - Transações bancárias
- `chart_accounts` - Plano de contas
- `invoices` - Notas fiscais
- `invoice_items` - Itens das notas fiscais

### Tabelas de Integração
- `sefaz_integration` - Configurações SEFAZ
- `sefaz_status` - Status dos serviços SEFAZ
- `cnab_files` - Arquivos CNAB
- `advances` - Adiantamentos

## Como Usar

### 1. Importar Hooks
```typescript
import { useAccountsPayable, useBankAccounts } from '@/hooks/financial';
```

### 2. Usar Componentes
```typescript
import { FinancialKPICard, FinancialTable } from '@/components/financial';
```

### 3. Navegar para Páginas
```typescript
import { FinancialDashboard, AccountsPayable } from '@/pages/financial';
```

## Configuração Necessária

### 1. Banco de Dados
Certifique-se de que as tabelas do schema `financeiro` estão criadas no Supabase.

### 2. RPCs SQL
O módulo utiliza várias funções RPC que precisam ser criadas no banco:
- `get_accounts_payable_aging`
- `get_accounts_receivable_aging`
- `get_accounts_payable_totals`
- `get_accounts_receivable_totals`
- `calculate_dso`
- `get_cash_flow_projection`
- `get_bank_reconciliation`
- `test_sefaz_connection`
- `process_nfe_xml`
- `consult_nfe_status`
- `cancel_nfe`
- `inutilize_nfe`
- `get_nfe_xml`
- `generate_danfe`

### 3. Permissões
Configure as permissões RLS (Row Level Security) para as tabelas do schema `financeiro`.

## Próximos Passos

### Funcionalidades Pendentes
- [ ] Workflow de aprovação configurável
- [ ] Integração com CNAB (remessas/retornos)
- [ ] Relatórios fiscais (SPED)
- [ ] Integração com estoque/vendas
- [ ] ECD/ECF
- [ ] Monitoramento em tempo real SEFAZ

### Melhorias Futuras
- [ ] Gráficos interativos para fluxo de caixa
- [ ] Notificações automáticas de vencimento
- [ ] Integração com APIs bancárias
- [ ] Relatórios personalizáveis
- [ ] Exportação para Excel/PDF
- [ ] Auditoria completa de transações

## Dependências

- React 18+
- TypeScript
- Supabase
- Tailwind CSS
- Lucide React
- date-fns
- shadcn/ui components

## Suporte

Para dúvidas ou problemas com o módulo financeiro, consulte a documentação do Supabase ou entre em contato com a equipe de desenvolvimento.



