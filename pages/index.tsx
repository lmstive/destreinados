// pages/index.tsx

import Layout from '../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { CalendarDaysIcon, ClockIcon, MapPinIcon, CakeIcon } from '@heroicons/react/24/solid';
import { supabase } from '../lib/supabase'; // Importe o cliente Supabase
import Estatuto from '../components/Estatuto'; // <-- 1. IMPORTAÇÃO ADICIONADA

// Interface para o tipo de jogador (precisa ser a mesma do jogadores.tsx)
interface Jogador {
  id: string;
  nome: string;
  apelido: string | null;
  aniversario: string; // Formato DD/MM
  foto_url: string | null;
  created_at: string;
}

// Interface para as props da página
interface HomePageProps {
  jogadores: Jogador[]; // Agora recebemos jogadores como prop
}

const HomePage: React.FC<HomePageProps> = ({ jogadores }) => {
  // Função para calcular a data da próxima quarta-feira
  const getProximaQuartaFeira = () => {
    const hoje = new Date();
    const diaDaSemanaAtual = hoje.getDay(); // 0 = Domingo, 1 = Segunda, ..., 3 = Quarta
    let diasParaQuarta = 3 - diaDaSemanaAtual; // Quantos dias faltam para a próxima quarta

    // Se hoje já for quarta-feira e a hora for depois das 22h,
    // ou se já passou da quarta-feira desta semana,
    // calcular para a quarta-feira da próxima semana.
    if (diasParaQuarta < 0 || (diasParaQuarta === 0 && hoje.getHours() >= 22)) {
      diasParaQuarta += 7;
    }

    const proximaQuarta = new Date(hoje);
    proximaQuarta.setDate(hoje.getDate() + diasParaQuarta);

    const dia = String(proximaQuarta.getDate()).padStart(2, '0');
    const mes = String(proximaQuarta.getMonth() + 1).padStart(2, '0');
    const ano = proximaQuarta.getFullYear();

    return `${dia}/${mes}/${ano}`;
  };

  const proximoJogoData = getProximaQuartaFeira();
  const proximoJogoHorario = '22:00';
  const proximoJogoLocal = 'Arena Biasi';

  // --- Lógica para encontrar os aniversariantes do mês (agora usando 'jogadores' que vêm do Supabase) ---
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1; // Mês é 0-indexed, então +1

  const aniversariantesDoMes = jogadores.filter(jogador => {
    const [, mesAniversario] = jogador.aniversario.split('/').map(Number);
    return mesAniversario === mesAtual;
  }).sort((a, b) => { // Ordenar por dia de aniversário
    const [diaA] = a.aniversario.split('/').map(Number);
    const [diaB] = b.aniversario.split('/').map(Number);
    return diaA - diaB;
  });

  // Mapeamento de números de mês para nomes de mês em português
  const nomesDosMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const nomeMesAtual = nomesDosMeses[mesAtual - 1]; // -1 porque o array é 0-indexed

  return (
    <Layout>
      <Head>
        <title>Destreinados FC - Onde a Paixão Encontra o Campo!</title>
        <meta name="description" content="Site oficial do Destreinados FC, seu time de futebol amador." />
      </Head>

      <section className="text-center py-12 bg-white rounded-lg shadow-md mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Bem-vindos ao Destreinados FC!</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Aqui a paixão pelo futebol amador se encontra com a amizade e a diversão. Prepare-se para conhecer nosso time, acompanhar nossos jogos e celebrar cada momento dentro e fora de campo!
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Próximo Jogo</h2>
          <p className="text-gray-700 flex items-center mb-1">
            <CalendarDaysIcon className="h-5 w-5 text-gray-500 mr-2" />
            Data: <span className="font-semibold ml-1">{proximoJogoData}</span>
          </p>
          <p className="text-gray-700 flex items-center mb-1">
            <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
            Horário: <span className="font-semibold ml-1">{proximoJogoHorario}</span>
          </p>
          <p className="text-gray-700 flex items-center mb-4">
            <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
            Local: <span className="font-semibold ml-1">{proximoJogoLocal}</span>
          </p>
          <Link href="/pedidos" className="mt-4 inline-block bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md">
            Fazer Pedidos
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Aniversariantes de {nomeMesAtual}</h2>
          {aniversariantesDoMes.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700">
              {aniversariantesDoMes.map((jogador, index) => (
                <li key={index} className="mb-1 flex items-center">
                  <CakeIcon className="h-5 w-5 text-pink-500 mr-2" />
                  <span className="font-semibold">{jogador.nome}</span> ({jogador.aniversario})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 italic">Nenhum aniversariante neste mês.</p>
          )}
          <Link href="/jogadores" className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md">
            Ver Todos os Jogadores
          </Link>
        </div>
      </section>

      {/* <-- 2. COMPONENTE DO ESTATUTO ADICIONADO AQUI --> */}
      <Estatuto />

    </Layout>
  );
};

export default HomePage;

// Função para buscar dados do Supabase no momento da construção da página (SSG)
export async function getStaticProps() {
  const { data, error } = await supabase
    .from('jogadores')
    .select('id, nome, apelido, aniversario, foto_url, created_at'); // Seleciona todas as colunas que queremos

  if (error) {
    console.error('Erro ao buscar jogadores para a Home:', error);
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