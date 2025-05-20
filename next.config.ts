/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // This helps with ESM packages
    esmExternals: 'loose',
  },
  // Configure webpack to handle @react-pdf/renderer properly
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Handle ESM modules properly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };

    // Exclude @react-pdf/renderer from server-side bundling
    if (isServer) {
      config.externals = [
        ...config.externals,
        '@react-pdf/renderer',
      ];
    }

    return config;
  },
  // Transpile the ESM package
  transpilePackages: ['@react-pdf/renderer'],
};

module.exports = nextConfig;