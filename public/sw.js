const CACHE_NAME = 'ponto-offline-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar do cache se disponível
        if (response) {
          return response;
        }
        
        // Tentar fazer a requisição online
        return fetch(event.request).catch(() => {
          // Se offline e for uma requisição de API, retornar uma resposta padrão
          if (event.request.url.includes('/api/')) {
            return new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'Sem conexão com a internet' 
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        });
      })
  );
});

// Atualizar cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Notificar sobre mudanças de conectividade
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Gerenciar notificações push
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Você tem um lembrete de ponto!',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'ponto-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: '/icon.svg'
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
        icon: '/icon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('⏰ Lembrete de Ponto', options)
  );
});

// Gerenciar cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Abrir ou focar na aplicação
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Se já existe uma janela aberta, focar nela
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não existe, abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow('/portal-colaborador/registro-ponto');
      }
    })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);
  
  if (event.tag === 'time-record-sync') {
    event.waitUntil(
      syncTimeRecords()
    );
  }
});

// Função para sincronizar registros de ponto
async function syncTimeRecords() {
  try {
    console.log('Sincronizando registros de ponto...');
    // Aqui você pode implementar a lógica de sincronização
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}


