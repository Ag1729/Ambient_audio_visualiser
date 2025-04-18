/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // If your GitHub repo is not at the root of your domain, add the repo name here
  basePath: process.env.NODE_ENV === "production" ? "/repo-name" : "",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
