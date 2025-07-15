// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sua configuração existente
  reactStrictMode: true,

  // Adicione esta parte para autorizar as imagens do Supabase
  images: {
    remotePatterns: [
      {
        // Para a página de JOGADORES
        protocol: "https",
        hostname: "vwmnqzheqnejxkpxbvva.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/fotos-jogadores/**",
      },
      {
        // Para a página da GALERIA
        protocol: "https",
        hostname: "vwmnqzheqnejxkpxbvva.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/galeria/**",
      },
    ],
  },
};

export default nextConfig;