// pages/galeria.tsx
import React, { useState, useEffect } from 'react'; // Importar useEffect para navegação por teclado
import Layout from '../components/Layout';
import Head from 'next/head';
import { supabase } from '../lib/supabase'; // Importe o cliente Supabase

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
  // Estado para controlar o modal do lightbox
  const [showLightbox, setShowLightbox] = useState(false);
  // Alterado para armazenar o ÍNDICE da imagem atual, não o objeto inteiro
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0); 

  // Função para abrir o lightbox
  const openLightbox = (index: number) => { // Agora recebe o índice
    setCurrentImageIndex(index);
    setShowLightbox(true);
  };

  // Função para fechar o lightbox
  const closeLightbox = () => {
    setCurrentImageIndex(0); // Reseta o índice
    setShowLightbox(false);
  };

  // Função para mostrar a próxima imagem
  const showNextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      (prevIndex + 1) % fotos.length // Volta para o início se chegar ao fim
    );
  };

  // Função para mostrar a imagem anterior
  const showPrevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      (prevIndex - 1 + fotos.length) % fotos.length // Volta para o fim se chegar ao início
    );
  };

  // Efeito para navegação por teclado (setas)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showLightbox || fotos.length <= 1) return; // Só funciona se o lightbox estiver aberto e houver mais de uma foto

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
  }, [showLightbox, fotos.length]); // Dependências: re-executa se o lightbox abrir/fechar ou se o número de fotos mudar

  // Objeto da imagem atual a ser exibida no lightbox
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
          {fotos.map((foto, index) => ( // Adicionado 'index' aqui
            <div 
              key={foto.id} 
              className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden shadow-md group cursor-pointer"
              onClick={() => openLightbox(index)} // Passa o índice para abrir o lightbox
            >
              <img
                src={foto.foto_url}
                alt={foto.legenda || 'Foto da Galeria'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/galeria/placeholder.jpg'; 
                }}
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
            className="relative bg-white p-2 rounded-lg max-w-4xl max-h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeLightbox} 
              className="absolute top-2 right-2 text-white bg-gray-800 rounded-full p-1 leading-none text-xl z-10"
              style={{ width: '30px', height: '30px' }}
            >
              &times;
            </button>

            {/* Botões de Navegação (apenas se houver mais de 1 foto) */}
            {fotos.length > 1 && (
              <>
                <button 
                  onClick={showPrevImage} 
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-gray-800 rounded-full p-2 z-10 opacity-75 hover:opacity-100"
                >
                  &lt;
                </button>
                <button 
                  onClick={showNextImage} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-gray-800 rounded-full p-2 z-10 opacity-75 hover:opacity-100"
                >
                  &gt;
                </button>
              </>
            )}

            <img 
              src={currentImage.foto_url} 
              alt={currentImage.legenda || 'Foto ampliada'} 
              className="max-w-full max-h-[80vh] object-contain mx-auto my-auto"
            />
            {currentImage.legenda && (
              <p className="text-center text-gray-800 text-sm mt-2">
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

// Função para buscar dados do Supabase no momento da construção da página (SSG)
export async function getStaticProps() {
  const { data, error } = await supabase
    .from('galeria_fotos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar fotos para a Galeria Pública:', error);
    return {
      props: {
        fotos: [],
      },
      revalidate: 1,
    };
  }

  return {
    props: {
      fotos: data || [],
    },
    revalidate: 60,
  };
}