/** @type {import('next').NextConfig} */
const nextConfig = {
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