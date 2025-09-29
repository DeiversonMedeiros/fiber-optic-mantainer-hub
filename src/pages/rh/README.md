# 🏢 Sistema de Recursos Humanos (RH)

Este módulo implementa um sistema completo de gestão de recursos humanos com funcionalidades para gerenciar funcionários, cargos e controle de ponto eletrônico.

## 📋 Funcionalidades Implementadas

### 1. **Dashboard RH** (`/rh`)
- Visão geral de todas as métricas RH
- Estatísticas em tempo real
- Ações rápidas para operações comuns
- Navegação integrada para todos os módulos

### 2. **Gestão de Funcionários** (`/rh/employees`)
- Cadastro completo de funcionários
- Edição e atualização de dados
- Controle de status (ativo/inativo)
- Visualização detalhada de informações
- Estatísticas e métricas

### 3. **Gestão de Cargos** (`/rh/positions`) - *Em desenvolvimento*
- Criação e edição de cargos
- Definição de níveis hierárquicos
- Configuração de salários base
- Controle de carga horária
- Requisitos e responsabilidades

### 4. **Controle de Ponto Eletrônico** (`/rh/time-records`)
- Registro de entrada e saída
- Aprovação/rejeição de registros
- Controle de horas trabalhadas
- Gestão de horas extras
- Relatórios e estatísticas

### 5. **Gestão de Escalas de Trabalho** (`/rh/work-schedules`)
- Configuração de escalas padrão
- Definição de turnos e horários
- Associação de funcionários às escalas
- Controle de carga horária semanal

### 6. **Gestão de Benefícios** (`/rh/benefits`)
- Catálogo de benefícios disponíveis
- Associação de benefícios aos funcionários
- Controle de custos e valores
- Relatórios de benefícios por funcionário

### 7. **Folha de Pagamento** (`/rh/payroll`)
- Geração de folhas mensais
- Cálculo de proventos e descontos
- Configurações de regime de horas extras
- Relatórios de custos e evolução salarial

### 8. **Gestão de Férias e Licenças** (`/rh/vacations`)
- Solicitações de férias
- Controle de períodos aquisitivos
- Gestão de licenças médicas e outras
- Aprovação e controle de ausências

### 9. **Gestão de Atestados Médicos** (`/rh/medical-certificates`)
- Registro de atestados médicos
- Classificação Internacional de Doenças (CID)
- Controle de dias de ausência
- Relatórios por funcionário e período

### 10. **Gestão do eSocial** (`/rh/esocial`)
- Eventos do eSocial (S-2200, S-1200, etc.)
- Validações automáticas de compliance
- Controle de status de envio
- Relatórios de conformidade

### 11. **Recrutamento e Seleção** (`/rh/recruitment`)
- Criação e gestão de vagas
- Controle de candidatos
- Fases do processo seletivo
- Métricas de recrutamento

### 12. **Treinamento e Desenvolvimento** (`/rh/training`)
- Gestão de treinamentos
- Controle de participantes
- Metodologias de aprendizagem
- Avaliação de efetividade

## 🚀 Como Usar

### Navegação
1. Acesse o menu lateral e clique em "Recursos Humanos"
2. Use o dashboard principal para navegar entre os módulos
3. Cada módulo tem sua própria página com funcionalidades específicas

### Estrutura de URLs
- `/rh` - Dashboard principal
- `/rh/employees` - Gestão de funcionários
- `/rh/positions` - Gestão de cargos (em desenvolvimento)
- `/rh/time-records` - Controle de ponto
- `/rh/work-schedules` - Escalas de trabalho
- `/rh/benefits` - Gestão de benefícios
- `/rh/payroll` - Folha de pagamento
- `/rh/vacations` - Férias e licenças
- `/rh/medical-certificates` - Atestados médicos
- `/rh/esocial` - Gestão do eSocial
- `/rh/recruitment` - Recrutamento e seleção
- `/rh/training` - Treinamento e desenvolvimento

## 🛠️ Tecnologias Utilizadas

