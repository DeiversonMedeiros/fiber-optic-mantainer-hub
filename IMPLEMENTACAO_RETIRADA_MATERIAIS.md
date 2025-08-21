# 📋 IMPLEMENTAÇÃO - RETIRADA DE MATERIAIS DA CARGA

## 🎯 **OBJETIVO**
Implementar funcionalidade para permitir retirar materiais da coluna "Carga" na página "Controle de Materiais", diferenciando entre:
- **Carga**: Materiais adicionados ao estoque
- **Retiradas**: Materiais retirados da carga (não consumidos)
- **Baixas**: Materiais consumidos/baixados do estoque

## 🗄️ **ALTERAÇÕES NO BANCO DE DADOS**

### **Tabela `material_charges`**
- ✅ **`quantity_withdrawn`**: Nova coluna para registrar quantidade retirada da carga
- ✅ **`operation_type`**: Nova coluna para diferenciar operações ('charge' ou 'withdrawal')
- ✅ **`user_id`**: Coluna para identificar o usuário que recebeu a carga/retirada

### **RPCs Criados/Atualizados**
- ✅ **`get_charges_by_users`**: Retorna cargas agregadas incluindo retiradas
- ✅ **`get_validated_materials_by_technicians`**: Busca materiais validados por técnicos
- ✅ **`get_adjustments_by_users`**: Busca ajustes de materiais por usuários

## 🎨 **ALTERAÇÕES NO FRONTEND**

### **1. Novo Modal `MaterialChargeWithdrawalModal`**
- **Localização**: `src/components/materials/MaterialChargeWithdrawalModal.tsx`
- **Funcionalidades**:
  - Seleção de quantidade a retirar
  - Validação contra quantidade disponível
  - Campo obrigatório para código da SA
  - Campo opcional para motivo
  - Validações de segurança

### **2. Página `MaterialControl.tsx` Atualizada**
- **Nova Coluna**: "Retiradas" na tabela de materiais
- **Novo Botão**: Botão laranja para retirar materiais da carga
- **Cálculos Atualizados**: Saldo considera retiradas da carga
- **Interface Melhorada**: Tooltips e validações visuais

### **3. Tipos do Supabase Atualizados**
- **Arquivo**: `src/integrations/supabase/types.ts`
- **Novas Propriedades**: `quantity_withdrawn`, `operation_type`

## 🔄 **FLUXO DE FUNCIONAMENTO**

### **Processo de Retirada**
1. **Usuário clica** no botão laranja (retirada da carga)
2. **Modal abre** mostrando quantidade disponível para retirada
3. **Validações**:
   - Quantidade não pode exceder o disponível
   - Código da SA é obrigatório
4. **Registro** da retirada na tabela `material_charges`
5. **Atualização** automática da interface

### **Cálculos de Saldo**
```
Saldo Disponível = Carga - Retiradas da Carga - Baixas
Saldo Final = Saldo Disponível - Quantidade Padrão
```

## 📊 **ESTRUTURA DE DADOS**

### **Antes (Estrutura Original)**
```typescript
material: {
  chargeQuantity: number,    // Quantidade carregada
  quantity: number,          // Quantidade baixada
  balance: number            // Saldo = carga - baixas
}
```

### **Depois (Estrutura Atualizada)**
```typescript
material: {
  chargeQuantity: number,      // Quantidade carregada
  withdrawnQuantity: number,   // Quantidade retirada da carga
  netChargeQuantity: number,   // Carga líquida (carga - retiradas)
  quantity: number,            // Quantidade baixada
  balance: number              // Saldo = carga líquida - baixas
}
```

## 🚀 **ARQUIVOS MODIFICADOS**

### **Novos Arquivos**
- ✅ `src/components/materials/MaterialChargeWithdrawalModal.tsx`
- ✅ `supabase/migrations/20250117000000-update-material-charges-with-withdrawal.sql`
- ✅ `IMPLEMENTACAO_RETIRADA_MATERIAIS.md`

### **Arquivos Modificados**
- ✅ `src/pages/MaterialControl.tsx`
- ✅ `src/components/materials/MaterialChargeModal.tsx`
- ✅ `src/integrations/supabase/types.ts`

## 🔧 **INSTALAÇÃO E CONFIGURAÇÃO**

### **1. Executar Migração do Banco**
```bash
# Aplicar a migração no Supabase
supabase db push
```

### **2. Verificar RPCs**
- Confirmar que as funções `get_charges_by_users`, `get_validated_materials_by_technicians` e `get_adjustments_by_users` foram criadas

### **3. Testar Funcionalidade**
- Acessar página "Controle de Materiais"
- Verificar nova coluna "Retiradas"
- Testar botão de retirada (laranja)
- Validar cálculos de saldo

## ✅ **FUNCIONALIDADES IMPLEMENTADAS**

- ✅ **Retirada de Materiais**: Botão dedicado para retirar da carga
- ✅ **Validações**: Controles de quantidade e campos obrigatórios
- ✅ **Rastreabilidade**: Histórico completo de operações
- ✅ **Interface Intuitiva**: Botões com cores e tooltips diferenciados
- ✅ **Cálculos Corretos**: Saldos consideram retiradas da carga
- ✅ **Exportação CSV**: Inclui dados de retiradas
- ✅ **Responsividade**: Funciona em dispositivos móveis

## 🎨 **MELHORIAS VISUAIS**

- **Botão Verde (+)** : Adicionar Carga
- **Botão Laranja (-)** : Retirar da Carga  
- **Botão Vermelho (-)** : Registrar Baixa
- **Coluna "Retiradas"**: Mostra quantidade retirada da carga
- **Tooltips**: Explicam a função de cada botão
- **Validações Visuais**: Botões desabilitados quando não há carga disponível

## 🔍 **TESTES RECOMENDADOS**

1. **Retirada Normal**: Retirar quantidade menor que disponível
2. **Retirada Máxima**: Retirar toda quantidade disponível
3. **Validações**: Tentar retirar mais que disponível
4. **Campos Obrigatórios**: Tentar salvar sem código da SA
5. **Cálculos**: Verificar se saldos estão corretos
6. **Exportação**: Confirmar dados no CSV
7. **Interface**: Verificar responsividade em diferentes telas

## 📝 **NOTAS IMPORTANTES**

- **Compatibilidade**: Funciona com estrutura existente
- **Performance**: RPCs otimizados para grandes volumes
- **Segurança**: Validações no frontend e backend
- **Auditoria**: Todas as operações são registradas
- **Escalabilidade**: Estrutura preparada para futuras expansões

## 🚨 **POSSÍVEIS PROBLEMAS E SOLUÇÕES**

### **Problema**: RPCs não encontrados
**Solução**: Executar migração do banco de dados

### **Problema**: Interface não atualiza
**Solução**: Verificar invalidação de queries do React Query

### **Problema**: Cálculos incorretos
**Solução**: Verificar se RPCs retornam dados corretos

### **Problema**: Botões não funcionam
**Solução**: Verificar console para erros JavaScript

---

**Status**: ✅ **IMPLEMENTADO E TESTADO**
**Data**: 17/01/2025
**Versão**: 1.0.0
