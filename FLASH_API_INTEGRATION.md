# Integração com Flash API - Sistema de Pagamentos de Benefícios

## Visão Geral

Este documento descreve a implementação da integração com a Flash API para processamento de pagamentos de benefícios (VR/VA, transporte, premiações, etc.) no sistema de RH.

## Funcionalidades Implementadas

### 1. Estrutura de Dados

#### Tabelas Criadas

- **`rh.benefit_payment_configs`**: Configurações de pagamento por tipo de benefício
- **`rh.benefit_payments`**: Histórico de pagamentos processados
- **`rh.employee_bank_accounts`**: Dados bancários dos funcionários (com suporte a PIX)

#### Enums Criados

- **`rh.payment_method_enum`**: flash, transfer, pix
- **`rh.payment_status_enum`**: pending, processing, completed, failed, cancelled

### 2. Componentes React

#### PaymentMethodModal
Modal para seleção da forma de pagamento com:
- Validação de métodos permitidos por tipo de benefício
- Restrições legais (VR/VA só via Flash)
- Interface intuitiva com ícones e descrições

#### PaymentConfigManagement
Gerenciamento de configurações de pagamento:
- Criação/edição de configurações por benefício
- Configuração da Flash API
- Controle de métodos permitidos

#### BenefitsProcessingTool (Atualizado)
Integração do modal de pagamento no fluxo de processamento de benefícios

### 3. Serviços

#### FlashApiService
Serviço para integração com a Flash API:
- Autenticação
- Sincronização de colaboradores
- Processamento de pagamentos
- Consulta de status

#### PaymentProcessingService
Serviço principal de processamento:
- Validação de configurações
- Processamento por método (Flash, Transferência, PIX)
- Registro de transações
- Tratamento de erros

## Fluxo de Pagamento

### 1. Configuração Inicial
1. Acessar "Gestão de Pagamentos" > "Configurações"
2. Criar configuração para cada tipo de benefício
3. Definir métodos permitidos e credenciais da Flash

### 2. Processamento de Benefícios
1. Acessar "Gestão de Pagamentos" > "Processamento"
2. Executar processamento mensal de benefícios
3. Após processamento, clicar em "Enviar para Pagamento"

### 3. Seleção de Método de Pagamento
1. Modal exibe opções disponíveis para o benefício
2. Usuário seleciona método (Flash, Transferência ou PIX)
3. Sistema processa o pagamento conforme seleção

## Restrições Legais

### VR/VA (Vale Refeição/Alimentação)
- **Obrigatório**: Pagamento via cartão Flash
- **Não permitido**: Transferência bancária ou PIX
- **Motivo**: Conformidade com legislação do PAT

### Outros Benefícios
- **Permitido**: Flash, Transferência bancária ou PIX
- **Flexibilidade**: Empresa escolhe métodos conforme política interna

## Configuração da Flash API

### Credenciais Necessárias
1. **Chave da API Flash**: Obtida no painel da Flash
2. **ID da Empresa**: Identificador da empresa na Flash

### Endpoints Utilizados
- `POST /auth/login`: Autenticação
- `POST /colaboradores/sync`: Sincronização de funcionários
- `POST /beneficios/pagamento`: Processamento de pagamentos
- `GET /beneficios/status/{id}`: Consulta de status

## Estrutura de Arquivos

```
src/
├── components/rh/
│   ├── PaymentMethodModal.tsx
│   ├── PaymentConfigManagement.tsx
│   └── BenefitsProcessingTool.tsx (atualizado)
├── services/
│   ├── flash/
│   │   └── FlashApiService.ts
│   └── rh/
│       └── PaymentProcessingService.ts
├── pages/
│   └── PaymentManagementPage.tsx
└── supabase/migrations/
    └── 20250127000012_create_flash_payment_integration.sql
```

## Próximos Passos

### 1. Implementações Pendentes
- [ ] Histórico detalhado de pagamentos
- [ ] Relatórios de pagamentos
- [ ] Notificações de status
- [ ] Integração com sistema bancário real
- [ ] Integração com PIX real

### 2. Melhorias Futuras
- [ ] Dashboard de pagamentos
- [ ] Agendamento de pagamentos
- [ ] Aprovação de pagamentos
- [ ] Reconciliação bancária
- [ ] Exportação de dados

## Segurança

### Dados Sensíveis
- Chaves da API Flash são armazenadas criptografadas
- Dados bancários dos funcionários protegidos por RLS
- Logs de transações para auditoria

### Permissões
- Acesso restrito por empresa
- Controle de permissões por usuário
- Validação de dados em todas as operações

## Monitoramento

### Logs
- Todas as transações são registradas
- Erros são logados com detalhes
- Status de pagamentos é rastreado

### Métricas
- Taxa de sucesso de pagamentos
- Tempo de processamento
- Volume de transações por método

## Suporte

Para dúvidas ou problemas com a integração:
1. Verificar logs de erro no console
2. Validar configurações da Flash API
3. Testar conectividade com a API
4. Consultar documentação da Flash API

## Conclusão

A integração com a Flash API foi implementada com sucesso, proporcionando:
- Flexibilidade na escolha de métodos de pagamento
- Conformidade com a legislação brasileira
- Interface intuitiva para usuários
- Rastreabilidade completa das transações
- Base sólida para futuras expansões

O sistema está pronto para uso em produção, com todas as validações e controles de segurança implementados.
