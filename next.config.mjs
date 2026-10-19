const assetFallbackUrl = (process.env.NEXT_PUBLIC_ASSET_FALLBACK_URL || "https://estore.bharathelectronics.in").replace(/\/+$/, "");
let assetHostname = "estore.bharathelectronics.in";
try {
  assetHostname = new URL(assetFallbackUrl).hostname;
} catch (e) {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  staticPageGenerationTimeout: 180,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "bea.thamirabaranithiruvizha.in",
        pathname: "/uploads/**",
      },
      {
        protocol: assetFallbackUrl.startsWith("http:") ? "http" : "https",
        hostname: assetHostname,
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "213.165.95.239",
        pathname: "/uploads/**",
      },
    ],
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: "/uploads/products/:path*",
          destination: `${assetFallbackUrl}/uploads/products/:path*`,
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/products",
        destination: "/",
        permanent: true,
      },
      {
        source: "/products/:slug",
        destination: "/product/:slug",
        permanent: true,
      },
      // Legacy SMS / bookmark account URLs
      {
        source: "/user/orders",
        destination: "/orders",
        permanent: true,
      },
      {
        source: "/user/profile",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/viewcart",
        destination: "/cart",
        permanent: true,
      },
      {
        source: "/search/:term",
        destination: "/search?query=:term",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/?login=1",
        permanent: false,
      },
      {
        source: "/register",
        destination: "/?register=1",
        permanent: false,
      },
      {
        source: "/loyalty",
        destination: "/",
        permanent: false,
      },
      {
        source: "/enquiry",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/gift-product",
        destination: "/deals-offer",
        permanent: true,
      },
      {
        source: "/sitemap",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/weekend-offer",
        destination: "/deals-offer",
        permanent: true,
      },
      {
        source: "/offer/weekend-offer",
        destination: "/deals-offer",
        permanent: true,
      },
      {
        source: "/bundle-offer",
        destination: "/category/combo-offers",
        permanent: true,
      },
      {
        source: "/bundle-offers",
        destination: "/category/combo-offers",
        permanent: true,
      },
      {
        source: "/combo-offers",
        destination: "/category/combo-offers",
        permanent: true,
      },
      {
        source: "/big-discounts",
        destination: "/deals-offer",
        permanent: true,
      },
      {
        source: "/brand",
        destination: "/",
        permanent: true,
      },
      {
        source: "/all-brands",
        destination: "/brands",
        permanent: true,
      },
      {
        source: "/location",
        destination: "/all/stores",
        permanent: true,
      },
      // Legacy category-division pages (MySQL category_division table not fully migrated)
      {
        source: "/category-division/mobiles-wearables",
        destination: "/search?query=mobile",
        permanent: false,
      },
      {
        source: "/category-division/tv-accessories",
        destination: "/search?query=tv",
        permanent: false,
      },
      {
        source: "/category-division/appliances",
        destination: "/search?query=appliances",
        permanent: false,
      },
      {
        source: "/category-division/home-theatre-speakers",
        destination: "/search?query=speaker",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
