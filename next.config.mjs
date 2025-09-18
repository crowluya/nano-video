import withBundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => [
    {
      source: "/dashboard",
      destination: "/dashboard/settings",
      permanent: true,
    },
    {
      source: "/zh/dashboard",
      destination: "/zh/dashboard/settings",
      permanent: true,
    },
    {
      source: "/ja/dashboard",
      destination: "/ja/dashboard/settings",
      permanent: true,
    },
  ],
  images: {
    unoptimized:
      process.env.NEXT_PUBLIC_OPTIMIZED_IMAGES &&
      process.env.NEXT_PUBLIC_OPTIMIZED_IMAGES === "false",
    remotePatterns: [
      ...(process.env.R2_PUBLIC_URL
        ? [
            {
              hostname: process.env.R2_PUBLIC_URL.replace("https://", ""),
            },
          ]
        : []),
    ],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error"],
          }
        : false,
  },
};

const withBundleAnalyzerWrapper = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

if (
  process.env.NODE_ENV === "development" &&
  !process.env.NEXTY_WELCOME_SHOWN
) {
  console.log("\n🎉 Welcome to Nexty Boilerplate!");
  console.log("💬 Join our Discord community: https://discord.gg/VRDxBgXUZ8");
  console.log("📚 Documentation: https://nexty.dev/docs\n\n");
  process.env.NEXTY_WELCOME_SHOWN = "true";
}

export default withBundleAnalyzerWrapper(withNextIntl(nextConfig));
