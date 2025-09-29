# Sistema de Notificações de Férias

## 📋 Visão Geral

Este sistema implementa notificações automáticas para gerenciar férias dos colaboradores, garantindo conformidade com a legislação trabalhista que exige que os funcionários tirem férias antes de completar dois anos consecutivos sem sair de férias.

## 🎯 Funcionalidades

### ✅ Notificações Automáticas
- **Férias Disponíveis**: Notifica quando o funcionário completa 1 ano de trabalho
- **Férias Vencendo**: Alerta 3 meses antes do vencimento (2 anos sem férias)
- **Férias Vencidas**: Alerta crítico quando já passou do prazo limite

### 📊 Níveis de Criticidade
- **🟢 Low**: Informações gerais
- **🟡 Medium**: Férias disponíveis
- **🟠 High**: Férias vencendo (3 meses antes)
- **🔴 Critical**: Férias vencidas (obrigatório tirar imediatamente)

### 🔄 Execução Automática
- Verificações diárias automáticas
- Limpeza de notificações expiradas
- Renovação inteligente de alertas

## 🗄️ Estrutura do Banco de Dados

### Tabela Principal: `rh.vacations`
```sql
-- Já existe no seu banco
-- Campos relevantes: employee_id, data_inicio, data_fim, status
```

### Nova Tabela: `rh.vacation_notifications`
```sql
-- Armazena todas as notificações do sistema
-- Campos: notification_type, priority, due_date, days_remaining
```

## 🚀 Implementação

### Passo 1: Executar Scripts SQL
Execute os arquivos na seguinte ordem:

1. **`vacation_notifications_system.sql`**
   - Cria tabela de notificações
   - Implementa funções de cálculo
   - Configura triggers automáticos

2. **`vacation_notifications_cron_setup.sql`**
   - Configura execução automática
   - Cria funções de manutenção
   - Implementa views para dashboard

### Passo 2: Configurar Execução Automática

#### Opção A: pg_cron (se disponível no Supabase)
```sql
-- Habilitar extensão
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar execução diária às 08:00
SELECT cron.schedule(
    'verificacao-ferias-diaria',
    '0 8 * * *',
    'SELECT rh.executar_verificacoes_ferias_completa();'
);
```

#### Opção B: Cron Job Externo (Recomendado)
Configure um cron job no servidor para executar diariamente:
```bash
# Adicione ao crontab (crontab -e)
0 8 * * * curl -X POST 'https://seu-projeto.supabase.co/rest/v1/rpc/executar_verificacoes_ferias_completa' \
  -H "apikey: sua-api-key" \
  -H "Authorization: Bearer sua-api-key" \
  -H "Content-Type: application/json"
```

#### Opção C: Edge Function do Supabase
1. Crie uma Edge Function que execute `rh.executar_verificacoes_ferias_completa()`
2. Configure um cron job para chamar a Edge Function

### Passo 3: Testar o Sistema
```sql
-- Testar com dados reais
SELECT rh.testar_sistema_notificacoes();

-- Verificar status do sistema
SELECT * FROM rh.status_sistema_notificacoes();

-- Ver dashboard de férias
SELECT * FROM rh.dashboard_ferias;
```

## 📱 Como Usar

### Para Funcionários
```sql
-- Ver suas notificações
SELECT * FROM rh.buscar_notificacoes_ferias('seu-uuid');

-- Marcar notificação como lida
SELECT rh.marcar_notificacao_lida('uuid-da-notificacao');
```

### Para RH/Gestores
```sql
-- Relatório completo da empresa
SELECT * FROM rh.relatorio_ferias_empresa('uuid-da-empresa');

-- Alertas críticos
SELECT * FROM rh.alertas_ferias_criticos;

-- Dashboard resumido
SELECT * FROM rh.dashboard_ferias;
```

