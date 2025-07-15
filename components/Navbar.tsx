// components/Navbar.tsx

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react'; // 1. Importamos a ferramenta para verificar o login
import LoginBtn from './LoginBtn'; // 2. Importamos o nosso botão inteligente

const Navbar: React.FC = () => {
  // 3. Pegamos a sessão para saber se o admin está logado
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo do Destreinados FC - Mantido exatamente como o seu original */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/logo.png"
            alt="Logo Destreinados FC"
            width={50}
            height={50}
            className="rounded-full"
          />
          <span className="text-xl font-bold">Destreinados FC</span>
        </Link>

        {/* Links de Navegação e Botão de Login */}
        <div className="flex items-center space-x-6"> {/* Aumentei o space-x para acomodar melhor */}
          
          {/* Seus links de menu - Mantidos exatamente como os seus originais */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="hover:text-gray-300">
              Início
            </Link>
            {/* Corrigi o link de "Time" para apontar para /time */}
            <Link href="/jogadores" className="hover:text-gray-300">
              Time
            </Link>
            <Link href="/pedidos" className="hover:text-gray-300">
              Pedidos
            </Link>
            <Link href="/galeria" className="hover:text-gray-300">
              Galeria
            </Link>
            <Link href="/contato" className="hover:text-gray-300">
              Contato
            </Link>

            {/* O LINK MÁGICO: Só aparece se a sessão de admin existir */}
            {session && (
              <Link href="/admin" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-md transition-colors">
                Painel Admin
              </Link>
            )}
          </div>

          {/* O Botão Inteligente de Login/Logout */}
          <LoginBtn />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;