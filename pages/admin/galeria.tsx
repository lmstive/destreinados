// pages/admin/galeria.tsx

import { useState, useEffect, ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import Image from 'next/image'; // Importa o componente de Imagem do Next.js

type Foto = {
  name: string;
  url: string;
};

const GerenciarGaleria = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Segurança: Protege a página
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/');
  }, [session, status, router]);

  // Função para buscar as fotos no Supabase Storage
  const fetchFotos = async () => {
    setLoading(true);
    const { data: files, error } = await supabase.storage
      .from('galeria') // IMPORTANTE: seu "bucket" no Supabase Storage deve se chamar 'galeria'
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Erro ao buscar fotos:', error);
    } else if (files) {
      const fotosComUrl = files.map((file) => ({
        name: file.name,
        url: supabase.storage.from('galeria').getPublicUrl(file.name).data.publicUrl,
      }));
      setFotos(fotosComUrl);
    }
    setLoading(false);
  };

  // Busca as fotos quando a página carrega
  useEffect(() => {
    fetchFotos();
  }, []);

  // Função para fazer o upload de uma nova foto
  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você precisa selecionar uma imagem para fazer upload.');
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('galeria')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }
      await fetchFotos(); // Atualiza a galeria
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  if (status === 'loading' || !session) {
    return <Layout><p>Verificando permissão...</p></Layout>;
  }

  return (
    <Layout title="Gerenciar Galeria">
      <h1 className="text-3xl font-bold mb-6">Gerenciar Galeria de Fotos</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Adicionar Nova Foto</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
        />
        {uploading && <p className="mt-2">Enviando foto...</p>}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Fotos Atuais</h2>
        {loading ? (
          <p>Carregando fotos...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {fotos.map((foto) => (
              <div key={foto.name}>
                <Image
                  src={foto.url}
                  alt={foto.name}
                  width={200}
                  height={200}
                  className="object-cover w-full h-full rounded-lg"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GerenciarGaleria;