# Correção de Ponto com Calendário Mensal

## Visão Geral

A funcionalidade de correção de ponto foi completamente reformulada para oferecer uma experiência mais intuitiva e visual através de um calendário mensal. Os funcionários podem agora visualizar todos os seus registros de ponto do mês e editar diretamente as marcações que precisam de correção.

## Principais Melhorias

### 🗓️ **Calendário Visual Mensal**
- Visualização de todos os dias do mês em formato de calendário
- Status visual de cada dia (completo, parcial, incompleto, sem registro)
- Indicadores de horários de entrada/saída e horas trabalhadas
- Destaque para o dia atual

### ✏️ **Edição Direta nos Dias**
- Clique em qualquer dia para editar ou criar registro
- Botões de edição/criação em cada dia do calendário
- Modal intuitivo para edição de horários
- Integração com motivos de atraso/justificativas

### 📝 **Sistema de Justificativas**
- Integração com tabela `delay_reasons` para motivos padronizados
- Campo de descrição livre para justificativas detalhadas
- Categorização de motivos (atraso, ausência, etc.)
- Validação de campos obrigatórios

## Estrutura dos Componentes

### 1. **MonthlyTimeRecordsCalendar**
- Componente principal do calendário
- Exibe todos os dias do mês com registros
- Gerencia cliques e abertura do modal de edição
- Calcula e exibe horas trabalhadas

### 2. **TimeRecordEditModal**
- Modal para edição/criação de registros
- Formulário completo com todos os campos de horário
- Integração com motivos de atraso
- Validação e salvamento

### 3. **useMonthlyTimeRecords**
- Hook para buscar registros do mês
- Busca motivos de atraso disponíveis
- Cache e invalidação automática

## Interface do Usuário

### Portal do Colaborador - Aba Correção

1. **Seletor de Mês/Ano**
   - Dropdown para selecionar ano (últimos 3 anos)
   - Dropdown para selecionar mês
   - Atualização automática do calendário

2. **Calendário Mensal**
   - Grade 7x6 (dias da semana x semanas)
   - Cada dia mostra:
     - Número do dia
     - Status do registro (ícone + badge)
     - Horários de entrada/saída
     - Total de horas trabalhadas
     - Botão de edição (quando liberado)

3. **Modal de Edição**
   - **Horários de Trabalho**: Entrada e Saída
   - **Intervalo**: Início e Fim
   - **Horas Adicionais**: Início e Fim
   - **Justificativa**: Motivo + Descrição
   - **Resumo**: Cálculo automático de horas

## Status dos Registros

### 🟢 **Completo**
- Entrada e saída registradas
- Badge verde "Completo"
- Ícone de check

### 🟡 **Parcial**
- Apenas entrada registrada
- Badge amarelo "Parcial"
- Ícone de alerta

### 🔴 **Incompleto**
- Registro existente mas sem entrada
- Badge vermelho "Incompleto"
- Ícone de X

### ⚪ **Sem Registro**
- Nenhum registro para o dia
- Badge cinza "Sem registro"
- Ícone de relógio

## Integração com Banco de Dados

### Tabelas Utilizadas

1. **`rh.time_records`**
   - Armazena os registros de ponto
   - Campos: entrada, saída, intervalos, horas adicionais
   - Campo `tipo` = 'correcao' para registros editados

2. **`rh.delay_reasons`**
   - Motivos padronizados para justificativas
   - Categorias: atraso, ausência, etc.
   - Campos: código, descrição, categoria

3. **`rh.time_record_correction_control`**
   - Controla liberação de correção por mês
   - Verificação automática de permissão

### Campos de Justificativa

- **`delay_reason_id`**: Referência ao motivo padronizado
- **`justificativa`**: Descrição livre da correção
- **`tipo`**: 'correcao' para registros editados

## Fluxo de Uso

### Para o Funcionário:

1. **Acessar Portal do Colaborador**
   - Ir para "Registro de Ponto"
   - Clicar na aba "Correção"

2. **Selecionar Mês**
   - Escolher ano e mês desejado
   - Calendário é atualizado automaticamente

3. **Visualizar Registros**
   - Ver status de todos os dias do mês
   - Identificar dias que precisam de correção

4. **Editar Registro**
   - Clicar no dia desejado
   - Preencher horários corretos
   - Selecionar motivo da correção
   - Descrever justificativa
   - Salvar alterações

### Para o Administrador RH:

1. **Liberar Correção**
   - Acessar "Gestão de Ponto Eletrônico"
   - Aba "Controle de Correção"
   - Selecionar mês e liberar

2. **Monitorar Correções**
   - Ver histórico de alterações
   - Aprovar justificativas se necessário

## Recursos Técnicos

### ✅ **Responsividade**
- Calendário adaptável para diferentes telas
- Modal responsivo com scroll
- Layout otimizado para mobile

### ✅ **Performance**
- Cache inteligente de dados
- Invalidação seletiva de queries
- Carregamento otimizado por mês

### ✅ **Validação**
- Campos obrigatórios
- Validação de horários
- Verificação de permissões

### ✅ **Acessibilidade**
- Navegação por teclado
- Indicadores visuais claros
- Textos descritivos

## Configuração Necessária

### 1. **Motivos de Atraso**
Certifique-se de que a tabela `delay_reasons` possui registros:
```sql
INSERT INTO rh.delay_reasons (codigo, descricao, categoria, company_id) VALUES
('ATR001', 'Atraso por trânsito', 'Atraso', 'company-uuid'),
('ATR002', 'Atraso por motivos pessoais', 'Atraso', 'company-uuid'),
('AUS001', 'Ausência por consulta médica', 'Ausência', 'company-uuid');
```

### 2. **Permissões RLS**
As políticas já estão configuradas para:
- Funcionários veem apenas seus próprios registros
- Administradores podem gerenciar liberações
- Controle por empresa

## Benefícios da Nova Interface

1. **Visão Completa**: Funcionário vê todo o mês de uma vez
2. **Edição Intuitiva**: Clique direto no dia para editar
3. **Justificativas Estruturadas**: Motivos padronizados + descrição livre
4. **Controle Granular**: Administrador libera por mês específico
5. **Auditoria Completa**: Todas as alterações são rastreadas
6. **Interface Moderna**: Calendário visual e responsivo

A nova funcionalidade transforma a correção de ponto de uma tarefa complexa em uma experiência visual e intuitiva, melhorando significativamente a usabilidade para os funcionários e o controle para os administradores.
