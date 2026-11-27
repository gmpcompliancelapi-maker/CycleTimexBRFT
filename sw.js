/* Service Worker — Cycle Time Perilisan
   Strategi:
   - App shell (HTML, manifest, ikon) : precache saat install
   - Navigasi (halaman)               : network-first, fallback cache, lalu offline.html
   - Aset same-origin                 : stale-while-revalidate
   - CDN (Firebase SDK, Tailwind, font): stale-while-revalidate (runtime cache)
   - API Firebase (auth/firestore)    : TIDAK di-cache, langsung ke jaringan
   Naikkan CACHE_VERSION setiap kali file di repo diubah agar cache lama dibuang. */

const CACHE_VERSION = "v1.3.0";
const SHELL_CACHE = `ct-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ct-runtime-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./login.html",
  "./kpi.html",
  "./offline.html",
  "./manifest.json",
  "./favicon.ico",
  "./favicon.svg",
  "./icons/logo.svg",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",
  "./icons/apple-touch-icon.png"
];

const CDN_HOSTS = [
  "www.gstatic.com",          // Firebase SDK
  "cdn.tailwindcss.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com"
];

const NEVER_CACHE_HOSTS = [
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firestore.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "www.google-analytics.com",
  "region1.google-analytics.com",
  "www.googletagmanager.com",
  "apis.google.com",
  "accounts.google.com"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => ![SHELL_CACHE, RUNTIME_CACHE].includes(k)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isCacheable(res) {
  return res && (res.ok || res.type === "opaque");
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (isCacheable(res)) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (NEVER_CACHE_HOSTS.includes(url.hostname)) return;

  // Navigasi halaman
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request, { ignoreSearch: true });
          return cached || (await caches.match("./offline.html"));
        })
    );
    return;
  }

  // Aset same-origin
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }

  // CDN
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});
