import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      // Removed duplicate admin entry points.
      { source: '/admin/dashboard', destination: '/admin', permanent: false },
      {
        source: '/admin/dashboard/:path*',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/admin/admins',
        destination: '/admin/manage',
        permanent: false,
      },
      {
        source: '/admin/admins/:path*',
        destination: '/admin/manage',
        permanent: false,
      },
      // The standalone club settings page duplicated /admin/settings.
      {
        source: '/club-settings',
        destination: '/admin/settings',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
