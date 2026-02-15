/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  webpack: (config) => {
    // Suppress optional pino-pretty warning from WalletConnect
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
    };
    config.externals = [...(config.externals || []), "pino-pretty"];
    return config;
  },
};

module.exports = nextConfig;
