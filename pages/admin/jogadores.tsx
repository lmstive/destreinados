// pages/admin/jogadores.tsx

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';

// Define o tipo de um jogador para segurança de dados com TypeScript
type Jogador = {
  id: number;
  nome: string;
  posicao: string;
  numero: number | null;
  imagem_url: string | null;
};

// Define o tipo para os valores do formulário de edição
type EditFormValues = {
  nome: string;
  posicao: string;
  numero: string;
  imagem_url: string;
};

const GerenciarJogadores = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  // --- State para o formulário de ADICIONAR ---
  const [nome, setNome] = useState('');
  const [posicao, setPosicao] = useState('');
  const [numero, setNumero] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  
  const [loading, setLoading] = useState(true);

  // --- State para controlar a EDIÇÃO ---
  const [editingJogador, setEditingJogador] = useState<Jogador | null>(null);
  const [editValues, setEditValues] = useState<EditFormValues>({ nome: '', posicao: '', numero: '', imagem_url: '' });

  // Segurança: Protege a página
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/');
  }, [session, status, router]);

  // Função para buscar os jogadores no banco de dados
  const fetchJogadores = async () => {
    setLoading(true);
    const { data: jogadoresData, error } = await supabase
      .from('jogadores')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar jogadores:', error);
    } else if (jogadoresData) {
      setJogadores(jogadoresData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJogadores();
  }, []);

  // Função para ADICIONAR um novo jogador
  const handleAddJogador = async (e: FormEvent) => {
    e.preventDefault();
    // ... (código existente sem alterações) ...
  };
  
  // Função para DELETAR um jogador
  const handleDeleteJogador = async (id: number) => {
    // ... (código existente sem alterações) ...
  };

  // --- Novas Funções para EDITAR ---

  // Prepara o formulário de edição quando o botão "Editar" é clicado
  const handleStartEdit = (jogador: Jogador) => {
    setEditingJogador(jogador);
    setEditValues({
      nome: jogador.nome,
      posicao: jogador.posicao,
      numero: jogador.numero?.toString() || '',
      imagem_url: jogador.imagem_url || '',
    });
  };

  // Cancela a edição e volta à visualização normal
  const handleCancelEdit = () => {
    setEditingJogador(null);
  };

  // Envia as atualizações para o Supabase
  const handleUpdateJogador = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingJogador) return;

    const { error } = await supabase
      .from('jogadores')
      .update({
        nome: editValues.nome,
        posicao: editValues.posicao,
        numero: editValues.numero ? parseInt(editValues.numero, 10) : null,
        imagem_url: editValues.imagem_url || null,
      })
      .match({ id: editingJogador.id });

    if (error) {
      console.error('Erro ao atualizar jogador:', error);
      alert('Falha ao atualizar jogador.');
    } else {
      setEditingJogador(null); // Fecha o modo de edição
      await fetchJogadores(); // Atualiza a lista
    }
  };

  // Atualiza os valores do formulário de edição em tempo real
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues(prev => ({ ...prev, [name]: value }));
  };


  if (status === 'loading' || !session) {
    return <Layout><p>Verificando permissão...</p></Layout>;
  }

  return (
    <Layout title="Gerenciar Jogadores">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gerenciar Jogadores</h1>

      {/* Formulário para adicionar jogador (sem alterações) */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        {/* ... (código do formulário de adicionar) ... */}
      </div>

      {/* Lista de jogadores com lógica de edição */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Elenco Atual</h2>
        {loading ? (
          <p>Carregando elenco...</p>
        ) : (
          <div className="space-y-2">
            {jogadores.map((jogador) => (
              <div key={jogador.id}>
                {editingJogador?.id === jogador.id ? (
                  // --- MODO DE EDIÇÃO ---
                  <form onSubmit={handleUpdateJogador} className="p-3 bg-blue-50 rounded border border-blue-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                      <input type="text" name="nome" value={editValues.nome} onChange={handleEditChange} className="p-2 border rounded" />
                      <input type="text" name="posicao" value={editValues.posicao} onChange={handleEditChange} className="p-2 border rounded" />
                      <input type="number" name="numero" value={editValues.numero} onChange={handleEditChange} className="p-2 border rounded" />
                      <input type="url" name="imagem_url" value={editValues.imagem_url} onChange={handleEditChange} className="p-2 border rounded" placeholder="URL da imagem" />
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Salvar</button>
                      <button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">Cancelar</button>
                    </div>
                  </form>
                ) : (
                  // --- MODO DE VISUALIZAÇÃO NORMAL ---
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={jogador.imagem_url || '/jogadores/jogador-padrao.jpg'}
                        alt={`Foto de ${jogador.nome}`}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                      {/* DIV com a CORREÇÃO da cor do texto */}
                      <div className="text-gray-800"> 
                        <span className="font-bold">{jogador.nome}</span>
                        <span className="text-gray-600"> - {jogador.posicao}</span>
                        {jogador.numero && <span className="text-gray-500 italic"> (#{jogador.numero})</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => handleStartEdit(jogador)} className="text-blue-500 hover:text-blue-700 font-semibold text-sm">
                        Editar
                      </button>
                      <button onClick={() => handleDeleteJogador(jogador.id)} className="text-red-500 hover:text-red-700 font-semibold text-sm">
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GerenciarJogadores;