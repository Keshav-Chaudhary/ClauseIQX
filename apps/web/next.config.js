/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  transpilePackages: ['@clauseiqx/shared-types'],
  async rewrites() {
    const internalApi = process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${internalApi}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${internalApi}/health`,
      },
    ];
  },
};

module.exports = nextConfig;
