import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    exclude: [
      /middleware-manifest\.json$/,
      /_next\/server\/middleware\.js$/,
      /^.*\/sign-in.*$/,
      /^.*\/sign-up.*$/,
      /^.*\/api\/.*$/,
      /^.*\/dashboard.*$/,
      /^.*\/settings.*$/,
      /^.*\/add.*$/,
      /^.*\/expenses.*$/,
    ],
    navigateFallback: null,
    runtimeCaching: [
      {
        urlPattern: /\/api\/.*/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\/sign-in\/?.*/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\/sign-up\/?.*/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\/dashboard\/?.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
          networkTimeoutSeconds: 3,
        },
      },
      {
        urlPattern: /\/settings\/?.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
          networkTimeoutSeconds: 3,
        },
      },
      {
        urlPattern: /\/add\/?.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
          networkTimeoutSeconds: 3,
        },
      },
      {
        urlPattern: /\/expenses\/?.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
          networkTimeoutSeconds: 3,
        },
      },
      {
        urlPattern: /\/_next\/static\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-assets',
          expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /.*/,
        handler: 'NetworkOnly',
      }
    ]
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
};

export default withPWA(nextConfig);
