/*
 * Activa el aislamiento cross-origin mediante un service worker, para que
 * WebAssembly pueda usar varios núcleos del procesador. Hace falta porque
 * GitHub Pages no deja poner cabeceras propias.
 *
 * Basado en la técnica de coi-serviceworker (Guido Zuidhof, licencia MIT).
 */
if (typeof window === 'undefined') {
  self.addEventListener('install', () => self.skipWaiting())
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

  self.addEventListener('fetch', (event) => {
    const request = event.request
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 0) return response
          const headers = new Headers(response.headers)
          headers.set('Cross-Origin-Embedder-Policy', 'credentialless')
          headers.set('Cross-Origin-Opener-Policy', 'same-origin')
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          })
        })
        .catch((err) => {
          console.error('[coi]', err)
          return new Response('', { status: 502 })
        }),
    )
  })
} else {
  ;(async () => {
    if (window.crossOriginIsolated) return
    if (!window.isSecureContext || !navigator.serviceWorker) return
    try {
      const registration = await navigator.serviceWorker.register(
        new URL('coi.js', window.document.currentScript?.src ?? location.href),
        { scope: './' },
      )
      registration.addEventListener('updatefound', () => window.location.reload())
      if (registration.active && !navigator.serviceWorker.controller) window.location.reload()
    } catch (err) {
      console.warn('[coi] no se ha podido activar el multinúcleo:', err)
    }
  })()
}
