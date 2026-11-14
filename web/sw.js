/*
 * Nuvio Web — service worker mínimo.
 * - Permite ao Chrome/Edge oferecer "Instalar app".
 * - A página principal (index.html) sempre vem direto da internet, sem cache:
 *   o GitHub Pages guarda cache por até 10 min, e sem isso uma atualização
 *   demorava a aparecer. O resto continua com o comportamento normal.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate" || request.method !== "GET") return;
  event.respondWith(fetch(request, { cache: "no-store" }).catch(() => fetch(request)));
});
