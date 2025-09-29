# Teste do Sistema de Desconto por Ausência na Locação de Equipamentos

## Exemplo de Cálculo

### Cenário
- **Funcionário**: João Silva
- **Equipamento**: Notebook Dell (ID: equip-001)
- **Valor mensal da locação**: R$ 100,00
- **Período**: Agosto 2024
- **Dias de ausência**: 2 dias (15 e 16 de agosto)

### Cálculo Manual
1. **Valor diário**: R$ 100,00 ÷ 30 dias = R$ 3,33
2. **Dias de ausência**: 2 dias
3. **Desconto total**: 2 × R$ 3,33 = R$ 6,66
4. **Valor final**: R$ 100,00 - R$ 6,66 = R$ 93,34

### Cálculo via Sistema
```typescript
// Exemplo de uso do serviço
const absenceService = new EquipmentRentalAbsenceService(companyId);

// Calcular desconto para um equipamento específico
const calculation = await absenceService.calculateEquipmentAbsenceDiscount(
  'equip-001',
  'employee-123',
  '2024-08',
  100.00
);

console.log('Resultado:', {
  valorOriginal: calculation.monthly_value,      // R$ 100,00
  valorDiario: calculation.daily_value,          // R$ 3,33
  diasAusencia: calculation.total_absence_days, // 2
  descontoTotal: calculation.total_discount,     // R$ 6,66
  valorFinal: calculation.final_value           // R$ 93,34
});
```

## Tipos de Ausência Considerados

### 1. Sem Registro de Ponto
- **Tipo**: `no_time_record`
- **Descrição**: "Sem registro de ponto"
- **Justificada**: Não
- **Desconto**: Sim

### 2. Atestado Médico
- **Tipo**: `medical_certificate`
- **Descrição**: "Atestado médico - [tipo]"
- **Justificada**: Sim
- **Desconto**: Sim

### 3. Férias
- **Tipo**: `vacation`
- **Descrição**: "Férias"
- **Justificada**: Sim
- **Desconto**: Sim

### 4. Licença
- **Tipo**: `license`
- **Descrição**: "Licença"
- **Justificada**: Sim
- **Desconto**: Sim

## Funcionalidades Implementadas

### 1. Serviço de Cálculo (`EquipmentRentalAbsenceService`)
- ✅ Cálculo diário proporcional (valor/30 dias)
- ✅ Identificação de dias de ausência
- ✅ Cálculo de desconto por ausência
- ✅ Integração com funções RPC do Supabase
- ✅ Geração de relatórios

### 2. Hook React (`useEquipmentRentalAbsence`)
- ✅ Estado de loading e erro
- ✅ Funções para calcular descontos
- ✅ Geração de relatórios
- ✅ Limpeza de dados

### 3. Componente de Interface (`EquipmentRentalAbsenceDiscount`)
- ✅ Filtros por período, funcionário e tipo de equipamento
- ✅ Tabela de resultados com detalhes
- ✅ Cards de resumo (total original, desconto, valor final)
- ✅ Modal com detalhes de ausências
- ✅ Geração de relatórios

### 4. Funções RPC do Supabase
- ✅ `get_employee_absence_days()` - Busca dias de ausência
- ✅ `calculate_equipment_absence_discount()` - Calcula desconto para um equipamento
- ✅ `calculate_all_equipment_absence_discounts()` - Calcula para todos os equipamentos
- ✅ `generate_absence_discount_report()` - Gera relatório completo

## Integração com Sistema Existente

### 1. Página de Locação de Equipamentos
- ✅ Nova aba "Descontos por Ausência"
- ✅ Integração com componente de descontos
- ✅ Navegação entre abas

### 2. Sistema de Ausências
- ✅ Integração com `time_records` (registros de ponto)
- ✅ Integração com `medical_certificates` (atestados)
- ✅ Integração com `vacations` (férias)
- ✅ Preparado para `licenses` (licenças)

## Como Usar

### 1. Acessar a Funcionalidade
1. Navegue para "RH" → "Locação de Equipamentos"
2. Clique na aba "Descontos por Ausência"
3. Selecione o período desejado
4. Clique em "Calcular Descontos"

### 2. Visualizar Resultados
- **Cards de Resumo**: Valores totais e estatísticas
- **Tabela de Resultados**: Lista detalhada por equipamento
- **Modal de Detalhes**: Dias específicos de ausência

### 3. Gerar Relatório
1. Configure os filtros desejados
2. Clique em "Gerar Relatório"
3. O relatório será exibido no console (implementar exportação)

## Exemplo de Dados de Teste

```sql
-- Inserir equipamento de teste
INSERT INTO rh.equipment_rentals (
  id, company_id, employee_id, equipment_type, equipment_name, 
  monthly_value, start_date, status, created_by
) VALUES (
  'equip-001', 'company-123', 'employee-123', 'computer', 'Notebook Dell',
  100.00, '2024-01-01', 'active', 'admin'
);

-- Inserir atestado médico para teste
INSERT INTO rh.medical_certificates (
  id, company_id, employee_id, data_inicio, data_fim, 
  dias_afastamento, tipo, status, created_by
) VALUES (
  'cert-001', 'company-123', 'employee-123', '2024-08-15', '2024-08-16',
  2, 'doenca', 'aprovado', 'admin'
);
```

## Validações Implementadas

### 1. Validação de Dados
- ✅ Período no formato correto (YYYY-MM)
- ✅ Valores monetários positivos
- ✅ IDs válidos de equipamentos e funcionários

### 2. Validação de Negócio
- ✅ Apenas equipamentos ativos são considerados
- ✅ Apenas ausências aprovadas são consideradas
- ✅ Cálculo baseado em dias úteis (exclui fins de semana)

### 3. Validação de Performance
- ✅ Uso de funções RPC para cálculos otimizados
- ✅ Índices apropriados nas consultas
- ✅ Paginação de resultados quando necessário

## Próximos Passos

### 1. Melhorias de Interface
- [ ] Exportação de relatórios em PDF/Excel
- [ ] Gráficos de tendências de ausências
- [ ] Filtros avançados por tipo de ausência

### 2. Funcionalidades Adicionais
- [ ] Notificações de descontos aplicados
- [ ] Histórico de cálculos anteriores
- [ ] Aprovação de descontos por gestores

### 3. Integrações
- [ ] Integração com sistema de folha de pagamento
- [ ] Sincronização com sistema de ponto eletrônico
- [ ] API para sistemas externos


