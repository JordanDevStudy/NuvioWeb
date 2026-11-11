/*
 * Nuvio Web — service worker mínimo.
 * Existe só para o Chrome/Edge oferecerem "Instalar app". Não guarda nada em
 * cache: tudo continua vindo da internet, então nunca abre uma versão velha.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // Sem respondWith: o navegador busca normalmente.
});
