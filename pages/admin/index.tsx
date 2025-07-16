// pages/admin/index.tsx

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout from '../../components/Layout'; // Ajuste o caminho se necessário
import Head from 'next/head';
import Link from 'next/link';

const AdminDashboardPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Não faz nada enquanto a sessão está carregando
    if (status === 'loading') return;
    
    // Se não houver sessão (não está logado como admin), redireciona para a home
    if (!session) {
      router.push('/');
    }
  }, [session, status, router]);

  // Mostra uma mensagem de carregamento enquanto a sessão é verificada
  // Isso evita um "flash" da página antes do redirecionamento
  if (status === 'loading' || !session) {
    return <Layout><p>Verificando permissão...</p></Layout>;
  }

  // Se a sessão for válida e o usuário for um admin, mostra o conteúdo
  return (
    <Layout>
      <Head>
        <title>Destreinados FC - Dashboard Admin</title>
      </Head>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Bem-vindo, {session.user?.name}!</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <p className="text-gray-700 mb-4">
          Esta é a área restrita para gerenciamento do site do Destreinados FC.
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          {/* NOVO LINK PARA O CONTROLE FINANCEIRO */}
          <li><Link href="/admin/financeiro" className="text-blue-600 hover:underline font-semibold">Controle Financeiro</Link></li>
          <li><Link href="/admin/presenca" className="text-blue-600 hover:underline font-semibold">Gerar Mensagem de Confirmação de Presença</Link></li>
          <li><Link href="/admin/jogadores" className="text-blue-600 hover:underline">Gerenciar Jogadores</Link></li>
          <li><Link href="/admin/galeria" className="text-blue-600 hover:underline">Gerenciar Galeria de Fotos</Link></li>
          <li><Link href="/admin/pedidos" className="text-blue-600 hover:underline">Gerenciar Pedidos</Link></li>
        </ul>
      </div>
    </Layout>
  );
};

export default AdminDashboardPage;