// components/Navbar.tsx

import { useState } from 'react'; // Importa o useState para controlar o menu
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import LoginBtn from './LoginBtn';


const Navbar: React.FC = () => {
  const { data: session } = useSession();
  const [menuAberto, setMenuAberto] = useState(false); // Estado para o menu mobile

  return (
    <nav className="bg-gray-800 p-4 text-white relative"> {/* Adicionado 'relative' para o menu dropdown */}
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2" onClick={() => setMenuAberto(false)}>
          <Image
            src="/logo.png"
            alt="Logo Destreinados FC"
            width={50}
            height={50}
            className="rounded-full"
          />
          <span className="text-xl font-bold">Destreinados FC</span>
        </Link>

        {/* Links para Desktop */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-gray-300">Início</Link>
            <Link href="/jogadores" className="hover:text-gray-300">Time</Link>
            <Link href="/pedidos" className="hover:text-gray-300">Pedidos</Link>
            <Link href="/galeria" className="hover:text-gray-300">Galeria</Link>
            <Link href="/sorteio" className="hover:text-gray-300">Sorteio</Link>
            <Link href="/contato" className="hover:text-gray-300">Contato</Link>

            {session && (
              <Link href="/admin" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-md transition-colors">
                Painel Admin
              </Link>
            )}
          </div>
          <LoginBtn />
        </div>

        {/* Botão Hambúrguer para Mobile */}
        <div className="md:hidden">
          <button onClick={() => setMenuAberto(!menuAberto)} aria-label="Abrir menu">
            {menuAberto ? (
              // Ícone "X" para fechar
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
              // Ícone "Hambúrguer" para abrir
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            )}
          </button>
        </div>
      </div>

      {/* Menu Mobile Dropdown */}
      {menuAberto && (
        <div className="md:hidden absolute top-full left-0 w-full bg-gray-800 z-20">
          <div className="flex flex-col items-center p-4 space-y-4">
            <Link href="/" onClick={() => setMenuAberto(false)} className="hover:text-gray-300">Início</Link>
            <Link href="/jogadores" onClick={() => setMenuAberto(false)} className="hover:text-gray-300">Time</Link>
            <Link href="/pedidos" onClick={() => setMenuAberto(false)} className="hover:text-gray-300">Pedidos</Link>
            <Link href="/galeria" onClick={() => setMenuAberto(false)} className="hover:text-gray-300">Galeria</Link>
            <Link href="/contato" onClick={() => setMenuAberto(false)} className="hover:text-gray-300">Contato</Link>
            
            <div className="border-t border-gray-700 w-full my-2"></div>

            {session && (
              <Link href="/admin" onClick={() => setMenuAberto(false)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors w-full text-center">
                Painel Admin
              </Link>
            )}
            <div className="w-full">
              <LoginBtn />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;