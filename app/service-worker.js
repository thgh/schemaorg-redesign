import { assets, shell, timestamp, routes } from './manifest/service-worker.js';

const PRECACHE = `cache${timestamp}`;

const to_cache = shell.concat(assets).concat('/?cloak=1')
  .map(v => v.startsWith('/') ? v : '/' + v)
  .map(v => v.endsWith('/index.html') ? v.slice(0, -10) : v)
const cached = new Set(to_cache);

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then(cache => cache.addAll(to_cache))
      .then(() => {
        self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      // delete old caches
      for (const key of keys) {
        if (key !== PRECACHE) await caches.delete(key);
      }

      await self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // don't try to handle e.g. data: URIs
  if (!url.protocol.startsWith('http')) return;
  if (url.pathname.includes('__')) return;

  // TODO: check if newer is available
  if (url.pathname.includes('service-work')) return;

  if (url.pathname.endsWith('index.html')) {
    url.pathname = url.pathname.slice(0, -10)
  }

  // always serve assets and webpack-generated files from cache
  event.respondWith(
    Promise.reject()
      .catch(getIndexIfSlug)
      .catch(getFromCache)
      .catch(fetchLive)
  )

  function getFromCache () {
    return caches.match(event.request)
      .then(hit => hit || Promise.reject('nope'))
  }

  function getIndexIfSlug () {
    if (!isSlug(url.pathname.slice(1))) {
      return Promise.reject()
    }
    return caches.match(new Request('/?cloak=1'))
      .then(hit => hit || Promise.reject('noindex'))
  }

  function fetchLive () {
    return fetch(event.request)
  }
});

function isSlug (str) {
  return str === str.replace(/[^a-zA-Z]/, '')
}
