/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['*'] },
  },
  images: {
    domains: ['ui-avatars.com', 'images.unsplash.com'],
  },
};

export default nextConfig;
