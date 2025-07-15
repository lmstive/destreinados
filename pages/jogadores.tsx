// pages/jogadores.tsx
import Layout from '../components/Layout';
import Head from 'next/head';
// AQUI: A linha 'import Image from 'next/image';' FOI REMOVIDA
import { supabase } from '../lib/supabase'; // Importe o cliente Supabase

// Definindo a interface para o tipo de jogador (boa prática com TypeScript)
interface Jogador {
  id: string;
  nome: string;
  apelido: string | null; // Pode ser nulo
  aniversario: string;
  foto_url: string | null; // Pode ser nulo
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

  // Ordena os jogadores recebidos do Supabase
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
              {/* Foto do Jogador - AGORA COM TAG <img> PADRÃO */}
              <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-blue-500">
                <img // AQUI: <Image> foi substituído por <img>
                  src={jogador.foto_url || '/jogadores/jogador-padrao.jpg'} // Usa a foto do jogador ou uma padrão
                  alt={`Foto de ${jogador.nome}`}
                  className="w-full h-full object-cover" // Classes Tailwind para cobrir o espaço
                  onError={(e) => {
                    // Fallback em caso de erro no carregamento da imagem real
                    (e.target as HTMLImageElement).src = '/jogadores/jogador-padrao.jpg';
                  }}
                />
              </div>

              <h2 className="text-xl font-semibold text-gray-700">{jogador.nome}</h2>
              {/* Apelido do Jogador */}
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

// Função para buscar dados do Supabase no momento da construção da página (SSG)
export async function getStaticProps() {
  const { data, error } = await supabase
    .from('jogadores')
    .select('id, nome, apelido, aniversario, foto_url, created_at'); // Seleciona todas as colunas que queremos

  if (error) {
    console.error('Erro ao buscar jogadores do Supabase:', error);
    return {
      props: {
        jogadores: [], // Retorna um array vazio em caso de erro
      },
      revalidate: 1, // Tenta revalidar rapidamente em caso de erro
    };
  }

  return {
    props: {
      jogadores: data || [], // Passa os dados para o componente como prop
    },
    revalidate: 60, // Revalida a página a cada 60 segundos (ISR - Incremental Static Regeneration)
  };
}