import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sua configuração existente
  reactStrictMode: true,

  // Adicione esta parte para autorizar as imagens do Supabase
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vwmnqzheqnejxkpxbvva.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/fotos-jogadores/**",
      },
    ],
  },
};

export default nextConfig;
