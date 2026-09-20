/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@clauseiqx/shared-types'],
};

module.exports = nextConfig;
