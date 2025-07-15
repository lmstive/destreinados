// components/Layout.tsx

import React, { ReactNode } from 'react';
import Head from 'next/head'; // 1. IMPORTAMOS O COMPONENTE 'Head'
import Navbar from './Navbar';
import Footer from './Footer';

// 2. ATUALIZAMOS A INTERFACE PARA ACEITAR 'title'
interface LayoutProps {
  children: ReactNode;
  title?: string; // O '?' torna a propriedade opcional
}

// 3. RECEBEMOS 'title' E DAMOS UM VALOR PADRÃO
const Layout: React.FC<LayoutProps> = ({ children, title = "Destreinados FC" }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;