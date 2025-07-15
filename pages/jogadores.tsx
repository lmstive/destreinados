// pages/jogadores.tsx
import Layout from '../components/Layout';
import Head from 'next/head';
import Image from 'next/image'; // CORREÇÃO: Import do componente Image
import { supabase } from '../lib/supabase';

// Definindo a interface para o tipo de jogador
interface Jogador {
  id: string;
  nome: string;
  apelido: string | null;
  aniversario: string;
  foto_url: string | null;
  created_at: string;
}

interface JogadoresPageProps {
  jogadores: Jogador[];
}

const JogadoresPage: React.FC<JogadoresPageProps> = ({ jogadores }) => {
  // Função para comparar datas de aniversário (ignorando o ano)
  const compararAniversarios = (a: Jogador, b: Jogador) => {
    const [diaA, mesA] = a.aniversario.split('/').map(Number);
    const [diaB, mesB] = b.aniversario.split('/').map(Number);

    if (mesA !== mesB) {
      return mesA - mesB;
    }
    return diaA - diaB;
  };

  const jogadoresOrdenados = [...jogadores].sort(compararAniversarios);

  return (
    <Layout>
      <Head>
        <title>Destreinados FC - Nossos Jogadores</title>
      </Head>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Nossos Destreinados</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {jogadoresOrdenados.length === 0 ? (
          <p className="text-gray-600 col-span-full text-center">Nenhum jogador cadastrado ainda. Cadastre-os pelo painel Admin!</p>
        ) : (
          jogadoresOrdenados.map((jogador) => (
            <div key={jogador.id} className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-blue-500">
                {/* CORREÇÃO: Substituição de <img> por <Image> */}
                <Image
                  src={jogador.foto_url || '/jogadores/jogador-padrao.jpg'}
                  alt={`Foto de ${jogador.nome}`}
                  width={96}
                  height={96}
                  objectFit="cover" // Garante que a imagem cubra o espaço, mesmo se não for quadrada
                />
              </div>

              <h2 className="text-xl font-semibold text-gray-700">{jogador.nome}</h2>
              {jogador.apelido && (
                <p className="text-gray-600 text-lg mb-1">
                  Apelido: <span className="font-bold text-blue-600">{jogador.apelido}</span>
                </p>
              )}
              <p className="text-gray-600">
                Aniversário: <span className="font-semibold">{jogador.aniversario}</span>
              </p>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default JogadoresPage;

export async function getStaticProps() {
  const { data, error } = await supabase
    .from('jogadores')
    .select('id, nome, apelido, aniversario, foto_url, created_at');

  if (error) {
    console.error('Erro ao buscar jogadores do Supabase:', error);
    return {
      props: {
        jogadores: [],
      },
      revalidate: 1,
    };
  }

  return {
    props: {
      jogadores: data || [],
    },
    revalidate: 60,
  };
}