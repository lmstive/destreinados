// pages/admin/galeria.tsx

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';

type Foto = {
  id: number;
  foto_url: string;
  legenda: string | null;
  file_path: string;
};

const GerenciarGaleria = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [newFotoFile, setNewFotoFile] = useState<File | null>(null);
  const [newLegenda, setNewLegenda] = useState('');

  const [editingFoto, setEditingFoto] = useState<Foto | null>(null);
  const [editingLegenda, setEditingLegenda] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/');
  }, [session, status, router]);

  const fetchFotos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('galeria_fotos').select('*').order('created_at', { ascending: false });
    if (error) console.error('Erro ao buscar fotos:', error);
    else if (data) setFotos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFotos();
  }, []);

  const handleAddFoto = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFotoFile) return alert('Por favor, selecione uma foto para enviar.');

    try {
      setUploading(true);
      // CORREÇÃO 1: Ajustado o caminho para salvar na pasta 'galeria'
      const filePath = `galeria/${Date.now()}-${newFotoFile.name}`; 
      
      // CORREÇÃO 2: Alterado o nome do bucket de 'galeria' para 'fotos-jogadores'
      const { error: uploadError } = await supabase.storage.from('fotos-jogadores').upload(filePath, newFotoFile);
      if (uploadError) throw uploadError;

      // CORREÇÃO 3: Alterado o nome do bucket aqui também
      const { data: urlData } = supabase.storage.from('fotos-jogadores').getPublicUrl(filePath);
      
      const { error: insertError } = await supabase.from('galeria_fotos').insert({
        foto_url: urlData.publicUrl,
        legenda: newLegenda || null,
        file_path: filePath,
      });
      if (insertError) throw insertError;

      setNewFotoFile(null);
      setNewLegenda('');
      
      const fileInput = document.querySelector<HTMLInputElement>('#foto-input');
      if (fileInput) {
        fileInput.value = '';
      }
      
      await fetchFotos();

    } catch (error) {
      console.error('Erro ao adicionar foto:', error);
      alert('Falha ao adicionar foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFoto = async (foto: Foto) => {
    if (!window.confirm('Tem certeza que deseja excluir esta foto? A ação não pode ser desfeita.')) return;
    try {
      // CORREÇÃO 4: Alterado o nome do bucket para a exclusão funcionar
      const { error: storageError } = await supabase.storage.from('fotos-jogadores').remove([foto.file_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('galeria_fotos').delete().match({ id: foto.id });
      if (dbError) throw dbError;

      await fetchFotos();
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      alert('Falha ao deletar a foto.');
    }
  };
  
  const handleStartEdit = (foto: Foto) => {
    setEditingFoto(foto);
    setEditingLegenda(foto.legenda || '');
  };

  const handleUpdateLegenda = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingFoto) return;
    
    const { error } = await supabase
      .from('galeria_fotos')
      .update({ legenda: editingLegenda })
      .match({ id: editingFoto.id });
      
    if (error) {
      alert('Falha ao atualizar legenda.');
      console.error('Erro:', error);
    } else {
      setEditingFoto(null);
      await fetchFotos();
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gerenciar Galeria de Fotos</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Adicionar Nova Foto</h2>
        <form onSubmit={handleAddFoto} className="space-y-4">
          <div>
            <label htmlFor="foto-input" className="block text-sm font-medium text-gray-700">Foto</label>
            <input id="foto-input" type="file" onChange={(e) => setNewFotoFile(e.target.files ? e.target.files[0] : null)} accept="image/*" required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          </div>
          <div>
            <label htmlFor="legenda-input" className="block text-sm font-medium text-gray-700">Legenda (opcional)</label>
            <input id="legenda-input" type="text" value={newLegenda} onChange={(e) => setNewLegenda(e.target.value)} placeholder="Descrição da foto" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
          </div>
          <button type="submit" disabled={uploading} className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400">
            {uploading ? 'Enviando...' : 'Adicionar Foto'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Fotos Atuais</h2>
        {loading ? <p>Carregando fotos...</p> : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative group border rounded-lg overflow-hidden">
                <Image src={foto.foto_url} alt={foto.legenda || 'Foto da galeria'} width={300} height={300} className="object-cover w-full h-full"/>
                
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-60 text-white transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  {editingFoto?.id === foto.id ? (
                    <form onSubmit={handleUpdateLegenda}>
                      <input type="text" value={editingLegenda} onChange={(e) => setEditingLegenda(e.target.value)} className="w-full p-1 text-black rounded"/>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button type="submit" className="text-xs bg-green-500 px-2 py-1 rounded">Salvar</button>
                        <button type="button" onClick={() => setEditingFoto(null)} className="text-xs bg-gray-500 px-2 py-1 rounded">Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-sm truncate">{foto.legenda || 'Sem legenda'}</p>
                  )}
                </div>

                <div className="absolute top-2 right-2 flex space-x-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <button onClick={() => handleStartEdit(foto)} className="bg-white rounded-full p-1 shadow" title="Editar legenda">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDeleteFoto(foto)} className="bg-white rounded-full p-1 shadow" title="Excluir foto">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GerenciarGaleria;