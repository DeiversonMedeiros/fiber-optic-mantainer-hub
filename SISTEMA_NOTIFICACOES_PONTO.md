# Sistema de Notificações para Registro de Ponto

## 📋 Visão Geral

Sistema completo de notificações e lembretes para funcionários registrarem seus pontos de entrada, saída e intervalos. O sistema funciona tanto online quanto offline, utilizando notificações push do navegador e PWA.

## 🚀 Funcionalidades

### ✅ Implementadas

1. **Notificações Push do Navegador**
   - Solicitação automática de permissões
   - Notificações personalizáveis
   - Teste de notificações
   - Integração com Service Worker

2. **Lembretes Baseados em Horário**
   - Lembrete de entrada (5 min antes)
   - Lembrete de saída (no horário)
   - Lembretes de intervalo (início e fim)
   - Configuração por dia da semana

3. **Configurações Personalizáveis**
   - Habilitar/desabilitar lembretes
   - Horários customizáveis
   - Mensagens personalizadas
   - Integração com horário de trabalho

4. **Interface de Usuário**
   - Modal de configurações
   - Status visual das notificações
   - Botões de teste e configuração
   - Integração na página de registro

5. **Funcionalidade Offline**
   - Armazenamento local das configurações
   - Fallback para localStorage
   - Sincronização automática

### 🔄 Em Desenvolvimento

1. **Banco de Dados**
   - Tabela `rh.user_settings` para configurações
   - Tabela `rh.notification_history` para histórico
   - Funções SQL para gerenciamento

2. **Notificações Push Avançadas**
   - Integração com VAPID keys
   - Notificações em background
   - Sincronização de servidor

## 🏗️ Arquitetura

### Componentes Principais

```
src/
├── services/
│   └── notificationService.ts      # Serviço principal de notificações
├── hooks/
│   ├── useTimeReminders.ts         # Hook para gerenciar lembretes
│   └── usePushNotifications.ts     # Hook para push notifications
├── components/
│   ├── TimeReminderSettings.tsx    # Componente de configurações
│   └── NotificationSettingsModal.tsx # Modal de configurações
└── pages/portal-colaborador/
    └── RegistroPontoPage.tsx       # Página principal integrada
```

### Fluxo de Funcionamento

1. **Inicialização**
   - Verificar suporte do navegador
   - Solicitar permissões
   - Carregar configurações do usuário

2. **Configuração**
   - Usuário define horários e preferências
   - Configurações salvas localmente e no banco
   - Lembretes são agendados automaticamente

3. **Execução**
   - Sistema verifica horários a cada minuto
   - Envia notificação quando necessário
   - Registra histórico de notificações

## 📱 Como Usar

### Para o Funcionário

1. **Acessar Configurações**
   - Ir para página "Registro de Ponto"
   - Clicar no botão "Configurar" ao lado do status de notificações

2. **Permitir Notificações**
   - Clicar em "Permitir Notificações" se necessário
   - Testar com botão "Testar Notificação"

3. **Configurar Lembretes**
   - Ativar lembretes desejados
   - Ajustar horários conforme necessário
   - Adicionar mensagem personalizada (opcional)

4. **Salvar Configurações**
   - Clicar em "Salvar Configurações"
   - Sistema começará a enviar lembretes automaticamente

### Para o Administrador

1. **Configurar Horários de Trabalho**
   - Definir horários padrão na tabela `work_schedules`
   - Sistema usará automaticamente esses horários

2. **Monitorar Uso**
   - Verificar tabela `notification_history`
   - Analisar estatísticas de entrega

## 🛠️ Configuração Técnica

### Variáveis de Ambiente

```env
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### Banco de Dados

```sql
-- Executar o script create_notification_system.sql
-- Criará as tabelas e funções necessárias
```

### Service Worker

O arquivo `public/sw.js` já está configurado para:
- Cache de recursos offline
- Gerenciamento de notificações push
- Sincronização em background
- Abertura de janelas ao clicar nas notificações

## 🧪 Testando o Sistema

### Teste Básico

1. Abrir página de Registro de Ponto
2. Clicar em "Configurar" notificações
3. Permitir notificações no navegador
4. Clicar em "Testar Notificação"
5. Verificar se a notificação aparece

### Teste de Lembretes

1. Configurar lembrete para 1 minuto no futuro
2. Aguardar o lembrete aparecer
3. Verificar se a notificação tem o conteúdo correto

### Teste Offline

1. Desconectar da internet
2. Configurar lembretes
3. Verificar se são salvos localmente
4. Reconectar e verificar sincronização

## 📊 Monitoramento

### Logs Úteis

```javascript
// Verificar status das notificações
console.log('Permission:', Notification.permission);

// Verificar configurações salvas
const settings = localStorage.getItem(`time_reminder_settings_${userId}`);
console.log('Settings:', JSON.parse(settings));

// Verificar Service Worker
navigator.serviceWorker.ready.then(reg => {
  console.log('SW ready:', reg);
});
```

### Métricas Importantes

- Taxa de permissão concedida
- Taxa de entrega de notificações
- Taxa de cliques nas notificações
- Horários mais comuns de registro

## 🔧 Troubleshooting

### Problemas Comuns

**Notificações não aparecem**
- Verificar se permissão foi concedida
- Verificar se horário está configurado corretamente
- Verificar console para erros

**Configurações não salvam**
- Verificar se localStorage está disponível
- Verificar conexão com banco de dados
- Verificar permissões RLS

**Lembretes não funcionam**
- Verificar se Service Worker está ativo
- Verificar se horários são válidos
- Verificar se é dia útil

### Logs de Debug

```javascript
// Ativar logs detalhados
localStorage.setItem('debug_notifications', 'true');

// Verificar estado do sistema
window.notificationDebug = {
  service: notificationService,
  settings: reminderSettings,
  permission: Notification.permission
};
```

## 🚀 Próximos Passos

1. **Implementar Push Notifications**
   - Configurar VAPID keys
   - Integrar com servidor de notificações
   - Testar notificações em background

2. **Melhorar UX**
   - Adicionar mais opções de personalização
   - Implementar notificações por email
   - Adicionar relatórios de uso

3. **Integração Avançada**
   - Sincronizar com calendário
   - Integrar com sistema de férias
   - Adicionar notificações para gestores

## 📝 Notas de Desenvolvimento

- Sistema funciona com fallback para localStorage
- Notificações funcionam mesmo offline
- Compatível com todos os navegadores modernos
- Integração completa com sistema PWA existente

## 🔒 Segurança

- Permissões solicitadas apenas quando necessário
- Dados armazenados localmente quando possível
- Políticas RLS no banco de dados
- Validação de entrada em todas as configurações