### Execução Manual
```sql
-- Gerar notificações para todos
SELECT rh.gerar_notificacoes_ferias();

-- Gerar para funcionário específico
SELECT rh.gerar_notificacoes_ferias('uuid-do-funcionario');

-- Limpar notificações expiradas
SELECT rh.limpar_notificacoes_expiradas();
```

## 🔧 Manutenção

### Monitoramento Regular
- Verifique logs do sistema: `SELECT * FROM rh.vacation_notifications WHERE notification_type = 'system_log'`
- Monitore alertas críticos: `SELECT * FROM rh.alertas_ferias_criticos`
- Acompanhe estatísticas: `SELECT * FROM rh.dashboard_ferias`

### Limpeza Periódica
O sistema limpa automaticamente notificações expiradas, mas você pode executar manualmente:
```sql
SELECT rh.limpar_notificacoes_expiradas();
```

### Ajustes de Configuração
- **Frequência de renovação**: Ajuste nos comentários das funções
- **Períodos de alerta**: Modifique as condições nas funções de cálculo
- **Tipos de notificação**: Adicione novos tipos conforme necessário

## 📊 Tipos de Notificação

| Tipo | Descrição | Frequência de Renovação |
|------|-----------|-------------------------|
| `ferias_disponivel` | Funcionário tem direito a férias | 30 dias |
| `ferias_vencendo` | Férias vencem em até 3 meses | 7 dias |
| `ferias_vencida` | Férias já vencidas | 1 dia |
| `ferias_aprovada` | Férias foram aprovadas | Não renova |
| `system_log` | Logs do sistema | 1 dia |

## 🚨 Alertas Críticos

O sistema identifica automaticamente situações críticas:

1. **Férias Vencidas**: Funcionário passou de 2 anos sem tirar férias
2. **Próximo ao Vencimento**: Restam menos de 90 dias para o vencimento
3. **Múltiplas Notificações**: Funcionário com várias notificações pendentes

## 📈 Métricas e Relatórios

### Dashboard Principal
- Total de funcionários por empresa
- Funcionários com direito a férias
- Notificações ativas por prioridade
- Tempo médio até vencimento

### Relatórios Detalhados
- Status individual de cada funcionário
- Histórico de notificações
- Alertas críticos em tempo real
- Estatísticas de conformidade

## 🔒 Segurança

### Row Level Security (RLS)
- Funcionários veem apenas suas notificações
- RH vê todas as notificações da empresa
- Logs do sistema são protegidos

### Permissões
- Todas as funções respeitam as políticas RLS existentes
- Notificações são vinculadas à empresa do funcionário
- Logs do sistema não expõem dados sensíveis

## 🆘 Solução de Problemas

### Problemas Comuns

1. **Notificações não aparecem**
   - Verifique se o funcionário está ativo
   - Confirme se a data de admissão está correta
   - Execute verificação manual: `SELECT rh.gerar_notificacoes_ferias('uuid')`

2. **Execução automática não funciona**
   - Verifique se o cron job está configurado
   - Confirme se as permissões estão corretas
   - Execute manualmente para testar: `SELECT rh.executar_verificacoes_ferias_completa()`

3. **Notificações duplicadas**
   - O sistema previne duplicatas automaticamente
   - Verifique se não há múltiplas execuções simultâneas
   - Limpe notificações antigas se necessário

### Logs e Debug
```sql
-- Ver logs do sistema
SELECT * FROM rh.vacation_notifications 
WHERE notification_type = 'system_log' 
ORDER BY created_at DESC;

-- Verificar última execução
SELECT * FROM rh.status_sistema_notificacoes();

-- Testar função específica
SELECT * FROM rh.calcular_direito_ferias('uuid-do-funcionario');
SELECT * FROM rh.calcular_status_ferias('uuid-do-funcionario');
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do sistema
2. Execute os testes manuais
3. Consulte a documentação das funções
4. Entre em contato com o administrador do banco

---

**Importante**: Este sistema é complementar ao sistema de férias existente. Ele não substitui a gestão manual, mas fornece alertas proativos para garantir conformidade legal.

