# Controle de Correção do Ponto Eletrônico

## Visão Geral

Esta funcionalidade permite que os administradores do RH controlem quando os funcionários podem ou não editar seus registros de ponto no Portal do Funcionário. O controle é feito por empresa, ano e mês.

## Como Funciona

### 1. Liberação/Bloqueio da Correção
- **Botão "Liberar Correção do Ponto" habilitado**: No Portal do Funcionário, o funcionário consegue editar os registros de ponto
- **Botão "Liberar Correção do Ponto" desabilitado**: No Portal do Funcionário, o funcionário NÃO consegue editar os registros de ponto

### 2. Interface de Controle
- Acesse: **RH > Gestão de Ponto Eletrônico > Aba "Controle de Correção"**
- Selecione o ano e mês desejado
- Use o switch ou botões para liberar/bloquear a correção
- Visualize o histórico de configurações

### 3. Portal do Funcionário
- **Aba "Registro"**: Para registrar ponto em tempo real (sempre disponível)
- **Aba "Correção"**: Para editar registros passados (apenas quando liberada)
- Status visual indica se a correção está liberada ou bloqueada

## Estrutura do Banco de Dados

### Tabela: `rh.time_record_correction_control`
```sql
- id: UUID (chave primária)
- company_id: UUID (referência à empresa)
- year: INTEGER (ano de referência)
- month: INTEGER (mês de referência, 1-12)
- correction_enabled: BOOLEAN (se permite correção)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- created_by: UUID (usuário que criou)
- updated_by: UUID (usuário que atualizou)
```

### Funções RPC
- `get_correction_status(company_uuid, target_year, target_month)`: Retorna se a correção está liberada
- `set_correction_status(company_uuid, target_year, target_month, enabled, user_uuid)`: Define o status de liberação

## Configuração Inicial

1. **Execute o script SQL**:
   ```bash
   # Execute o arquivo create_time_record_correction_control.sql no Supabase
   ```

2. **Verifique as permissões RLS**:
   - As políticas de RLS estão configuradas para permitir acesso baseado na empresa do usuário
   - Apenas usuários autenticados da empresa podem visualizar e modificar as configurações

## Uso da Funcionalidade

### Para Administradores RH:

1. Acesse **RH > Gestão de Ponto Eletrônico**
2. Clique na aba **"Controle de Correção"**
3. Selecione o **ano** e **mês** desejado
4. Use o **switch** ou **botões** para liberar/bloquear
5. Visualize o **histórico** de configurações

### Para Funcionários:

1. Acesse **Portal do Colaborador > Registro de Ponto**
2. Verifique o **status** de liberação no topo da página
3. Use a aba **"Registro"** para registrar ponto em tempo real
4. Use a aba **"Correção"** (quando liberada) para editar registros passados

## Recursos Implementados

### ✅ Interface de Controle
- Seletor de ano e mês
- Switch para liberar/bloquear
- Botões de ação rápida
- Histórico de configurações
- Status visual claro

### ✅ Portal do Funcionário
- Verificação automática do status
- Aba de correção condicional
- Formulário de edição de horários
- Seletor de data para correção
- Feedback visual do status

### ✅ Hooks e Integração
- `useTimeRecordCorrectionControl`: Para gerenciar configurações
- `useEmployeeCorrectionStatus`: Para verificar status no portal
- Integração com Supabase RPC
- Cache e invalidação automática

### ✅ Segurança
- RLS (Row Level Security) configurado
- Controle por empresa
- Auditoria de alterações
- Validação de permissões

## Fluxo de Trabalho Recomendado

1. **Início do mês**: Administrador libera a correção para o mês anterior
2. **Período de correção**: Funcionários podem editar registros do mês anterior
3. **Fechamento**: Administrador bloqueia a correção após o período
4. **Processamento**: RH processa os dados finais para folha de pagamento

## Observações Importantes

- A correção é **bloqueada por padrão** (correction_enabled = false)
- O controle é **por empresa**, permitindo configurações diferentes
- As alterações são **auditadas** automaticamente
- O status é **verificado em tempo real** no Portal do Funcionário
- Apenas registros de **datas passadas** podem ser corrigidos
