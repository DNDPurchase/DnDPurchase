/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // WhatsApp template buttons (new-offer / offer-accepted for buyers) point at
  // /dashboard/buyer/inquiries[...], which is not a real route. Send those taps
  // to the real buyer pages instead of a 404.
  async redirects() {
    return [
      {
        source: '/dashboard/buyer/inquiries/:id',
        destination: '/dashboard/offers?inquiryId=:id',
        permanent: false,
      },
      {
        source: '/dashboard/buyer/inquiries',
        destination: '/dashboard/inquiries',
        permanent: false,
      },
    ]
  },
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        "fs/promises": false,
        path: false,
      };
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      fs: {
        browser: './lib/empty.ts',
      },
      'fs/promises': {
        browser: './lib/empty.ts',
      },
      path: {
        browser: './lib/empty.ts',
      },
    },
  },
}

export default nextConfig
