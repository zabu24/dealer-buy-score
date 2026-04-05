/** @type {import('next').NextConfig} */
const nextConfig = {
  // Raise body limit for bill-of-sale uploads (PDFs + images up to 10 MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '11mb',
    },
  },
}

module.exports = nextConfig
