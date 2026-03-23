import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  workboxOptions: {
    disableDevLogs: true,
    exclude: [
      /middleware-manifest\.json$/,
      /_next\/server\/middleware\.js$/,
      /^.*\/sign-in.*$/,
      /^.*\/sign-up.*$/,
    ],
    navigateFallback: null,
    runtimeCaching: [
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
const nextConfig = {};

export default withPWA(nextConfig);
