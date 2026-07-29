// sw.js - Service Worker para offline
const CACHE_VERSION = '26.06.2026-0844';
const CACHE_NAME = `qr-code-${CACHE_VERSION}`;
const STATIC_ASSETS = [

'/',
'/index.html',
'/manifest.json',
'/qrcode.min.js',
'/icons/icone192.png',
'/icons/icone512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
event.waitUntil(
caches.open(CACHE_NAME)
.then((cache) => {
console.log('Cache aberto');
return cache.addAll(urlsToCache);
})
.then(() => {
return self.skipWaiting();
})
);
});

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
event.waitUntil(
caches.keys().then((cacheNames) => {
return Promise.all(
cacheNames.map((cacheName) => {
if (cacheName !== CACHE_NAME) {
console.log('Cache antigo removido:', cacheName);
return caches.delete(cacheName);
}
})
);
})
.then(() => {
return self.clients.claim();
})
);
});

// Estratégia: Cache First, depois Network
self.addEventListener('fetch', (event) => {
event.respondWith(
caches.match(event.request)
.then((response) => {
// Cache hit - retorna do cache
if (response) {
return response;
}

// Tenta buscar da rede
return fetch(event.request)
.then((response) => {
// Verifica se é uma resposta válida
if (!response || response.status !== 200 || response.type !== 'basic') {
return response;
}

// Clona a resposta para cache
const responseToCache = response.clone();
caches.open(CACHE_NAME)
.then((cache) => {
    cache.put(event.request, responseToCache);
});

return response;
})
.catch(() => {
// Fallback para quando offline
return new Response('Offline - Conteúdo não disponível', {
status: 503,
statusText: 'Service Unavailable'
});
});
})
);
});

// Gerenciamento de notificações push (opcional)
self.addEventListener('push', (event) => {
const options = {
body: event.data ? event.data.text() : 'Novo conteúdo disponível!',
icon: '/icons/icone192.png',
badge: '/icons/icone192.png',
vibrate: [100, 50, 100],
data: {
dateOfArrival: Date.now(),
primaryKey: '1'
},
actions: [
{
action: 'open',
title: 'Abrir'
},
{
action: 'close',
title: 'Fechar'
}
]
};

event.waitUntil(
self.registration.showNotification('Gerador de QR Code', options)
);
});

self.addEventListener('notificationclick', (event) => {
event.notification.close();

if (event.action === 'open') {
event.waitUntil(
clients.openWindow('/')
);
}
});
