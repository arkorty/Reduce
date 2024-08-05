/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:id",
        destination: `/api/redirect/:id`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
