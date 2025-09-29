# Sistema de Locação de Equipamentos - RH

## Visão Geral

O sistema de locação de equipamentos permite que funcionários "aluguem" seus equipamentos pessoais (veículos, computadores, celulares, etc.) para a empresa, recebendo um valor mensal em troca.

## Funcionalidades

### 1. Gestão de Equipamentos
- **Cadastro de equipamentos**: Veículos, computadores, celulares e outros equipamentos
- **Informações detalhadas**: Marca, modelo, número de série, placa (para veículos)
- **Valor mensal**: Definição do valor a ser pago mensalmente
- **Período de locação**: Data de início e fim (opcional)
- **Status**: Ativo, inativo ou encerrado

### 2. Controle de Pagamentos
- **Geração automática**: Pagamentos mensais são gerados automaticamente
- **Status de pagamento**: Pendente, pago ou cancelado
- **Métodos de pagamento**: Transferência bancária, PIX, dinheiro, cheque
- **Referência**: Campo para anotar chave PIX, número da transferência, etc.

### 3. Relatórios e Estatísticas
- **Dashboard com métricas**: Total de equipamentos, valor mensal, equipamentos por tipo
- **Filtros avançados**: Por funcionário, tipo de equipamento, status, período
- **Histórico completo**: Todos os pagamentos e movimentações

## Estrutura do Banco de Dados

### Tabelas Principais

#### `rh.equipment_rentals`
- Armazena informações dos equipamentos locados
- Campos: tipo, nome, marca, modelo, valor mensal, datas, status

#### `rh.equipment_rental_payments`
- Controla os pagamentos mensais
- Campos: mês/ano, valor, status, método de pagamento, referência

### Relacionamentos
- `rh.equipment_rentals` → `rh.employees` (funcionário proprietário)
- `rh.equipment_rental_payments` → `rh.equipment_rentals` (equipamento)
- Ambas → `core.companies` (empresa)

## Como Usar

### 1. Configuração Inicial

1. **Execute o script SQL** no Supabase:
   ```sql
   -- Execute o arquivo create_equipment_rental_tables.sql
   -- As tabelas serão criadas no schema 'rh'
   ```

2. **Configure as permissões** no Supabase:
   - As políticas RLS já estão configuradas
   - Usuários só veem dados da sua empresa
   - Tabelas criadas no schema `rh` conforme padrão do sistema

### 2. Cadastro de Equipamentos

1. Acesse **RH → Locação de Equipamentos**
2. Clique em **"Novo Equipamento"**
3. Preencha os dados:
   - **Funcionário**: Selecione o funcionário proprietário
   - **Tipo**: Veículo, computador, celular ou outros
   - **Nome**: Nome descritivo do equipamento
   - **Marca/Modelo**: Informações do fabricante
   - **Valor Mensal**: Valor a ser pago mensalmente
   - **Data de Início**: Quando a locação começa
   - **Data de Fim**: Opcional, quando termina

### 3. Controle de Pagamentos

1. Na aba **"Pagamentos"** você verá todos os pagamentos
2. Os pagamentos são gerados automaticamente para cada mês
3. Para marcar como pago:
   - Clique no pagamento
   - Altere o status para "Pago"
   - Informe o método de pagamento e referência

### 4. Relatórios

1. Use os **filtros** para encontrar equipamentos específicos
2. Visualize **estatísticas** no dashboard
3. Exporte dados para análise (funcionalidade futura)

## Tipos de Equipamentos Suportados

### Veículos
- Campos específicos: placa, marca, modelo
- Ideal para carros, motos, caminhões

### Computadores
- Campos: marca, modelo, número de série
- Notebooks, desktops, tablets

### Celulares
- Campos: marca, modelo, número de série
- Smartphones, tablets

### Outros
- Campos genéricos
- Equipamentos diversos

## Status dos Equipamentos

- **Ativo**: Equipamento em uso, gerando pagamentos
- **Inativo**: Temporariamente pausado
- **Encerrado**: Locação finalizada

## Status dos Pagamentos

- **Pendente**: Aguardando pagamento
- **Pago**: Pagamento realizado
- **Cancelado**: Pagamento cancelado

## Segurança

- **RLS (Row Level Security)**: Usuários só veem dados da sua empresa
- **Validações**: Valores não podem ser negativos
- **Auditoria**: Campos de criação e atualização

## Próximas Funcionalidades

- [ ] Relatórios em PDF/Excel
- [ ] Notificações de vencimento
- [ ] Integração com folha de pagamento
- [ ] Dashboard com gráficos
- [ ] Aprovação de equipamentos
- [ ] Contratos de locação

## Suporte

Para dúvidas ou problemas:
1. Verifique se as tabelas foram criadas corretamente
2. Confirme as permissões RLS
3. Verifique os logs do Supabase
4. Entre em contato com o suporte técnico

---

**Versão**: 1.0  
**Data**: Janeiro 2025  
**Autor**: Sistema de RH - Fiber Optic Maintainer Hub
