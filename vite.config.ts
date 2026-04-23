VitePWA({
  registerType: "autoUpdate",
  injectRegister: "auto",

  // Either let the plugin generate the manifest (recommended)
  manifest: {
    name: "Sewnaija",
    short_name: "Sewnaija",
    start_url: "/",
    scope: "/",
    display: "standalone",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  },

  // OR if you must use a static manifest, set injectManifest to true
  // and point to your custom service worker (advanced)
  // But for now, let the plugin generate it.

  includeAssets: [
    "favicon.ico",
    "icon-192.png",
    "icon-512.png"
  ],

  workbox: {
    // FIXED: remove /sewnaija/
    navigateFallback: "/index.html",
    globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
  }
})
