# Sistema de Histórico de Funcionários

## 📋 Visão Geral

O Sistema de Histórico de Funcionários foi implementado para manter um registro completo e detalhado de todas as movimentações importantes dos funcionários, incluindo promoções, mudanças de centro de custo, função, salário, status e outras alterações relevantes.

## 🏗️ Arquitetura

### Banco de Dados

#### 1. **Tabela `rh.employee_movement_types`**
- Armazena os tipos de movimentação disponíveis
- Tipos pré-definidos: Admissão, Promoção, Mudança de Função, Centro de Custo, etc.
- Campo `codigo` para identificação única (ex: 'ADMISSAO', 'PROMOCAO')

#### 2. **Tabela `rh.employee_history`**
- Registra todas as movimentações dos funcionários
- Campos para dados anteriores e novos (before/after)
- Metadados: data de efetivação, motivo, descrição, anexos
- Auditoria completa com usuário e timestamp

#### 3. **Triggers Automáticos**
- **`trigger_log_employee_changes`**: Registra automaticamente mudanças nos dados do funcionário
- **`trigger_log_employee_admission`**: Registra automaticamente a admissão

### Frontend

#### 1. **Componentes**
- **`EmployeeHistory`**: Componente principal que exibe o histórico
- **`EmployeeHistoryEntry`**: Modal para visualizar detalhes de uma movimentação
- **Integração na aba "Histórico" do modal de detalhes do funcionário**

#### 2. **Serviços e Hooks**
- **`EmployeeHistoryService`**: Lógica de negócio para CRUD do histórico
- **`useEmployeeHistory`**: Hook para buscar histórico de um funcionário
- **`useEmployeeHistoryStats`**: Hook para estatísticas do histórico

## 🚀 Funcionalidades

### 1. **Registro Automático**
- ✅ Mudanças de cargo/posição
- ✅ Mudanças de centro de custo
- ✅ Mudanças de projeto
- ✅ Mudanças de departamento
- ✅ Mudanças de turno
- ✅ Mudanças de salário
- ✅ Mudanças de status
- ✅ Admissões

### 2. **Visualização do Histórico**
- ✅ Lista cronológica de movimentações
- ✅ Estatísticas (total de movimentações, última movimentação, etc.)
- ✅ Detalhes de cada movimentação (antes/depois)
- ✅ Ícones e badges para diferentes tipos de movimentação
- ✅ Suporte a documentos anexos

### 3. **Interface do Usuário**
- ✅ Aba "Histórico" no modal de detalhes do funcionário
- ✅ Cards visuais para cada movimentação
- ✅ Modal detalhado para visualizar mudanças específicas
- ✅ Estatísticas em dashboard
- ✅ Estados de carregamento e vazio

## 📊 Tipos de Movimentação Suportados

| Código | Nome | Descrição |
|--------|------|-----------|
| `ADMISSAO` | Admissão | Contratação do funcionário |
| `PROMOCAO` | Promoção | Promoção de cargo |
| `REBAIXAMENTO` | Rebaixamento | Rebaixamento de cargo |
| `MUDANCA_FUNCAO` | Mudança de Função | Mudança de função/cargo |
| `MUDANCA_CC` | Mudança de Centro de Custo | Transferência de centro de custo |
| `MUDANCA_PROJETO` | Mudança de Projeto | Transferência de projeto |
| `MUDANCA_TURNO` | Mudança de Turno | Mudança de turno de trabalho |
| `MUDANCA_DEPARTAMENTO` | Mudança de Departamento | Transferência de departamento |
| `MUDANCA_SALARIO` | Mudança de Salário | Alteração de salário |
| `MUDANCA_STATUS` | Mudança de Status | Mudança de status do funcionário |
| `FERIAS` | Férias | Período de férias |
| `LICENCA` | Licença | Período de licença |
| `DEMISSAO` | Demissão | Desligamento do funcionário |
| `APOSENTADORIA` | Aposentadoria | Aposentadoria do funcionário |
| `TRANSFERENCIA` | Transferência | Transferência interna ou externa |

## 🔧 Como Usar

### 1. **Visualizar Histórico**
1. Abra o modal "Detalhes do Funcionário"
2. Clique na aba "Histórico"
3. Visualize todas as movimentações em ordem cronológica
4. Clique em uma movimentação para ver detalhes

### 2. **Registro Automático**
- O sistema registra automaticamente todas as mudanças feitas nos dados do funcionário
- Não é necessário fazer nada - o histórico é criado automaticamente

### 3. **Estatísticas**
- Total de movimentações
- Data da última movimentação
- Média de dias entre movimentações
- Quantidade de tipos de movimentação

## 🎨 Interface

### Cards de Movimentação
- Ícones específicos para cada tipo de movimentação
- Badges coloridos para identificação rápida
- Data de efetivação e usuário que registrou
- Suporte a documentos anexos

### Modal de Detalhes
- Comparação lado a lado (antes/depois)
- Formatação específica para diferentes tipos de dados
- Informações completas da movimentação
- Botão para baixar documentos anexos

## 🔒 Segurança

- **RLS (Row Level Security)** habilitado em todas as tabelas
- Políticas de acesso baseadas em autenticação
- Auditoria completa com usuário e timestamp
- Triggers seguros que respeitam permissões

## 📈 Performance

- **Índices otimizados** para consultas frequentes
- **Cache inteligente** com React Query (2-10 minutos)
- **Consultas paginadas** para grandes volumes
- **Função SQL otimizada** para buscar histórico completo

## 🔮 Funcionalidades Futuras

- [ ] Registro manual de movimentações
- [ ] Relatórios de histórico
- [ ] Notificações de movimentações
- [ ] Integração com workflows de aprovação
- [ ] Exportação de histórico para PDF
- [ ] Filtros avançados por tipo e período

## 📁 Arquivos Criados

### Banco de Dados
- `supabase/migrations/20250925220000_create_employee_history_system.sql`

### Frontend
- `src/integrations/supabase/rh-history-types.ts`
- `src/services/rh/employeeHistoryService.ts`
- `src/hooks/rh/useEmployeeHistory.ts`
- `src/components/rh/EmployeeHistory.tsx`
- `src/components/rh/EmployeeHistoryEntry.tsx`

### Integração
- Adicionada aba "Histórico" em `src/components/rh/EmployeeDetailsTabs.tsx`

## ✅ Status

**Sistema implementado e funcional!** 

- ✅ Estrutura de banco criada
- ✅ Triggers automáticos funcionando
- ✅ Interface completa implementada
- ✅ Integração com modal de funcionário
- ✅ Estatísticas e visualizações
- ✅ Segurança e performance otimizadas

O sistema está pronto para uso e registrará automaticamente todas as futuras movimentações dos funcionários! 🎉
