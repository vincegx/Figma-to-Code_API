/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude native dependencies from webpack bundling
  // tailwindcss v4 uses lightningcss which has native bindings
  experimental: {
    serverComponentsExternalPackages: ['tailwindcss-v4', 'lightningcss'],
  },
};

module.exports = nextConfig;
