// pages/admin/financeiro.tsx
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
// CORRIGIDO: Removido XCircleIcon pois não é usado na interface
import { CheckCircleIcon, ClockIcon as PendenteIcon } from '@heroicons/react/24/outline'; // Ícones de status

// Interfaces para os tipos de dados
interface Jogador {
  id: string;
  nome: string;
  apelido: string | null;
  papel: string; // 'Mensalista', 'Convidado', 'Goleiro'
}

interface Pagamento {
  id: string;
  nome_pagador: string; // Nome da pessoa que pagou (diretamente na tabela pagamentos)
  apelido_pagador: string | null; // Apelido da pessoa (diretamente na tabela pagamentos)
  papel_pagador: string; // Papel da pessoa (diretamente na tabela pagamentos)
  mes_referencia: string; // "MM/AAAA" para mensalidades, ou "DD/MM/AAAA" para avulso
  tipo_registro: 'Mensalidade' | 'Jogo Avulso' | 'Isenção Goleiro';
  valor_registrado: number;
  status_pagamento: 'Pendente' | 'Pago' | 'Isento';
  data_efetivacao: string | null;
  created_at: string;
}

const AdminFinanceiroPage: React.FC = () => {
  // Estado para a lista de jogadores (da tabela jogadores)
  const [jogadoresCadastrados, setJogadoresCadastrados] = useState<Jogador[]>([]); 
  // Estado para os registros de pagamento (da tabela pagamentos)
  const [registrosPagamento, setRegistrosPagamento] = useState<Pagamento[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para o mês e ano selecionados (ex: "07/2025")
  const [mesAnoSelecionado, setMesAnoSelecionado] = useState(() => {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${mes}/${ano}`;
  });

  // Valores fixos de pagamento
  const valorMensalidade = 50;
  const valorJogoAvulso = 15;
  // CORRIGIDO: Comentado custoCampoEstimado pois não é usado no cálculo final
  // const custoCampoEstimado = 150; // Exemplo de custo fixo do campo por jogo/mês


  // --- Função principal para buscar dados ---
  // CORRIGIDO: Definida dentro do componente para ser incluída no array de dependências do useEffect
  const fetchData = React.useCallback(async () => { // Usamos useCallback para otimizar o useEffect
    setLoading(true);
    setError(null);

    // 1. Busca todos os jogadores da tabela 'jogadores' (para a lista)
    const { data: jogadoresData, error: jogadoresError } = await supabase
      .from('jogadores')
      .select('id, nome, apelido, papel') // Buscamos o papel aqui
      .order('nome', { ascending: true });

    if (jogadoresError) {
      console.error('Erro ao buscar jogadores cadastrados:', jogadoresError);
      setError('Erro ao carregar jogadores cadastrados.');
      setLoading(false);
      return;
    }
    setJogadoresCadastrados(jogadoresData || []);

    // 2. Busca todos os registros de pagamento da tabela 'pagamentos' para o mês/ano selecionado
    const { data: pagamentosData, error: pagamentosError } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('mes_referencia', mesAnoSelecionado) // Filtra pelo mês/ano
      .order('created_at', { ascending: false }); // Ordena do mais recente

    if (pagamentosError) {
      console.error('Erro ao buscar registros de pagamentos:', pagamentosError);
      setError('Erro ao carregar registros de pagamentos.');
      setLoading(false);
      return;
    }
    setRegistrosPagamento(pagamentosData || []);
    setLoading(false);
  }, [mesAnoSelecionado]); // Dependência: refaz fetchData se mesAnoSelecionado mudar

  // Carrega dados na montagem do componente e quando o mês/ano mudar
  // CORRIGIDO: Adicionado fetchData ao array de dependências
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Agora fetchData está no array de dependências do useEffect


  // Lidar com a mudança do mês/ano
  const handleMesAnoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMesAnoSelecionado(e.target.value);
  };

  // --- Funções de Ação de Pagamento ---
  const handleMarcarStatus = async (
    pagadorNome: string,
    pagadorApelido: string | null,
    papelPagador: string,
    statusDesejado: 'Pendente' | 'Pago' | 'Isento'
  ) => {
    setError(null);
    setLoading(true); // Ativa loading durante a ação

    let valor = 0;
    let tipoRegistro: Pagamento['tipo_registro'];

    // Determina valor e tipo de registro baseado no papel
    if (papelPagador === 'Goleiro') {
      valor = 0;
      tipoRegistro = 'Isenção Goleiro';
    } else if (papelPagador === 'Mensalista') {
      valor = valorMensalidade;
      tipoRegistro = 'Mensalidade';
    } else { // 'Convidado'
      valor = valorJogoAvulso;
      tipoRegistro = 'Jogo Avulso';
    }

    const dataEfetivacao = (statusDesejado === 'Pago' || statusDesejado === 'Isento') ? new Date().toISOString() : null;

    // Tenta encontrar um registro existente para este pagador no mês selecionado
    const registroExistente = registrosPagamento.find(
        r => r.nome_pagador === pagadorNome && r.mes_referencia === mesAnoSelecionado
    );

    if (registroExistente) {
      // Se o registro existir, atualiza
      const { error: updateError } = await supabase
        .from('pagamentos')
        .update({ 
          status_pagamento: statusDesejado, 
          valor_registrado: valor, 
          tipo_registro: tipoRegistro,
          data_efetivacao: dataEfetivacao
        })
        .eq('id', registroExistente.id);

      if (updateError) {
        console.error('Erro ao atualizar pagamento:', updateError);
        setError(`Erro ao atualizar pagamento: ${updateError.message}`);
      }
    } else {
      // Se o registro não existir, insere um novo (apenas se for marcado como Pago ou Isento)
      if (statusDesejado === 'Pendente') {
        setError(`Não é possível criar um registro como "Pendente". Registre apenas pagamentos "Pagos" ou "Isentos" inicialmente.`);
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('pagamentos')
        .insert([{
          nome_pagador: pagadorNome,
          apelido_pagador: pagadorApelido,
          papel_pagador: papelPagador,
          mes_referencia: mesAnoSelecionado,
          tipo_registro: tipoRegistro,
          valor_registrado: valor,
          status_pagamento: statusDesejado,
          data_efetivacao: dataEfetivacao
        }]);

      if (insertError) {
        console.error('Erro ao registrar novo pagamento:', insertError);
        setError(`Erro ao registrar novo pagamento: ${insertError.message}`);
      }
    }
    fetchData(); // Recarrega os dados para refletir a mudança
  };

  // --- Cálculo do Resumo Financeiro ---
  const totalArrecadado = registrosPagamento.reduce((sum, p) => {
    return p.status_pagamento === 'Pago' ? sum + p.valor_registrado : sum;
  }, 0);

  // Mapeia jogadores cadastrados com seus status de pagamento no mês selecionado
  const jogadoresComStatus = jogadoresCadastrados.map(jogador => {
    const registroDoMes = registrosPagamento.find(p => p.nome_pagador === jogador.nome && p.mes_referencia === mesAnoSelecionado);

    let statusDisplay: Pagamento['status_pagamento'] = 'Pendente';
    let valorDisplay = 0;
    let tipoRegistroDisplay: Pagamento['tipo_registro'] = 'Mensalidade'; // Default para display

    if (registroDoMes) {
        statusDisplay = registroDoMes.status_pagamento;
        valorDisplay = registroDoMes.valor_registrado;
        tipoRegistroDisplay = registroDoMes.tipo_registro;
    } else {
        // Se não há registro, o status é "Pendente", e o valor/tipo é o esperado por padrão
        if (jogador.papel === 'Mensalista') {
            valorDisplay = valorMensalidade;
            tipoRegistroDisplay = 'Mensalidade';
        } else if (jogador.papel === 'Convidado') {
            valorDisplay = valorJogoAvulso;
            tipoRegistroDisplay = 'Jogo Avulso';
        } else if (jogador.papel === 'Goleiro') {
            valorDisplay = 0;
            tipoRegistroDisplay = 'Isenção Goleiro';
            // Goleiros, mesmo sem registro, são "Isentos" por padrão se não tiverem pago
            statusDisplay = 'Isento'; 
        }
    }

    return {
      ...jogador,
      status_pagamento_mes: statusDisplay,
      valor_pago_mes: valorDisplay,
      tipo_registro_mes: tipoRegistroDisplay,
      registro_id: registroDoMes?.id // ID do registro de pagamento, se existir
    };
  }).sort((a, b) => { // Ordenar para Pendentes primeiro
    if (a.status_pagamento_mes === 'Pendente' && b.status_pagamento_mes !== 'Pendente') return -1;
    if (a.status_pagamento_mes !== 'Pendente' && b.status_pagamento_mes === 'Pendente') return 1;
    return a.nome.localeCompare(b.nome); // Ordem alfabética se status for igual
  });

  // Contagem para o resumo
  const totalMensalistas = jogadoresCadastrados.filter(j => j.papel === 'Mensalista').length;
  const totalGoleiros = jogadoresCadastrados.filter(j => j.papel === 'Goleiro').length;
  const totalConvidadosCadastrados = jogadoresCadastrados.filter(j => j.papel === 'Convidado').length; 

  const mensalistasPagaram = registrosPagamento.filter(p => p.status_pagamento === 'Pago' && p.tipo_registro === 'Mensalidade').length;
  const convidadosPagaram = registrosPagamento.filter(p => p.status_pagamento === 'Pago' && p.tipo_registro === 'Jogo Avulso').length;
  const isentosGoleiros = registrosPagamento.filter(p => p.status_pagamento === 'Isento' && p.tipo_registro === 'Isenção Goleiro').length;


  return (
    <Layout>
      <Head>
        <title>Destreinados FC - Controle Financeiro</title>
      </Head>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Controle Financeiro</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Visão Geral dos Pagamentos</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Filtro por Mês/Ano */}
        <div className="mb-6">
          <label htmlFor="mesAno" className="block text-gray-700 text-sm font-bold mb-2">
            Ver Pagamentos de: (MM/AAAA)
          </label>
          <input
            type="text"
            id="mesAno"
            value={mesAnoSelecionado}
            onChange={handleMesAnoChange}
            placeholder="Ex: 07/2025"
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-32"
          />
        </div>

        {loading ? (
          <p className="text-gray-600">Carregando dados financeiros...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-lg font-semibold text-gray-800">Total Arrecadado ({mesAnoSelecionado}):</p>
                <p className="text-3xl font-bold text-green-600">R$ {totalArrecadado.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-lg font-semibold text-gray-800">Status Geral ({mesAnoSelecionado}):</p>
                <p className="text-xl">Mensalistas Pagos: {mensalistasPagaram} de {totalMensalistas}</p>
                <p className="text-xl">Convidados Pagos: {convidadosPagaram} ({totalConvidadosCadastrados} cadastrados)</p>
                <p className="text-xl">Goleiros Isentos: {isentosGoleiros} de {totalGoleiros}</p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-700 mb-4">Status de Pagamento por Jogador</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome do Jogador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Papel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status ({mesAnoSelecionado})
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Registrado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo Reg.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jogadoresComStatus.map(jogador => {
                    let statusIcon;
                    let statusColorClass;
                    if (jogador.status_pagamento_mes === 'Pago') {
                      statusIcon = <CheckCircleIcon className="h-5 w-5 mr-1 text-green-500" />;
                      statusColorClass = 'text-green-600';
                    } else if (jogador.status_pagamento_mes === 'Isento') {
                        statusIcon = <CheckCircleIcon className="h-5 w-5 mr-1 text-blue-500" />; // Diferente cor para isento
                        statusColorClass = 'text-blue-600';
                    } else {
                      statusIcon = <PendenteIcon className="h-5 w-5 mr-1 text-yellow-500" />;
                      statusColorClass = 'text-yellow-600';
                    }

                    // Determina o texto do botão de ação
                    let acaoButtonText = '';
                    if (jogador.status_pagamento_mes === 'Pendente') {
                      if (jogador.papel === 'Goleiro') {
                        acaoButtonText = 'Marcar Isento';
                      } else if (jogador.papel === 'Mensalista') {
                        acaoButtonText = `Marcar Pago (R$${valorMensalidade.toFixed(2)})`;
                      } else { // 'Convidado'
                        acaoButtonText = `Marcar Jogo Avulso (R$${valorJogoAvulso.toFixed(2)})`;
                      }
                    } else if (jogador.status_pagamento_mes === 'Pago' || jogador.status_pagamento_mes === 'Isento') {
                        acaoButtonText = 'Desmarcar';
                    }

                    return (
                      <tr key={jogador.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {jogador.nome} ({jogador.apelido || ''})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {jogador.papel}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm flex items-center ${statusColorClass}`}>
                          {statusIcon} {jogador.status_pagamento_mes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            R$ {jogador.valor_pago_mes.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {jogador.tipo_registro_mes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {acaoButtonText && (
                                <button
                                    onClick={() => {
                                        if (jogador.status_pagamento_mes === 'Pendente') {
                                            handleMarcarStatus(jogador.nome, jogador.apelido, jogador.papel, jogador.papel === 'Goleiro' ? 'Isento' : 'Pago');
                                        } else {
                                            handleMarcarStatus(jogador.nome, jogador.apelido, jogador.papel, 'Pendente');
                                        }
                                    }}
                                    className={`py-1 px-3 rounded-md text-white font-semibold text-xs
                                        ${(jogador.status_pagamento_mes === 'Pago' || jogador.status_pagamento_mes === 'Isento') ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                                    disabled={loading}
                                >
                                    {acaoButtonText}
                                </button>
                            )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Link href="/admin" className="text-blue-600 hover:underline mt-8 inline-block">
        ← Voltar para o Dashboard Admin
      </Link>
    </Layout>
  );
};

export default AdminFinanceiroPage;