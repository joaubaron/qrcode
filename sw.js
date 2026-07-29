// Service Workers
// Toda vez que trocar fotos/áudios, a versão será atualizada automaticamente pelo deploy.yml
const CACHE_VERSION = '29.07.2026-1458';
const CACHE_NAME = `qrcode-${CACHE_VERSION}`;
const ASSETS = [

'/index.html',
'/manifest.json',
'/qrcode.min.js',
'/icons/icone192.png',
'/icons/icone512.png'
];

// Instalação
self.addEventListener('install', (event) => {
event.waitUntil(
caches.open(CACHE_NAME)
.then((cache) => {
console.log('Cache aberto:', CACHE_NAME);
return cache.addAll(ASSETS);
})
.then(() => self.skipWaiting())
);
});

// Ativação - limpa todos caches antigos
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
.then(() => self.clients.claim())
);
});

// Fetch
self.addEventListener('fetch', (event) => {
const request = event.request;

// HTML - Network First
if (request.mode === 'navigate') {
event.respondWith(
fetch(request)
.then((response) => {
const clone = response.clone();
caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
return response;
})
.catch(() => caches.match(request))
);
return;
}

// Assets - Cache First
event.respondWith(
caches.match(request)
.then((response) => {
if (response) return response;
return fetch(request).then((response) => {
if (!response || response.status !== 200) return response;
const clone = response.clone();
caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
return response;
});
})
.catch(() => {
if (request.url.match(/\.(png|jpg|jpeg|svg|gif|ico)$/)) {
return new Response('', { status: 404 });
}
return new Response('Offline', { status: 503 });
})
);
});

// Notificações (opcional)
self.addEventListener('push', (event) => {
const options = {
body: event.data ? event.data.text() : 'Novo conteúdo disponível!',
icon: '/icons/icone192.png',
badge: '/icons/icone192.png',
vibrate: [100, 50, 100],
data: { dateOfArrival: Date.now(), primaryKey: '1' },
actions: [
{ action: 'open', title: 'Abrir' },
{ action: 'close', title: 'Fechar' }
]
};
event.waitUntil(self.registration.showNotification('Gerador de QR Code', options));
});

self.addEventListener('notificationclick', (event) => {
event.notification.close();
if (event.action === 'open') {
event.waitUntil(clients.openWindow('/'));
}
});
