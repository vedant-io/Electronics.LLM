/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:3050/api/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://backend:3050/socket.io/:path*',
      }
    ];
  },
}

export default nextConfig
