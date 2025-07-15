// pages/admin/jogadores.tsx

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase'; // Importa nosso cliente supabase

// Define o tipo de um jogador para segurança de dados com TypeScript
type Jogador = {
  id: number;
  nome: string;
  posicao: string;
  numero: number | null;
  imagem_url: string | null;
};

const GerenciarJogadores = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [nome, setNome] = useState('');
  const [posicao, setPosicao] = useState('');
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(true);

  // Segurança: Protege a página
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/');
  }, [session, status, router]);

  // Função para buscar os jogadores no banco de dados
  const fetchJogadores = async () => {
    setLoading(true);
    const { data: jogadoresData, error } = await supabase
      .from('jogadores') // IMPORTANTE: sua tabela no supabase deve se chamar 'jogadores'
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar jogadores:', error);
    } else if (jogadoresData) {
      setJogadores(jogadoresData);
    }
    setLoading(false);
  };

  // Busca os jogadores quando a página carrega
  useEffect(() => {
    fetchJogadores();
  }, []);

  // Função para adicionar um novo jogador
  const handleAddJogador = async (e: FormEvent) => {
    e.preventDefault();
    if (!nome || !posicao) {
      alert('Nome e Posição são obrigatórios.');
      return;
    }

    const { error } = await supabase
      .from('jogadores')
      .insert({ nome, posicao, numero: numero ? parseInt(numero, 10) : null });

    if (error) {
      console.error('Erro ao adicionar jogador:', error);
    } else {
      setNome('');
      setPosicao('');
      setNumero('');
      await fetchJogadores(); // Atualiza a lista
    }
  };
  
  // Função para deletar um jogador
  const handleDeleteJogador = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este jogador?')) {
      const { error } = await supabase
        .from('jogadores')
        .delete()
        .match({ id });

      if (error) {
        console.error('Erro ao deletar jogador:', error);
      } else {
        await fetchJogadores(); // Atualiza a lista
      }
    }
  };

  if (status === 'loading' || !session) {
    return <Layout><p>Verificando permissão...</p></Layout>;
  }

  return (
    <Layout title="Gerenciar Jogadores">
      <h1 className="text-3xl font-bold mb-6">Gerenciar Jogadores</h1>

      {/* Formulário para adicionar jogador */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <form onSubmit={handleAddJogador}>
          <h2 className="text-2xl font-semibold mb-4">Adicionar Novo Jogador</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Nome do jogador" value={nome} onChange={(e) => setNome(e.target.value)} className="p-2 border rounded" required />
            <input type="text" placeholder="Posição" value={posicao} onChange={(e) => setPosicao(e.target.value)} className="p-2 border rounded" required />
            <input type="number" placeholder="Número (opcional)" value={numero} onChange={(e) => setNumero(e.target.value)} className="p-2 border rounded" />
          </div>
          <button type="submit" className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            Adicionar Jogador
          </button>
        </form>
      </div>

      {/* Lista de jogadores */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Elenco Atual</h2>
        {loading ? (
          <p>Carregando elenco...</p>
        ) : (
          <div className="space-y-2">
            {jogadores.map((jogador) => (
              <div key={jogador.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-bold">{jogador.nome}</span>
                  <span className="text-gray-600"> - {jogador.posicao}</span>
                  {jogador.numero && <span className="text-gray-500 italic"> (#{jogador.numero})</span>}
                </div>
                <button onClick={() => handleDeleteJogador(jogador.id)} className="text-red-500 hover:text-red-700">
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GerenciarJogadores;