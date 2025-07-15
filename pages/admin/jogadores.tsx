// pages/admin/jogadores.tsx

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';

type Jogador = {
  id: number;
  nome: string;
  apelido: string | null;
  aniversario: string | null;
  foto_url: string | null;
};

type EditFormValues = {
  nome: string;
  apelido: string;
  aniversario: string;
  foto_url: string;
};

const GerenciarJogadores = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [aniversario, setAniversario] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  const [editingJogador, setEditingJogador] = useState<Jogador | null>(null);
  const [editValues, setEditValues] = useState<EditFormValues>({ nome: '', apelido: '', aniversario: '', foto_url: '' });
  const [newFotoFile, setNewFotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/');
  }, [session, status, router]);

  const fetchJogadores = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('jogadores').select('*').order('nome', { ascending: true });
    if (error) console.error('Erro ao buscar jogadores:', error);
    else if (data) setJogadores(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchJogadores();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fileSetter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      fileSetter(e.target.files[0]);
    } else {
      fileSetter(null);
    }
  };

  const uploadFoto = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const filePath = `public/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('fotos-jogadores')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('fotos-jogadores').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Falha ao enviar a imagem.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddJogador = async (e: FormEvent) => {
    e.preventDefault();
    if (!nome) return alert('O nome é obrigatório.');
    
    let publicUrl = null;
    if (fotoFile) {
      publicUrl = await uploadFoto(fotoFile);
      if (!publicUrl) return;
    }
    
    const { error } = await supabase.from('jogadores').insert({ 
      nome, apelido: apelido || null, aniversario: aniversario || null, foto_url: publicUrl,
    });

    if (error) {
      console.error('Erro ao adicionar jogador:', error);
      alert('Falha ao adicionar jogador.');
    } else {
      setNome(''); setApelido(''); setAniversario(''); setFotoFile(null);
      await fetchJogadores();
    }
  };

  const handleDeleteJogador = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este jogador?')) {
      const { error } = await supabase.from('jogadores').delete().match({ id });
      if (error) console.error('Erro ao deletar jogador:', error);
      else await fetchJogadores();
    }
  };

  const handleStartEdit = (jogador: Jogador) => {
    setEditingJogador(jogador);
    setEditValues({
      nome: jogador.nome,
      apelido: jogador.apelido || '',
      aniversario: jogador.aniversario || '',
      foto_url: jogador.foto_url || '',
    });
    setNewFotoFile(null);
  };

  const handleCancelEdit = () => setEditingJogador(null);

  const handleUpdateJogador = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingJogador) return;

    let publicUrl = editValues.foto_url; // Mantém a URL existente por padrão
    if (newFotoFile) {
      const uploadedUrl = await uploadFoto(newFotoFile);
      if (uploadedUrl) {
        publicUrl = uploadedUrl;
      } else {
        return; // Falha no upload, interrompe a atualização
      }
    }

    const { error } = await supabase
      .from('jogadores')
      .update({
        nome: editValues.nome,
        apelido: editValues.apelido || null,
        aniversario: editValues.aniversario || null,
        foto_url: publicUrl || null,
      })
      .match({ id: editingJogador.id });

    if (error) {
      alert('Falha ao atualizar jogador.');
      console.error('Erro ao atualizar:', error);
    } else {
      setEditingJogador(null);
      await fetchJogadores();
    }
  };

  // ==========================================================
  // AQUI ESTÁ A CORREÇÃO
  // ==========================================================
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  // ==========================================================

  if (status === 'loading' || !session) {
    return <Layout><p>Verificando permissão...</p></Layout>;
  }

  return (
    <Layout title="Gerenciar Jogadores">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gerenciar Jogadores</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <form onSubmit={handleAddJogador}>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Adicionar Novo Jogador</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input type="text" placeholder="Nome do jogador" value={nome} onChange={e => setNome(e.target.value)} className="p-2 border rounded" required />
            <input type="text" placeholder="Apelido (opcional)" value={apelido} onChange={e => setApelido(e.target.value)} className="p-2 border rounded" />
            <input type="text" placeholder="Aniversário (DD/MM)" value={aniversario} onChange={e => setAniversario(e.target.value)} className="p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Foto (opcional)</label>
            <input type="file" onChange={e => handleFileSelect(e, setFotoFile)} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          </div>
          <button type="submit" disabled={uploading} className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400">
            {uploading ? 'Enviando foto...' : 'Adicionar Jogador'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Elenco Atual</h2>
        {loading ? <p>Carregando...</p> : (
          <div className="space-y-4">
             {jogadores.map(jogador => (
                <div key={jogador.id}>
                   {editingJogador?.id === jogador.id ? (
                      <form onSubmit={handleUpdateJogador} className="p-4 bg-blue-50 rounded border-2 border-blue-300">
                         <div className="flex items-center space-x-4">
                            <Image src={editValues.foto_url || '/jogadores/jogador-padrao.jpg'} alt="Foto atual" width={60} height={60} className="rounded-full object-cover"/>
                            <div className="w-full space-y-2">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <input type="text" name="nome" value={editValues.nome} onChange={handleEditChange} className="p-2 border rounded"/>
                                  <input type="text" name="apelido" value={editValues.apelido} onChange={handleEditChange} className="p-2 border rounded"/>
                                  <input type="text" name="aniversario" value={editValues.aniversario} onChange={handleEditChange} className="p-2 border rounded"/>
                               </div>
                               <div>
                                  <label className="block text-xs text-gray-600">Substituir foto:</label>
                                  <input type="file" onChange={e => handleFileSelect(e, setNewFotoFile)} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"/>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center space-x-2 mt-4">
                            <button type="submit" disabled={uploading} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:bg-gray-400">
                              {uploading ? 'Enviando...' : 'Salvar'}
                            </button>
                            <button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">Cancelar</button>
                         </div>
                      </form>
                   ) : (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-4">
                          <Image
                            src={jogador.foto_url || '/jogadores/jogador-padrao.jpg'}
                            alt={`Foto de ${jogador.nome}`}
                            width={50} height={50}
                            className="rounded-full object-cover"
                          />
                          <div className="text-gray-800"> 
                            <div className="font-bold text-lg">{jogador.nome}</div>
                            {jogador.apelido && <div className="text-sm text-gray-600">Apelido: {jogador.apelido}</div>}
                            {jogador.aniversario && <div className="text-sm text-gray-600">Aniversário: {jogador.aniversario}</div>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button onClick={() => handleStartEdit(jogador)} className="text-blue-500 hover:text-blue-700 font-semibold text-sm">Editar</button>
                          <button onClick={() => handleDeleteJogador(jogador.id)} className="text-red-500 hover:text-red-700 font-semibold text-sm">Excluir</button>
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