- **React** com TypeScript
- **React Query** para gerenciamento de estado
- **React Hook Form** para formulários
- **Zod** para validação de dados
- **Supabase** como backend
- **shadcn/ui** para componentes de interface
- **Lucide React** para ícones
- **date-fns** para manipulação de datas

## 📁 Estrutura de Arquivos

```
src/
├── components/rh/           # Componentes específicos do RH
│   ├── index.ts            # Exportações centralizadas
│   ├── DataTable.tsx       # Tabela genérica reutilizável
│   ├── FormModal.tsx       # Modal genérico para formulários
│   ├── TableActions.tsx    # Ações padronizadas para tabelas
│   ├── EmployeeTable.tsx   # Tabela de funcionários
│   ├── EmployeeForm.tsx    # Formulário de funcionários
│   ├── PositionTable.tsx   # Tabela de cargos
│   ├── PositionForm.tsx    # Formulário de cargos
│   ├── TimeRecordTable.tsx # Tabela de registros de ponto
│   ├── TimeRecordForm.tsx  # Formulário de registros
│   ├── EmployeeManagement.tsx    # Gerenciamento de funcionários
│   ├── PositionManagement.tsx    # Gerenciamento de cargos (em desenvolvimento)
│   ├── TimeRecordManagement.tsx  # Gerenciamento de ponto
│   └── HRDashboard.tsx     # Dashboard principal
├── hooks/rh/               # Hooks React Query para RH
│   ├── index.ts            # Exportações centralizadas
│   ├── useEmployees.ts     # Hook para funcionários
│   ├── usePositions.ts     # Hook para cargos
│   ├── useTimeRecords.ts   # Hook para registros de ponto
│   └── ...                 # Outros hooks específicos
├── pages/                  # Páginas da aplicação
│   ├── RHDashboard.tsx     # Página principal do RH
│   ├── EmployeeManagement.tsx    # Página de funcionários
│   ├── PositionManagement.tsx    # Página de cargos (em desenvolvimento)
│   └── TimeRecordManagement.tsx  # Página de ponto
└── integrations/supabase/  # Integração com banco de dados
    └── rh-types.ts         # Tipos TypeScript para RH
```

## 🔧 Configuração

### Pré-requisitos
- Usuário deve estar autenticado
- Usuário deve estar associado a uma empresa ativa
- Empresa deve ter o módulo RH habilitado

### Permissões
O sistema verifica automaticamente:
- Status da empresa (deve ser 'active')
- Associação do usuário com a empresa
- Validação de dados antes de operações

## 📊 Componentes Principais

### DataTable
Tabela genérica com:
- Busca e filtros
- Ordenação por colunas
- Paginação
- Exportação de dados
- Ações personalizáveis

### FormModal
Modal genérico para formulários com:
- Layout responsivo
- Validação integrada
- Estados de loading
- Diferentes tamanhos

### TableActions
Ações padronizadas para tabelas:
- Visualizar detalhes
- Editar registros
- Excluir com confirmação
- Alterar status
- Ações específicas por entidade

## 🎯 Próximos Passos

### Funcionalidades Planejadas
- [ ] Gestão de férias e ausências
- [ ] Folha de pagamento
- [ ] Benefícios e vantagens
- [ ] Treinamentos e capacitações
- [ ] Avaliação de desempenho
- [ ] Relatórios avançados
- [ ] Dashboard com gráficos
- [ ] Notificações e alertas

### Melhorias Técnicas
- [ ] Cache otimizado para React Query
- [ ] Lazy loading de componentes
- [ ] Testes unitários e de integração
- [ ] Documentação de API
- [ ] Sistema de auditoria
- [ ] Backup automático de dados

## 🐛 Solução de Problemas

### Erro: "Usuário não está associado a uma empresa"
- Verifique se o usuário tem `company_id` válido
- Confirme se a empresa existe e está ativa

### Erro: "Empresa inativa"
- Entre em contato com o administrador
- Verifique o status da empresa no banco de dados

### Problemas de Performance
- Verifique se os hooks estão usando cache adequadamente
- Considere implementar paginação para grandes volumes de dados

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console do navegador
2. Confirme as permissões do usuário
3. Valide a configuração da empresa
4. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ para transformar o sistema em um ERP completo**
