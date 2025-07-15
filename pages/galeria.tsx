// pages/galeria.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import Layout from '../components/Layout';
import Head from 'next/head';
import Image from 'next/image'; // Importado o componente de Imagem do Next.js
import { supabase } from '../lib/supabase';

// Interface para o tipo de foto da galeria
interface FotoGaleria {
  id: string;
  foto_url: string;
  legenda: string | null;
  created_at: string;
}

interface GaleriaPageProps {
  fotos: FotoGaleria[];
}

const GaleriaPage: React.FC<GaleriaPageProps> = ({ fotos }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0); 

  // Função para abrir o lightbox
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setShowLightbox(true);
  };

  // CORREÇÃO 1: Funções envolvidas com useCallback para otimização
  const closeLightbox = useCallback(() => {
    setCurrentImageIndex(0);
    setShowLightbox(false);
  }, []);

  const showNextImage = useCallback(() => {
    if (fotos.length <= 1) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % fotos.length);
  }, [fotos.length]);

  const showPrevImage = useCallback(() => {
    if (fotos.length <= 1) return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + fotos.length) % fotos.length);
  }, [fotos.length]);

  // CORREÇÃO 1: Adicionadas as dependências que faltavam no useEffect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showLightbox) return;

      if (event.key === 'ArrowRight') {
        showNextImage();
      } else if (event.key === 'ArrowLeft') {
        showPrevImage();
      } else if (event.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLightbox, showNextImage, showPrevImage, closeLightbox]);

  const currentImage = fotos[currentImageIndex];

  return (
    <Layout>
      <Head>
        <title>Destreinados FC - Galeria</title>
      </Head>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Nossa Galeria de Fotos</h1>

      {fotos.length === 0 ? (
        <p className="text-gray-600 col-span-full text-center">Nenhuma foto na galeria ainda. Adicione-as pelo painel Admin!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotos.map((foto, index) => (
            <div 
              key={foto.id} 
              className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden shadow-md group cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              {/* CORREÇÃO 2: Substituído <img> por <Image> */}
              <Image
                src={foto.foto_url}
                alt={foto.legenda || 'Foto da Galeria'}
                layout="fill" // Faz a imagem preencher o container pai
                objectFit="cover" // Equivalente ao `object-cover` do Tailwind
                className="transition-transform duration-300 group-hover:scale-105"
                placeholder="blur" // Opcional: Efeito de blur enquanto carrega
                blurDataURL="/placeholder.png" // Opcional: Imagem de placeholder
              />
              {foto.legenda && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 truncate">
                  {foto.legenda}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal com Navegação */}
      {showLightbox && currentImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeLightbox}
        >
          <div 
            className="relative bg-white p-2 rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeLightbox} 
              className="absolute top-2 right-2 text-white bg-gray-800 rounded-full p-1 leading-none text-xl z-20"
              style={{ width: '30px', height: '30px' }}
            >
              &times;
            </button>
            
            <div className="relative w-full h-full">
                {/* CORREÇÃO 2: Substituído <img> por <Image> também no Lightbox */}
                <Image 
                  src={currentImage.foto_url} 
                  alt={currentImage.legenda || 'Foto ampliada'} 
                  layout="fill"
                  objectFit="contain" // Garante que a imagem inteira apareça
                />
            </div>
            
            {/* Botões de Navegação (apenas se houver mais de 1 foto) */}
            {fotos.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); showPrevImage(); }} 
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-gray-800 rounded-full p-2 z-20 opacity-75 hover:opacity-100"
                >
                  &lt;
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); showNextImage(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-gray-800 rounded-full p-2 z-20 opacity-75 hover:opacity-100"
                >
                  &gt;
                </button>
              </>
            )}
            
            {currentImage.legenda && (
              <p className="text-center text-gray-800 text-sm mt-2 absolute bottom-[-30px] w-full">
                {currentImage.legenda}
              </p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default GaleriaPage;

export async function getStaticProps() {
  const { data, error } = await supabase
    .from('galeria_fotos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar fotos para a Galeria Pública:', error);
    return {
      props: { fotos: [] },
      revalidate: 1,
    };
  }

  return {
    props: { fotos: data || [] },
    revalidate: 60,
  };
}