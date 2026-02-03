const nextConfig = require("eslint-config-next");

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  ...nextConfig,
  {
    rules: {
      "react-hooks/exhaustive-deps":
        process.env.NODE_ENV === "production" ? "off" : "warn",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
    },
  },
];
