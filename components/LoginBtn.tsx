// components/LoginBtn.tsx

import { useSession, signIn, signOut } from 'next-auth/react';

export default function LoginBtn() {
  const { data: session, status } = useSession();

  // Você pode adicionar os console.log aqui para testar se precisar
  // console.log("STATUS ATUAL:", status);
  // console.log("DADOS DA SESSÃO:", session);

  if (status === 'loading') {
    return <p className="text-sm text-gray-500">Carregando...</p>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-gray-700 hidden sm:block">Olá, {session.user?.name}</span>
        <button
          onClick={() => signOut()}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
    >
      Entrar como Admin
    </button>
  );
}