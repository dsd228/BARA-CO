/* ===========================================
   BARA & CO - SERVICE WORKER
   Offline support, cache, PWA
   =========================================== */

const CACHE_NAME = 'bara-co-v1';
const API_CACHE_NAME = 'bara-co-api-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/tienda.html',
  '/producto.html',
  '/lookbook.html',
  '/login.html',
  '/checkout.html',
  '/css/global.css',
  '/js/carrito.js',
  '/js/auth.js',
  '/js/mercadopago.js',
  '/js/search.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-brands-400.woff2'
];

// ---------- 1. INSTALACIÓN ----------
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// ---------- 2. ACTIVACIÓN ----------
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Service Worker: Eliminando caché viejo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ---------- 3. ESTRATEGIA DE CACHE ----------
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Estrategia para API/JSON
  if (url.pathname.includes('productos.json') || event.request.headers.get('accept')?.includes('application/json')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // Estrategia para imágenes (cache first)
  if (event.request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }
  
  // Estrategia para páginas (network first)
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // Estrategia para assets estáticos (cache first)
  event.respondWith(staleWhileRevalidateStrategy(event.request));
});

// ---------- 4. ESTRATEGIAS DE CACHE ----------

// Cache First - Primero busca en caché, si no, va a la red
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Si falla la red y no está en caché
    if (request.destination === 'image') {
      return caches.match('/assets/img/placeholder.jpg');
    }
    return new Response('Offline', { status: 503 });
  }
}

// Network First - Primero intenta red, si falla, busca en caché
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si es una página, devolver página offline
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate - Muestra caché, actualiza en segundo plano
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// ---------- 5. PUSH NOTIFICATIONS ----------
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'Ver'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ---------- 6. MANEJO DE NOTIFICACIONES ----------
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// ---------- 7. BACKGROUND SYNC ----------
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Sincronizar pedidos offline cuando hay conexión
  const orders = await getPendingOrders();
  for (const order of orders) {
    try {
      await sendOrderToServer(order);
      await markOrderAsSynced(order.id);
    } catch (error) {
      console.error('Error sincronizando orden:', error);
    }
  }
}

// ---------- 8. PERIODIC BACKGROUND SYNC ----------
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-stock') {
    event.waitUntil(checkAndNotifyLowStock());
  }
});

async function checkAndNotifyLowStock() {
  // Verificar stock bajo y notificar admin
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'LOW_STOCK',
      message: 'Hay productos con stock bajo'
    });
  });
}

console.log('Service Worker: Cargado y listo');
