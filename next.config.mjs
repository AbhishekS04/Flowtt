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
      /_next\/data\/.*\.json$/,
    ],
    navigateFallback: null,
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA(nextConfig);
