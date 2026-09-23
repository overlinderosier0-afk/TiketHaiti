import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Requis pour le Dockerfile : produit un serveur Node autonome
  // dans .next/standalone (dépendances tracées automatiquement).
  output: 'standalone'
};

export default nextConfig;
