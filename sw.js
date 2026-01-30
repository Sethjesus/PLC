const CACHE_NAME = 'logic-gate-calc-v1.1.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] 安裝中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 快取資源中...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] 所有資源已快取');
        return self.skipWaiting();
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活中...');
  
  // 清理舊快取
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] 已激活');
      return self.clients.claim();
    })
  );
});

// 攔截請求
self.addEventListener('fetch', event => {
  // 跳過非GET請求
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果有快取，返回快取
        if (response) {
          return response;
        }
        
        // 否則從網路獲取
        return fetch(event.request)
          .then(response => {
            // 檢查是否有效回應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆回應以進行快取
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // 如果網路失敗且請求HTML，返回首頁
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// 後台同步（如果需要）
self.addEventListener('sync', event => {
  console.log('[Service Worker] 背景同步:', event.tag);
});
