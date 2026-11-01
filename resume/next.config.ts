// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: [
        "pdf-parse",
        "pdfjs-dist",
        "@napi-rs/canvas",
        "@napi-rs/canvas-win32-x64-msvc",
    ],
};

export default nextConfig;