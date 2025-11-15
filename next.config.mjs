// next.config.mjs
/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,

  experimental: {
    // ตัวเลือกทดลอง (คงไว้ตามต้องการ)
    // wasm: false,
    // modern: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    // หากต้องการปิด static image imports ไว้ตามเดิม
    disableStaticImages: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  webpack(config, { isServer }) {
    // ใช้ SVG เป็น React component: import Icon from './icon.svg?component'
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      resourceQuery: /component/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgo: true,
            titleProp: true,
            ref: true,
            svgoConfig: {
              plugins: [
                'preset-default',
                { name: 'removeViewBox', active: false },
                { name: 'removeDimensions', active: true },
              ],
            },
          },
        },
      ],
    });

    // ใช้ SVG เป็น URL ปกติ: import iconUrl from './icon.svg'
    config.module.rules.push({
      test: /\.svg$/i,
      type: 'asset',
      resourceQuery: { not: [/component/] },
    });

    // fallback สำหรับฝั่ง client
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
      };
    }

    return config;
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS, PUT, DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },

  async redirects() {
    return [];
  },

  env: {
    // ใส่ ENV ที่ต้องการ
  },
};
