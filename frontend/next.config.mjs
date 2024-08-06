/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:id([a-zA-Z0-9]{6})", // Match only 6-character IDs
        destination: `/api/redirect/:id`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
