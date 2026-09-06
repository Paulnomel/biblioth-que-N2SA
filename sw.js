/* ==========================================================================
   N2SA — Service Worker
   Permet l'installation du site comme application (PWA) et une mise en
   cache basique des fichiers statiques pour un chargement plus rapide
   et un fonctionnement minimal hors connexion.

   Stratégie :
   - Fichiers statiques (CSS, JS, logo, icônes) : cache d'abord, réseau
     en repli (rapide, change rarement).
   - Pages HTML : réseau d'abord, cache en repli (toujours à jour si
     connecté, mais consultable hors-ligne en dernier recours).
   - Les appels vers Supabase (API, authentification, documents) ne
     sont jamais mis en cache : ils doivent toujours venir du réseau.
   ========================================================================== */

const CACHE_NAME = "n2sa-cache-v1";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/main.js",
  "./js/auth.js",
  "./js/documents.js",
  "./js/supabase-client.js",
  "./assets/logo.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./manifest.json",
];

/* ---- Installation : mise en cache initiale des fichiers statiques ---- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* ---- Activation : suppression des anciens caches (mises à jour futures) ---- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ---- Interception des requêtes ---- */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ne jamais mettre en cache les appels vers Supabase (données toujours fraîches)
  if (url.hostname.endsWith("supabase.co")) {
    return; // laisse passer normalement, sans intervention du service worker
  }

  // Pages HTML : réseau d'abord, cache en repli
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Fichiers statiques (CSS, JS, images) : cache d'abord, réseau en repli
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
