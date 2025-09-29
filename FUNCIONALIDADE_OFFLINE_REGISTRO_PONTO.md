# Funcionalidade Offline - Registro de Ponto

## Visão Geral

O sistema agora possui funcionalidade offline completa para o registro de ponto, permitindo que colaboradores registrem seus pontos mesmo sem conexão com a internet. Os registros são salvos localmente e sincronizados automaticamente quando a conexão for restabelecida.

## Arquitetura da Solução

### 1. Detecção de Conectividade
- **Hook**: `useConnectivity`
- **Funcionalidade**: Monitora o status de conexão do navegador
- **Eventos**: Escuta eventos `online` e `offline`

### 2. Armazenamento Local
- **Serviço**: `offlineStorage`
- **Tecnologia**: IndexedDB
- **Funcionalidades**:
  - Salvar registros offline
  - Atualizar registros existentes
  - Buscar registros por funcionário e data
  - Marcar registros como sincronizados
  - Limpeza automática de registros antigos

### 3. Sincronização
- **Serviço**: `syncService`
- **Funcionalidades**:
  - Sincronização automática quando volta online
  - Sincronização manual via botão
  - Verificação de conectividade
  - Tratamento de erros de sincronização

### 4. Gerenciamento de Estado
- **Hook**: `useOfflineTimeRecords`
- **Funcionalidades**:
  - Integração entre dados online e offline
  - Priorização de dados online quando disponível
  - Contador de registros pendentes
  - Sincronização automática

## Como Funciona

### Modo Online
1. Tentativa de salvar no banco de dados
2. Em caso de erro, salva localmente
3. Exibe toast de sucesso

### Modo Offline
1. Salva automaticamente no IndexedDB
2. Adiciona à fila de sincronização
3. Exibe toast indicando modo offline
4. Mostra contador de registros pendentes

### Sincronização
1. Detecta quando volta online
2. Sincroniza todos os registros pendentes
3. Atualiza interface com dados do servidor
4. Remove registros antigos (30+ dias)

## Interface do Usuário

### Status de Conectividade
- **Online**: Badge verde com ícone WiFi
- **Offline**: Badge vermelho com ícone WiFi cortado
- **Pendências**: Contador de registros não sincronizados
- **Botão Sincronizar**: Disponível quando online e há pendências

### Aviso Offline
- Card amarelo informativo quando em modo offline
- Explica que os dados estão sendo salvos localmente
- Mostra quantidade de registros pendentes

### Botões de Registro
- Funcionam normalmente offline
- Desabilitados durante sincronização
- Feedback visual do status atual

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

## Service Worker

### Cache da Aplicação
- Cache de recursos estáticos
- Interceptação de requisições
- Fallback para modo offline

### Manifest PWA
- Configuração para Progressive Web App
- Ícones e tema
- Comportamento standalone

## Configuração

### Arquivos Criados/Modificados

#### Novos Arquivos:
- `src/hooks/useConnectivity.ts`
- `src/hooks/useOfflineTimeRecords.ts`
- `src/hooks/useOfflineInit.ts`
- `src/services/offlineStorage.ts`
- `src/services/syncService.ts`
- `src/components/ConnectivityStatus.tsx`
- `public/sw.js`
- `public/manifest.json`

#### Arquivos Modificados:
- `src/pages/portal-colaborador/RegistroPontoPage.tsx`
- `src/App.tsx`
- `index.html`

## Benefícios

### Para o Usuário
- ✅ Funciona sem internet
- ✅ Sincronização automática
- ✅ Feedback visual claro
- ✅ Não perde dados
- ✅ Interface responsiva

### Para o Sistema
- ✅ Arquitetura escalável
- ✅ Tratamento robusto de erros
- ✅ Limpeza automática de dados
- ✅ Compatibilidade com PWA
- ✅ Performance otimizada

## Testes Recomendados

### Cenários de Teste
1. **Registro offline**: Desconectar internet e registrar ponto
2. **Sincronização**: Reconectar e verificar sincronização automática
3. **Múltiplos registros**: Fazer vários registros offline e sincronizar
4. **Erro de rede**: Simular falha na sincronização
5. **Limpeza**: Verificar remoção de registros antigos

### Ferramentas de Debug
- DevTools > Application > Storage > IndexedDB
- DevTools > Application > Service Workers
- Console para logs de sincronização

## Manutenção

### Limpeza Automática
- Registros sincronizados há mais de 30 dias são removidos
- Executa uma vez por sessão
- Configurável no código

### Monitoramento
- Logs de sincronização no console
- Contador de registros pendentes
- Status de conectividade em tempo real

## Compatibilidade

### Navegadores Suportados
- Chrome 51+
- Firefox 44+
- Safari 10.1+
- Edge 79+

### Recursos Necessários
- IndexedDB
- Service Workers
- Fetch API
- Promises

## Segurança

### Dados Locais
- Criptografia automática do IndexedDB
- Isolamento por origem
- Não expostos a outros sites

### Sincronização
- Autenticação mantida
- Validação de dados
- Tratamento de conflitos
