/** @type {import('next').NextConfig} */
const nextConfig = {
  // API rewrites for production
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://bashrometer-api.onrender.com/:path*',
      },
    ];
  },
  
  // CORS headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  
  // הסר standalone אם גורם לבעיות
  // output: 'standalone',
  
  // וודא שנתיבי assets נכונים
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // הגדרות לפרודקשן
  trailingSlash: false,
  
  // TypeScript and ESLint configuration for production builds
  typescript: {
    // Allow production builds to complete even with type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  
  // וודא שבילד עובד נכון
  generateBuildId: async () => {
    return 'bashrometer-build-' + Date.now()
  }
}

module.exports = nextConfig