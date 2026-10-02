/** @type {import('next').NextConfig} */
export default {
  experimental: {
    serverActions: { bodySizeLimit: '1mb' },
  },
};
