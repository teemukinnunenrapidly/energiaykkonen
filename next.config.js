/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Ensure Turbopack treats this folder as the project root.
    root: __dirname,
  },
};

module.exports = nextConfig;
