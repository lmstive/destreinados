// pages/admin/galeria.tsx
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { TrashIcon, PhotoIcon, PencilIcon } from '@heroicons/react/24/outline'; // Adicionado PencilIcon para editar

// Interface para o tipo de foto da galeria
interface FotoGaleria {
  id?: string; // id é opcional para novas fotos
  foto_url: string;
  legenda: string | null;
  created_at?: string;
}

const AdminGaleriaPage: React.FC = () => {
  const [fotos, setFotos] = useState<FotoGaleria[]>([]);
  const [novaFoto, setNovaFoto] = useState<FotoGaleria>({ foto_url: '', legenda: '' });
  const [editandoFoto, setEditandoFoto] = useState<FotoGaleria | null>(null); // NOVO ESTADO: para foto em edição
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Função para buscar fotos da galeria
  const fetchFotos = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('galeria_fotos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar fotos da galeria:', error);
      setError('Erro ao carregar fotos da galeria.');
    } else {
      setFotos(data || []);
    }
    setLoading(false);
  };

  // Carrega as fotos na montagem do componente
  useEffect(() => {
    fetchFotos();
  }, []);

  // Lidar com seleção de arquivo (apenas para nova foto)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null); // Limpa erros de seleção de arquivo
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  // Lidar com mudanças na legenda (para nova foto ou edição)
  const handleLegendaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editandoFoto) {
      setEditandoFoto({ ...editandoFoto, legenda: e.target.value });
    } else {
      setNovaFoto({ ...novaFoto, legenda: e.target.value });
    }
  };

  // Lidar com o envio do formulário (incluindo upload e edição)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploading(true);

    let finalFotoUrl: string | null = null;

    if (editandoFoto) {
      // Lógica de EDIÇÃO DE LEGENDA
      // Não há upload de nova foto aqui, apenas atualização da legenda.
      // A foto_url original do editandoFoto já é usada.
      finalFotoUrl = editandoFoto.foto_url;

      const { error: updateError } = await supabase
        .from('galeria_fotos')
        .update({ legenda: editandoFoto.legenda })
        .eq('id', editandoFoto.id);

      if (updateError) {
        console.error('Erro ao atualizar legenda:', updateError);
        setError(`Erro ao atualizar legenda: ${updateError.message}`);
      } else {
        setEditandoFoto(null); // Sai do modo de edição
        setNovaFoto({ foto_url: '', legenda: '' }); // Limpa o formulário
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchFotos(); // Recarrega a lista
      }
    } else {
      // Lógica de ADIÇÃO DE NOVA FOTO (com upload)
      if (!selectedFile) {
        setError('Por favor, selecione uma imagem para upload.');
        setUploading(false);
        return;
      }

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `galeria/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('fotos-jogadores')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Erro no upload da imagem:', uploadError);
        setError(`Erro no upload da imagem: ${uploadError.message}`);
        setUploading(false);
        return;
      }

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

      const { error: insertError } = await supabase
        .from('galeria_fotos')
        .insert([{ foto_url: finalFotoUrl, legenda: novaFoto.legenda || null }]);

      if (insertError) {
        console.error('Erro ao salvar no banco de dados:', insertError);
        setError(`Erro ao salvar no banco de dados: ${insertError.message}`);
      } else {
        setNovaFoto({ foto_url: '', legenda: '' });
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchFotos();
      }
    }
    setUploading(false);
  };

  // NOVO: Função para iniciar a edição
  const handleEdit = (foto: FotoGaleria) => {
    setEditandoFoto({ ...foto }); // Define a foto a ser editada
    setNovaFoto({ foto_url: '', legenda: '' }); // Limpa o formulário de nova foto
    setSelectedFile(null); // Não há arquivo selecionado em modo de edição
    setPreviewUrl(foto.foto_url); // Mostra o preview da foto original
    setError(null); // Limpa erros
  };

  // NOVO: Função para cancelar a edição
  const handleCancelEdit = () => {
    setEditandoFoto(null);
    setNovaFoto({ foto_url: '', legenda: '' });
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  // Deletar foto
  const handleDelete = async (id: string, fotoUrl: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta foto da galeria?')) {
      return;
    }
    setLoading(true);
    setError(null);

    // 1. Tenta deletar a foto do Storage
    try {
        const urlParts = fotoUrl.split('/');
        const filePathInStorage = urlParts.slice(urlParts.indexOf('public') + 1).join('/');

        const { error: deleteStorageError } = await supabase.storage
            .from('fotos-jogadores')
            .remove([filePathInStorage]);

        if (deleteStorageError) {
            console.warn('Aviso: Erro ao deletar foto do Storage, mas continuando a deletar o registro do DB:', deleteStorageError);
        }
    } catch (e) {
        console.warn('Erro ao processar URL da foto para deleção do Storage:', e);
    }

    // 2. Deleta o registro da foto no banco de dados
    const { error: deleteDbError } = await supabase
      .from('galeria_fotos')
      .delete()
      .eq('id', id);

    if (deleteDbError) {
      console.error('Erro ao deletar registro da foto:', deleteDbError);
      setError(`Erro ao deletar registro da foto: ${deleteDbError.message}`);
    } else {
      fetchFotos();
    }
    setLoading(false);
  };

  return (
    <Layout>
      <Head>
        <title>Destreinados FC - Gerenciar Galeria</title>
      </Head>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gerenciar Galeria de Fotos</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">
          {editandoFoto ? 'Editar Legenda da Foto' : 'Adicionar Nova Foto'} {/* Título dinâmico */}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campo de Upload da Foto - VISÍVEL APENAS PARA ADIÇÃO */}
          {!editandoFoto && (
            <div>
              <label htmlFor="foto" className="block text-gray-700 text-sm font-bold mb-2">
                Selecionar Imagem:
              </label>
              <input
                type="file"
                id="foto"
                name="foto"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                required // Foto é obrigatória para adicionar
              />
            </div>
          )}
          {/* Campo de Legenda - VALOR DINÂMICO PARA EDIÇÃO */}
          <div>
            <label htmlFor="legenda" className="block text-gray-700 text-sm font-bold mb-2">
              Legenda (Opcional):
            </label>
            <input
              type="text"
              id="legenda"
              name="legenda"
              value={editandoFoto ? editandoFoto.legenda || '' : novaFoto.legenda || ''} // Valor dinâmico
              onChange={handleLegendaChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ex: Jogo contra os Amigos do Bola"
            />
          </div>

          {/* Preview da Foto - VISÍVEL SEMPRE */}
          {(previewUrl || (editandoFoto && editandoFoto.foto_url)) && (
            <div className="md:col-span-2 mt-4 flex items-center space-x-2"> {/* Expandido para 2 colunas */}
              <p className="text-gray-600 text-sm">Preview:</p>
              <div className="relative w-24 h-24 overflow-hidden rounded-md border border-gray-300">
                <img src={previewUrl || (editandoFoto?.foto_url || '')} alt="Preview da Foto" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          {!selectedFile && !editandoFoto?.foto_url && !editandoFoto && (
            <div className="md:col-span-2 text-gray-500 text-xs mt-1">Nenhuma foto selecionada. Use o campo acima para fazer upload.</div>
          )}


          <div className="col-span-full flex justify-end space-x-2">
            {editandoFoto && ( // Botão Cancelar aparece apenas em modo de edição
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
              disabled={uploading || loading || (!editandoFoto && !selectedFile)} // Desabilita se está carregando/enviando, ou se é nova foto sem arquivo
            >
              {uploading ? 'Enviando...' : (editandoFoto ? 'Salvar Legenda' : 'Adicionar Foto à Galeria')} {/* Texto dinâmico */}
            </button>
          </div>
        </form>
      </div>

      <h2 className="text-2xl font-bold text-gray-700 mb-4">Fotos na Galeria</h2>
      {loading && <p className="text-gray-600">Carregando fotos...</p>}
      {!loading && fotos.length === 0 && (
        <p className="text-gray-600">Nenhuma foto na galeria. Use o formulário acima para adicionar!</p>
      )}
      {!loading && fotos.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative w-full h-40 bg-gray-200 rounded-lg overflow-hidden shadow-md group">
                <img
                  src={foto.foto_url}
                  alt={foto.legenda || 'Foto da Galeria'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-x-2">
                  {/* Botão de Editar Legenda */}
                  <button
                    onClick={() => handleEdit(foto)}
                    className="text-white bg-indigo-600 hover:bg-indigo-700 p-2 rounded-full"
                    title="Editar Legenda"
                  >
                    <PencilIcon className="h-6 w-6" />
                  </button>
                  {/* Botão de Deletar */}
                  <button
                    onClick={() => foto.id && handleDelete(foto.id, foto.foto_url)}
                    className="text-white bg-red-600 hover:bg-red-700 p-2 rounded-full"
                    title="Excluir Foto"
                  >
                    <TrashIcon className="h-6 w-6" />
                  </button>
                </div>
                {foto.legenda && (
                  <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
                    {foto.legenda}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href="/admin" className="text-blue-600 hover:underline mt-8 inline-block">
        ← Voltar para o Dashboard Admin
      </Link>
    </Layout>
  );
};

export default AdminGaleriaPage;