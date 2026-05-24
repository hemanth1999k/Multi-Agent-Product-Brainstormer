/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the archived Python prototype out of the build/type graph.
  outputFileTracingExcludes: {
    '*': ['./legacy/**/*'],
  },
};

export default nextConfig;
