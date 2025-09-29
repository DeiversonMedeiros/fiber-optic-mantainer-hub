# Funcionalidade Offline - Registro de Ponto

## Visão Geral

A funcionalidade offline permite que colaboradores registrem ponto mesmo sem conexão com a internet. Os registros são salvos localmente no dispositivo e sincronizados automaticamente quando a conexão for restabelecida.

## Arquitetura

### Componentes Principais

1. **IndexedDB (Armazenamento Local)**
   - `src/services/offlineStorage.ts` - Gerencia armazenamento local
   - Armazena registros de ponto offline
   - Mantém fila de sincronização

2. **Serviço de Sincronização**
   - `src/services/syncService.ts` - Gerencia sincronização com servidor
   - Sincroniza registros pendentes
   - Verifica conectividade

3. **Hooks Customizados**
   - `src/hooks/useConnectivity.ts` - Detecta status de conexão
   - `src/hooks/useOfflineTimeRecords.ts` - Gerencia registros offline
   - `src/hooks/useOfflineInit.ts` - Inicializa sistema offline
   - `src/hooks/useSyncNotifications.ts` - Notificações de sincronização

4. **Componentes UI**
   - `src/components/ConnectivityStatus.tsx` - Status de conectividade
   - `src/components/OfflineInstructions.tsx` - Instruções para usuário

5. **Service Worker**
   - `public/sw.js` - Cache da aplicação
   - `public/manifest.json` - Configuração PWA

## Como Funciona

### 1. Detecção de Conectividade
- Monitora eventos `online` e `offline`
- Atualiza status em tempo real
- Dispara sincronização automática

### 2. Armazenamento Offline
- Registros salvos em IndexedDB
- Estrutura compatível com banco de dados
- Controle de sincronização por registro

### 3. Sincronização
- Automática quando conexão volta
- Manual via botão "Sincronizar"
- Tratamento de erros e retry

### 4. Interface do Usuário
- Indicador visual de status (Online/Offline)
- Contador de registros pendentes
- Avisos sobre modo offline
- Instruções detalhadas

## Estrutura de Dados

### Registro Offline
```typescript
interface OfflineTimeRecord {
  id: string;
  employee_id: string;
  data: string;
  tipo: 'normal' | 'correcao' | 'feriado';
  hora_entrada?: string;
  hora_saida?: string;
  intervalo_inicio?: string;
  intervalo_fim?: string;
  hora_adicional_inicio?: string;
  hora_adicional_fim?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}
```

## Fluxo de Funcionamento

### Registro de Ponto
1. Usuário clica em botão (Entrada, Saída, etc.)
2. Sistema tenta salvar online primeiro
3. Se falhar ou estiver offline, salva localmente
4. Exibe notificação apropriada
5. Adiciona à fila de sincronização

### Sincronização
1. Detecta retorno de conexão
2. Busca registros não sincronizados
3. Envia para servidor em lote
4. Marca como sincronizados
5. Notifica sucesso/erro

## Configuração PWA

### Manifest.json
- Nome e descrição da aplicação
- Ícones para diferentes tamanhos
- Configurações de exibição
- Cores de tema

### Service Worker
- Cache de recursos estáticos
- Interceptação de requisições
- Fallback para modo offline

## Benefícios

### Para Colaboradores
- ✅ Funciona sem internet
- ✅ Não perde registros
- ✅ Sincronização automática
- ✅ Interface intuitiva

### Para Empresa
- ✅ Maior precisão nos registros
- ✅ Menos problemas de conectividade
- ✅ Dados sempre disponíveis
- ✅ Redução de retrabalho

## Compatibilidade

### Navegadores Suportados
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Dispositivos
- Desktop (Windows, Mac, Linux)
- Mobile (Android, iOS)
- Tablets

## Instalação como PWA

### Desktop
1. Abrir no navegador
2. Clicar no ícone de instalação na barra de endereços
3. Confirmar instalação

### Mobile
1. Abrir no navegador
2. Menu → "Adicionar à tela inicial"
3. Confirmar instalação

## Manutenção

### Limpeza de Dados
- Registros sincronizados são limpos após 30 dias
- Configurável via `offlineStorage.clearOldSyncedRecords()`

### Monitoramento
- Logs de sincronização no console
- Notificações de erro para usuário
- Status de conectividade visível

## Troubleshooting

### Problemas Comuns

**Registros não sincronizam**
- Verificar conectividade
- Tentar sincronização manual
- Verificar logs do console

**Dados perdidos**
- Não limpar dados do navegador
- Verificar se IndexedDB está habilitado
- Contatar suporte técnico

**PWA não instala**
- Verificar se HTTPS está ativo
- Verificar manifest.json
- Verificar Service Worker

**Erro "Failed to execute 'getAll' on 'IDBIndex'"**
- Este erro foi corrigido na versão atual
- Se persistir, pode ser necessário limpar dados do navegador
- Use o método `resetDatabase()` para debug (apenas em desenvolvimento)

**Ícone PWA não carrega**
- Verificar se o arquivo `/icon.svg` existe
- Verificar se o manifest.json está correto
- Usar DevTools → Application → Manifest para verificar

### Logs Úteis
```javascript
// Verificar registros pendentes
const records = await offlineStorage.getUnsyncedRecords();
console.log('Registros pendentes:', records);

// Verificar status de sincronização
const isSyncing = syncService.isCurrentlySyncing();
console.log('Sincronizando:', isSyncing);

// Verificar conectividade
const hasConnection = await syncService.checkConnection();
console.log('Conectado:', hasConnection);

// Verificar saúde do IndexedDB
const isHealthy = await offlineStorage.healthCheck();
console.log('IndexedDB funcionando:', isHealthy);

// Reset do banco (APENAS EM DESENVOLVIMENTO)
// await offlineStorage.resetDatabase();
```

## Desenvolvimento

### Adicionando Novos Campos
1. Atualizar interface `OfflineTimeRecord`
2. Atualizar serviço de sincronização
3. Atualizar interface do usuário
4. Testar offline/online

### Melhorias Futuras
- [ ] Sincronização em background
- [ ] Compressão de dados
- [ ] Criptografia local
- [ ] Backup em nuvem
- [ ] Modo offline completo (todas as páginas)
