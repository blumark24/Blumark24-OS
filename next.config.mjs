/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose server-side env vars to the browser.
  // Vercel allows both SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL.
  // This mapping ensures the client-side code always finds them regardless of which name was used.
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
  },
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
  images: {
    domains: ["ui-avatars.com", "images.unsplash.com"],
  },
};

export default nextConfig;
