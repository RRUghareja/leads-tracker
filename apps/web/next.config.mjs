// Plain JavaScript on purpose: a next.config.ts needs the TypeScript package at runtime, which a
// production install (npm ci --omit=dev, as in the Dockerfile) does not include.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
