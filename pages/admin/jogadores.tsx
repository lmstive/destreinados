// pages/admin/jogadores.tsx
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { TrashIcon, PencilIcon, PhotoIcon } from '@heroicons/react/24/outline'; // Adicionado PhotoIcon


// Interface para o tipo de jogador
interface Jogador {
  id?: string; // id é opcional para novos jogadores
  nome: string;
  apelido: string | null;
  aniversario: string;
  foto_url: string | null;
  created_at?: string;
}

const AdminJogadoresPage: React.FC = () => {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [novoJogador, setNovoJogador] = useState<Jogador>({
    nome: '',
    apelido: '',
    aniversario: '',
    foto_url: null, // foto_url agora pode ser null por padrão
  });
  const [editandoJogador, setEditandoJogador] = useState<Jogador | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false); // Novo estado para upload
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Novo estado para o arquivo selecionado
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Novo estado para URL de preview

  // Função para buscar jogadores
  const fetchJogadores = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('jogadores')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar jogadores:', error);
      setError('Erro ao carregar jogadores.');
    } else {
      setJogadores(data || []);
    }
    setLoading(false);
  };

  // Carrega os jogadores na montagem do componente
  useEffect(() => {
    fetchJogadores();
  }, []);

  // Lidar com seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Cria URL para preview
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  // Lidar com mudanças nos campos de texto
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editandoJogador) {
      setEditandoJogador({ ...editandoJogador, [name]: value });
    } else {
      setNovoJogador({ ...novoJogador, [name]: value });
    }
  };

  // Lidar com o envio do formulário (incluindo upload)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploading(true); // Ativa o estado de upload

    let finalFotoUrl: string | null = null; // Variável para armazenar a URL final da foto

    // Lógica de Upload da Foto
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`; // Nome único para o arquivo
      const filePath = `jogadores/${fileName}`; // Caminho dentro do bucket 'fotos-jogadores'

      const { data, error: uploadError } = await supabase.storage
        .from('fotos-jogadores') // Nome do bucket que você criou
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false, // Não sobrescrever se já existir (podemos mudar para true se quiser)
        });

      if (uploadError) {
        console.error('Erro no upload da imagem:', uploadError);
        setError(`Erro no upload da imagem: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      // Obtém a URL pública da imagem carregada
      const { data: publicUrlData } = supabase.storage
        .from('fotos-jogadores')
        .getPublicUrl(filePath);

      if (publicUrlData) {
        finalFotoUrl = publicUrlData.publicUrl;
      } else {
        setError('Não foi possível obter a URL pública da imagem.');
        setUploading(false);
        return;
      }
    } else if (editandoJogador) {
      // Se não houver novo arquivo, mantém a URL existente do jogador em edição
      finalFotoUrl = editandoJogador.foto_url;
    }

    // Lógica de Adição ou Edição de Jogador no Banco de Dados
    const playerDataToSave = {
      ... (editandoJogador ? editandoJogador : novoJogador),
      foto_url: finalFotoUrl, // Usa a URL obtida do upload ou a existente
    };

    if (editandoJogador) {
      // Lógica de Edição
      const { id, created_at, ...updates } = playerDataToSave; // Não atualiza id ou created_at
      const { error: updateError } = await supabase
        .from('jogadores')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error('Erro ao atualizar jogador:', updateError);
        setError(`Erro ao atualizar jogador: ${updateError.message}`);
      } else {
        setEditandoJogador(null);
        setNovoJogador({ nome: '', apelido: '', aniversario: '', foto_url: null });
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchJogadores();
      }
    } else {
      // Lógica de Adição
      if (!playerDataToSave.nome || !playerDataToSave.aniversario) {
        setError('Nome e Aniversário são obrigatórios.');
        setUploading(false); // Desativa upload em caso de erro de validação local
        return;
      }
      const { data, error: insertError } = await supabase
        .from('jogadores')
        .insert([playerDataToSave]);

      if (insertError) {
        console.error('Erro ao adicionar jogador:', insertError);
        setError(`Erro ao adicionar jogador: ${insertError.message}`);
      } else {
        setNovoJogador({ nome: '', apelido: '', aniversario: '', foto_url: null });
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchJogadores();
      }
    }
    setUploading(false); // Desativa o estado de upload ao final
  };

  // Iniciar edição
  const handleEdit = (jogador: Jogador) => {
    setEditandoJogador({ ...jogador });
    setSelectedFile(null); // Reseta o arquivo selecionado ao editar
    setPreviewUrl(jogador.foto_url); // Mostra a URL existente para preview
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditandoJogador(null);
    setNovoJogador({ nome: '', apelido: '', aniversario: '', foto_url: null });
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  // Deletar jogador
  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este jogador?')) {
      return;
    }
    setLoading(true);
    setError(null);

    // Primeiro, tenta deletar a foto do Storage, se houver uma foto_url
    const jogadorParaDeletar = jogadores.find(j => j.id === id);
    if (jogadorParaDeletar && jogadorParaDeletar.foto_url) {
        try {
            // Extrai o caminho do arquivo do URL
            const urlParts = jogadorParaDeletar.foto_url.split('/');
            const filePathInStorage = urlParts.slice(urlParts.indexOf('public') + 1).join('/'); // "public" é o prefixo que o Supabase adiciona

            const { error: deleteStorageError } = await supabase.storage
                .from('fotos-jogadores')
                .remove([filePathInStorage]);

            if (deleteStorageError) {
                console.warn('Aviso: Erro ao deletar foto do Storage, mas continuando a deletar o registro do jogador:', deleteStorageError);
                // Não consideramos isso um erro fatal para a deleção do jogador
            }
        } catch (e) {
            console.warn('Erro ao processar URL da foto para deleção do Storage:', e);
        }
    }

    // Depois, deleta o registro do jogador no banco de dados
    const { error } = await supabase
      .from('jogadores')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar jogador:', error);
      setError(`Erro ao deletar jogador: ${error.message}`);
    } else {
      fetchJogadores();
    }
    setLoading(false);
  };

  return (
    <Layout>
      <Head>
        <title>Destreinados FC - Gerenciar Jogadores</title>
      </Head>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gerenciar Jogadores</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">
          {editandoJogador ? 'Editar Jogador' : 'Adicionar Novo Jogador'}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nome" className="block text-gray-700 text-sm font-bold mb-2">
              Nome Completo:
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={editandoJogador ? editandoJogador.nome : novoJogador.nome}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label htmlFor="apelido" className="block text-gray-700 text-sm font-bold mb-2">
              Apelido:
            </label>
            <input
              type="text"
              id="apelido"
              name="apelido"
              value={editandoJogador ? editandoJogador.apelido || '' : novoJogador.apelido || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label htmlFor="aniversario" className="block text-gray-700 text-sm font-bold mb-2">
              Aniversário (DD/MM):
            </label>
            <input
              type="text"
              id="aniversario"
              name="aniversario"
              value={editandoJogador ? editandoJogador.aniversario : novoJogador.aniversario}
              onChange={handleChange}
              placeholder="Ex: 01/01"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          {/* CAMPO DE UPLOAD DA FOTO */}
          <div>
            <label htmlFor="foto" className="block text-gray-700 text-sm font-bold mb-2">
              Foto do Jogador:
            </label>
            <input
              type="file" // Tipo de input agora é 'file'
              id="foto"
              name="foto"
              accept="image/*" // Aceita apenas arquivos de imagem
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            />
            {(previewUrl || (editandoJogador && editandoJogador.foto_url)) && (
              <div className="mt-4 flex items-center space-x-2">
                <p className="text-gray-600 text-sm">Preview:</p>
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <Image
                    src={previewUrl || (editandoJogador?.foto_url || '/jogadores/jogador-padrao.jpg')}
                    alt="Preview da Foto"
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              </div>
            )}
            {!selectedFile && !editandoJogador?.foto_url && (
                <p className="text-gray-500 text-xs mt-1">Nenhuma foto selecionada. Use o campo acima para fazer upload.</p>
            )}
          </div>
          <div className="col-span-full flex justify-end space-x-2">
            {editandoJogador && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={uploading || loading} // Desabilita enquanto estiver carregando ou fazendo upload
            >
              {uploading ? 'Enviando Foto...' : (editandoJogador ? 'Salvar Edição' : 'Adicionar Jogador')}
            </button>
          </div>
        </form>
      </div>

      <h2 className="text-2xl font-bold text-gray-700 mb-4">Lista de Jogadores</h2>
      {loading && <p className="text-gray-600">Carregando jogadores...</p>}
      {!loading && jogadores.length === 0 && (
        <p className="text-gray-600">Nenhum jogador cadastrado. Use o formulário acima para adicionar!</p>
      )}
      {!loading && jogadores.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apelido
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aniversário
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Foto
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jogadores.map((jogador) => (
                <tr key={jogador.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {jogador.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {jogador.apelido || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {jogador.aniversario}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {jogador.foto_url ? (
                      <a href={jogador.foto_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                        <PhotoIcon className="h-5 w-5 mr-1 text-blue-500" /> Ver
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex space-x-2 justify-end">
                    <button
                      onClick={() => handleEdit(jogador)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-gray-100"
                      title="Editar"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => jogador.id && handleDelete(jogador.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-gray-100"
                      title="Excluir"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

          <Link href="/admin" className="text-blue-600 hover:underline mt-8 inline-block">
            ← Voltar para o Dashboard Admin
          </Link>
        </Layout>
      );
    };

    export default AdminJogadoresPage;
 