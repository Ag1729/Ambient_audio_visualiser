/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Use the correct repository name
  basePath: process.env.NODE_ENV === "production" ? "/your-repo-name" : "",
  // This is important for GitHub Pages
  assetPrefix: process.env.NODE_ENV === "production" ? "/your-repo-name/" : "",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure CSS is properly included
  webpack: (config) => {
    return config
  },
}

module.exports = nextConfig
