// pages/admin/financeiro.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Head from 'next/head';
import { createClient, SupabaseClient } from '@supabase/supabase-js'; // Importado SupabaseClient para tipagem
import { CheckCircleIcon, ClockIcon as PendenteIcon } from '@heroicons/react/24/outline'; // Ícones de status
import Link from 'next/link';

// Inicializa o Supabase Client
// Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão em .env.local
const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verifica se as variáveis de ambiente estão definidas antes de criar o cliente
let supabase: SupabaseClient;
try {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (err) {
  console.error("Failed to initialize Supabase client:", err);
  // Fallback para um cliente Supabase "dummy" ou tratamento de erro adequado
  // Isso é para evitar que a aplicação quebre durante a compilação/execução se as variáveis não estiverem lá
  supabase = {} as SupabaseClient; // Apenas para tipagem, não funcional
}


// Interfaces para os tipos de dados
interface Jogador { // Usada para jogadores cadastrados na tabela jogadores
  id: string;
  nome: string;
  apelido: string | null;
  papel: string; // 'Mensalista', 'Convidado', 'Goleiro'
}

interface Pagamento { // Usada para registros na tabela pagamentos
  id: string;
  nome_pagador: string;
  apelido_pagador: string | null;
  papel_pagador: string;
  mes_referencia: string;
  tipo_registro: 'Mensalidade' | 'Jogo Avulso' | 'Isenção Goleiro';
  valor_registrado: number;
  status_pagamento: 'Pago' | 'Pendente' | 'Isento';
  data_efetivacao: string | null;
  created_at: string;
}

// Interface para o participante financeiro (combinação de dados para exibição)
interface ParticipanteFinanceiro {
  nome: string;
  papel: string;
  apelido: string | null; // Adicionado apelido para exibição
  statusMesAtual: 'Pago' | 'Pendente' | 'Isento';
  valorRegistrado: number;
  tipoRegistro: string;
  idPagamento: string | null; // ID do registro de pagamento se existir
}

// Defina os valores padrão para mensalidade e jogo avulso
const valorMensalidade = 50; // Altere conforme necessário
const valorJogoAvulso = 15;  // Altere conforme necessário

const AdminFinanceiroPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mesAno, setMesAno] = useState<string>(new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }).replace('/', '/'));
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [participantesFinanceiros, setParticipantesFinanceiros] = useState<ParticipanteFinanceiro[]>([]);
  const [totalArrecadado, setTotalArrecadado] = useState<number>(0);
  const [statusGeral, setStatusGeral] = useState({
    mensalistasPagos: 0,
    mensalistasCadastrados: 0,
    convidadosPagos: 0,
    convidadosCadastrados: 0,
    goleirosIsentos: 0,
    goleirosCadastrados: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o formulário de adicionar novo participante
  const [novoParticipanteNome, setNovoParticipanteNome] = useState<string>('');
  const [novoParticipantePapel, setNovoParticipantePapel] = useState<'Mensalista' | 'Convidado' | 'Goleiro'>('Mensalista');
  const [adicionarParticipanteError, setAdicionarParticipanteError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
    }
  }, [session, status, router]);

  // --- Função principal para buscar dados ---
  // CORRIGIDO: Removido 'async (err: any)' e tipado o catch
  const fetchPagamentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Busca todos os registros da tabela pagamentos
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*');

      if (error) throw error; // Lança o erro para ser pego pelo catch

      setPagamentos(data || []);
      console.log("Dados brutos de pagamentos carregados:", data); // Para depuração

    } catch (err: any) { // Tipagem explícita para o erro no catch
      console.error("Erro ao carregar pagamentos:", err.message);
      setError("Erro ao carregar dados de pagamentos: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []); // fetchPagamentos não depende de mesAno aqui, ele pega todos os pagamentos para processar depois

  useEffect(() => {
    fetchPagamentos();
  }, [fetchPagamentos]); // Agora fetchPagamentos está no array de dependências do useEffect

  // Lógica para processar os pagamentos e gerar a lista de participantes
  useEffect(() => {
    if (pagamentos.length === 0 && !loading) {
        setParticipantesFinanceiros([]);
        setTotalArrecadado(0);
        setStatusGeral({
            mensalistasPagos: 0,
            mensalistasCadastrados: 0,
            convidadosPagos: 0,
            convidadosCadastrados: 0,
            goleirosIsentos: 0,
            goleirosCadastrados: 0,
        });
        return;
    }

    const [mes, ano] = mesAno.split('/');
    const mesAnoFormatado = `${mes}/${ano}`;

    // 1. Coletar todos os participantes únicos da tabela 'pagamentos'
    const uniqueParticipantes = new Map<string, { nome: string; papel: string; apelido: string | null }>(); // Adicionado apelido
    pagamentos.forEach(p => {
      const key = `${p.nome_pagador}-${p.papel_pagador}`;
      if (!uniqueParticipantes.has(key)) {
        uniqueParticipantes.set(key, { nome: p.nome_pagador, papel: p.papel_pagador, apelido: p.apelido_pagador }); // Pega o apelido
      }
    });

    const currentParticipantes: ParticipanteFinanceiro[] = [];
    let currentTotalArrecadado = 0;
    const currentStatusGeral = {
      mensalistasPagos: 0,
      mensalistasCadastrados: 0,
      convidadosPagos: 0,
      convidadosCadastrados: 0,
      goleirosIsentos: 0,
      goleirosCadastrados: 0,
    };

    uniqueParticipantes.forEach(({ nome, papel, apelido }) => { // Pega apelido aqui também
      // Encontrar o status mais relevante para o mês/ano atual para este participante
      const pagamentosDoParticipanteNoMes = pagamentos.filter(p =>
        p.nome_pagador === nome &&
        p.papel_pagador === papel &&
        p.mes_referencia === mesAnoFormatado
      );

      let statusMesAtual: 'Pago' | 'Pendente' | 'Isento' = 'Pendente';
      let valorRegistrado = 0;
      let tipoRegistro = '';
      let idPagamento: string | null = null;

      // Prioridade: Pago > Isento > Pendente
      const pagamentoPago = pagamentosDoParticipanteNoMes.find(p => p.status_pagamento === 'Pago');
      const pagamentoIsento = pagamentosDoParticipanteNoMes.find(p => p.status_pagamento === 'Isento');
      const pagamentoPendente = pagamentosDoParticipanteNoMes.find(p => p.status_pagamento === 'Pendente');


      if (pagamentoPago) {
        statusMesAtual = 'Pago';
        valorRegistrado = pagamentoPago.valor_registrado;
        tipoRegistro = pagamentoPago.tipo_registro;
        idPagamento = pagamentoPago.id;
      } else if (pagamentoIsento) {
        statusMesAtual = 'Isento';
        valorRegistrado = pagamentoIsento.valor_registrado;
        tipoRegistro = pagamentoIsento.tipo_registro;
        idPagamento = pagamentoIsento.id;
      } else if (pagamentoPendente) {
        statusMesAtual = 'Pendente';
        valorRegistrado = pagamentoPendente.valor_registrado;
        tipoRegistro = pagamentoPendente.tipo_registro;
        idPagamento = pagamentoPendente.id;
      }

      // Se não encontrou nenhum registro para o mês atual, mas o participante existe, ele é Pendente.
      // E se for um Goleiro, ele é Isento por padrão para o mês, a menos que tenha um registro de pagamento.
      if (!pagamentoPago && !pagamentoIsento && !pagamentoPendente) {
        if (papel === 'Goleiro') {
          statusMesAtual = 'Isento';
        } else {
          statusMesAtual = 'Pendente';
        }
      }

      currentParticipantes.push({
        nome,
        papel,
        apelido, // Incluído apelido aqui
        statusMesAtual,
        valorRegistrado,
        tipoRegistro,
        idPagamento,
      });

      // Calcular total arrecadado apenas para pagamentos "Pago"
      if (statusMesAtual === 'Pago') {
        currentTotalArrecadado += valorRegistrado;
      }

      // Atualizar status geral
      if (papel === 'Mensalista') {
        currentStatusGeral.mensalistasCadastrados++;
        if (statusMesAtual === 'Pago') {
          currentStatusGeral.mensalistasPagos++;
        }
      } else if (papel === 'Convidado') {
        currentStatusGeral.convidadosCadastrados++;
        if (statusMesAtual === 'Pago') {
          currentStatusGeral.convidadosPagos++;
        }
      } else if (papel === 'Goleiro') {
        currentStatusGeral.goleirosCadastrados++;
        if (statusMesAtual === 'Isento') { // Apenas conta como isento se o status for realmente 'Isento' para o mês
          currentStatusGeral.goleirosIsentos++;
        }
      }
    });

    // CORRIGIDO: Adicionado sort para garantir ordem alfabética
    setParticipantesFinanceiros(currentParticipantes.sort((a, b) => a.nome.localeCompare(b.nome)));
    setTotalArrecadado(currentTotalArrecadado);
    setStatusGeral(currentStatusGeral);
    console.log("Participantes processados:", currentParticipantes); // Para depuração
    console.log("Status Geral:", currentStatusGeral); // Para depuração

  }, [pagamentos, mesAno, loading]); // Depende de pagamentos e mesAno


  // Lidar com a mudança do mês/ano
  const handleMesAnoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMesAno(e.target.value);
  };

  // Função para adicionar um novo participante financeiro
  const handleAddParticipante = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdicionarParticipanteError(null);

    if (!novoParticipanteNome.trim()) {
      setAdicionarParticipanteError("O nome do participante não pode ser vazio.");
      return;
    }

    // Verifica se o participante já existe (pelo nome e papel)
    const participanteExistente = participantesFinanceiros.some(p => 
        p.nome.toLowerCase() === novoParticipanteNome.trim().toLowerCase() && 
        p.papel === novoParticipantePapel
    );

    if (participanteExistente) {
        setAdicionarParticipanteError(`O participante "${novoParticipanteNome}" com o papel "${novoParticipantePapel}" já existe na lista.`);
        return;
    }

    setLoading(true);
    try {
        // Insere um registro inicial "Pendente" para o novo participante
        // Use o nome e o papel do novo participante para o registro
        const { error } = await supabase
            .from('pagamentos')
            .insert({
                nome_pagador: novoParticipanteNome.trim(),
                apelido_pagador: '', // Apelido inicial vazio
                papel_pagador: novoParticipantePapel,
                mes_referencia: mesAno, // Mês atual como referência inicial
                tipo_registro: 'Mensalidade', // Tipo padrão
                valor_registrado: 0, // Valor inicial 0
                status_pagamento: 'Pendente', // Status inicial Pendente
                data_efetivacao: null,
            });

        if (error) throw error;

        setNovoParticipanteNome(''); // Limpa o campo
        setNovoParticipantePapel('Mensalista'); // Reseta para o padrão
        fetchPagamentos(); // Recarrega os dados para atualizar a lista
        alert('Participante adicionado com sucesso e marcado como Pendente para o mês atual!');

    } catch (err: any) {
        console.error("Erro ao adicionar participante:", err.message);
        setAdicionarParticipanteError("Erro ao adicionar participante: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  // Função para marcar/desmarcar pagamento
  const handleTogglePagamento = async (participante: ParticipanteFinanceiro) => {
    setLoading(true);
    setError(null);
    try {
      const [mes, ano] = mesAno.split('/');
      const mesAnoFormatado = `${mes}/${ano}`;

      // Valor e tipo de registro para o novo status
      let valorParaStatusDesejado = 0;
      let tipoRegistroParaStatusDesejado: Pagamento['tipo_registro'] = 'Mensalidade'; // Default

      if (participante.papel === 'Goleiro') {
        valorParaStatusDesejado = 0;
        tipoRegistroParaStatusDesejado = 'Isenção Goleiro';
      } else if (participante.papel === 'Mensalista') {
        valorParaStatusDesejado = valorMensalidade;
        tipoRegistroParaStatusDesejado = 'Mensalidade';
      } else { // 'Convidado'
        valorParaStatusDesejado = valorJogoAvulso;
        tipoRegistroParaStatusDesejado = 'Jogo Avulso';
      }

      if (participante.statusMesAtual === 'Pago' || participante.statusMesAtual === 'Isento') {
        // Se já está Pago/Isento, vamos marcar como Pendente
        const { error } = await supabase
            .from('pagamentos')
            .update({ 
                status_pagamento: 'Pendente', 
                valor_registrado: 0, 
                tipo_registro: tipoRegistroParaStatusDesejado, // Mantém o tipo original ou ajusta
                data_efetivacao: null 
            })
            .eq('id', participante.idPagamento); // Usa o ID do registro de pagamento

        if (error) throw error;
        alert(`Pagamento de ${participante.nome} (${participante.papel}) desmarcado.`);

      } else {
        // Se está Pendente, vamos marcar como Pago ou Isento
        const statusDesejado: 'Pago' | 'Isento' = participante.papel === 'Goleiro' ? 'Isento' : 'Pago';
        const dataEfetivacao = new Date().toISOString();

        if (participante.idPagamento) {
            // Atualiza um registro existente se já tiver um ID de pagamento
            const { error } = await supabase
                .from('pagamentos')
                .update({
                    status_pagamento: statusDesejado,
                    valor_registrado: valorParaStatusDesejado,
                    tipo_registro: tipoRegistroParaStatusDesejado,
                    data_efetivacao: dataEfetivacao,
                })
                .eq('id', participante.idPagamento);
            if (error) throw error;
            alert(`Pagamento de ${participante.nome} (${participante.papel}) marcado como ${statusDesejado}!`);
        } else {
            // Cria um novo registro de pagamento se não existir para o mês
            const { error } = await supabase
                .from('pagamentos')
                .insert({
                    nome_pagador: participante.nome,
                    apelido_pagador: participante.apelido,
                    papel_pagador: participante.papel,
                    mes_referencia: mesAnoFormatado,
                    tipo_registro: tipoRegistroParaStatusDesejado,
                    valor_registrado: valorParaStatusDesejado,
                    status_pagamento: statusDesejado,
                    data_efetivacao: dataEfetivacao,
                });
            if (error) throw error;
            alert(`Pagamento de ${participante.nome} (${participante.papel}) registrado como ${statusDesejado}!`);
        }
      }
      fetchPagamentos(); // Recarrega os dados
    } catch (err: any) {
      console.error("Erro ao atualizar pagamento:", err.message);
      setError("Erro ao atualizar pagamento: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para deletar um participante (e todos os seus pagamentos)
  const handleDeleteParticipante = async (nome: string, papel: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar ${nome} (${papel}) e TODOS os seus registros de pagamento? Esta ação é irreversível!`)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('pagamentos')
        .delete()
        .eq('nome_pagador', nome)
        .eq('papel_pagador', papel); // Deleta todos os registros para este nome e papel

      if (error) throw error;
      alert(`${nome} (${papel}) e seus registros de pagamento foram deletados com sucesso.`);
      fetchPagamentos(); // Recarrega os dados
    } catch (err: any) {
      console.error("Erro ao deletar participante:", err.message);
      setError("Erro ao deletar participante: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mostra mensagem de carregamento enquanto a sessão é verificada ou dados são carregados
  if (status === 'loading' || !session || loading) {
    return <Layout><p>Carregando Controle Financeiro...</p></Layout>;
  }

  return (
    <Layout>
      <Head>
        <title>Destreinados FC - Controle Financeiro</title>
      </Head>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Controle Financeiro</h1>

      {/* Formulário para Adicionar Novo Participante Financeiro */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Adicionar Novo Participante Financeiro</h2>
        <form onSubmit={handleAddParticipante} className="space-y-4">
          <div>
            <label htmlFor="novoParticipanteNome" className="block text-sm font-medium text-gray-700">Nome do Participante</label>
            <input
              type="text"
              id="novoParticipanteNome"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={novoParticipanteNome}
              onChange={(e) => setNovoParticipanteNome(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="novoParticipantePapel" className="block text-sm font-medium text-gray-700">Papel</label>
            <select
              id="novoParticipantePapel"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={novoParticipantePapel}
              onChange={(e) => setNovoParticipantePapel(e.target.value as 'Mensalista' | 'Convidado' | 'Goleiro')}
            >
              <option value="Mensalista">Mensalista</option>
              <option value="Convidado">Convidado</option>
              <option value="Goleiro">Goleiro</option>
            </select>
          </div>
          {adicionarParticipanteError && <p className="text-red-500 text-sm">{adicionarParticipanteError}</p>}
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            disabled={loading}
          >
            {loading ? 'Adicionando...' : 'Adicionar Participante'}
          </button>
        </form>
      </div>

      {/* Visão Geral dos Pagamentos */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Visão Geral dos Pagamentos</h2>
        <div className="mb-4">
          <label htmlFor="mesAno" className="block text-sm font-medium text-gray-700">Ver Pagamentos de: (MM/AAAA)</label>
          <input
            type="text"
            id="mesAno"
            className="mt-1 block w-40 border border-gray-300 rounded-md shadow-sm p-2"
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value)}
            placeholder="MM/AAAA"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Total Arrecadado ({mesAno}):</h3>
            <p className="text-3xl font-bold text-blue-600">
              {totalArrecadado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800">Status Geral ({mesAno}):</h3>
            <p className="text-yellow-700">Mensalistas Pagos: {statusGeral.mensalistasPagos} de {statusGeral.mensalistasCadastrados} cadastrados</p>
            <p className="text-yellow-700">Convidados Pagos: {statusGeral.convidadosPagos} de {statusGeral.convidadosCadastrados} cadastrados</p>
            <p className="text-yellow-700">Goleiros Isentos: {statusGeral.goleirosIsentos} de {statusGeral.goleirosCadastrados} cadastrados</p>
          </div>
        </div>
      </div>

      {/* Status de Pagamento por Jogador */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Status de Pagamento por Participante</h2>
        {participantesFinanceiros.length === 0 ? (
          <p className="text-gray-600">Nenhum participante financeiro cadastrado ainda. Use o formulário acima para adicionar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-black">NOME DO PARTICIPANTE</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-black">PAPEL</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-black">STATUS ({mesAno})</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-black">VALOR REGISTRADO</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-black">TIPO REG.</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-black">AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {participantesFinanceiros.map((participante, index) => (
                  <tr key={`${participante.nome}-${participante.papel}-${index}`} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b border-gray-200 text-sm text-black">{participante.nome}</td>
                    <td className="py-3 px-4 border-b border-gray-200 text-sm text-black">{participante.papel}</td>
                    <td className="py-3 px-4 border-b border-gray-200 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        participante.statusMesAtual === 'Pago' ? 'bg-green-100 text-green-800' :
                        participante.statusMesAtual === 'Pendente' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {participante.statusMesAtual}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200 text-sm text-black">
                      {participante.valorRegistrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200 text-sm text-black">{participante.tipoRegistro || '-'}</td>
                    <td className="py-3 px-4 border-b border-gray-200 text-sm">
                      <button
                        onClick={() => handleTogglePagamento(participante)}
                        className={`py-1 px-3 rounded-md text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-opacity-50 mr-2 ${
                          participante.statusMesAtual === 'Pago' ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-400' :
                          'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400'
                        }`}
                        disabled={loading}
                      >
                        {participante.statusMesAtual === 'Pago' ? 'Desmarcar Pago' : 'Marcar como Pago'}
                      </button>
                      <button
                        onClick={() => handleDeleteParticipante(participante.nome, participante.papel)}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
                        disabled={loading}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link href="/admin" className="text-blue-600 hover:underline">
          &larr; Voltar para o Dashboard Admin
        </Link>
      </div>
    </Layout>
  );
};

export default AdminFinanceiroPage;