// pages/admin/financeiro.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Inicializa o Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Pagamento {
  id: string;
  nome_pagador: string;
  papel_pagador: string;
  mes_referencia: string;
  tipo_registro: string;
  valor_registrado: number;
  status_pagamento: 'Pago' | 'Pendente' | 'Isento';
  data_efetivacao: string | null;
  created_at: string;
}

interface ParticipanteFinanceiro {
  nome: string;
  papel: string;
  statusMesAtual: 'Pago' | 'Pendente' | 'Isento';
  valorRegistrado: number;
  tipoRegistro: string;
  idPagamento: string | null; // ID do registro de pagamento se existir
}

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

  const fetchPagamentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Busca todos os registros da tabela pagamentos
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*');

      if (error) throw error;

      setPagamentos(data || []);
      console.log("Dados brutos de pagamentos carregados:", data); // Para depuração

    } catch (err: any) {
      console.error("Erro ao carregar pagamentos:", err.message);
      setError("Erro ao carregar dados de pagamentos: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPagamentos();
  }, [fetchPagamentos]);

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
    const uniqueParticipantes = new Map<string, { nome: string; papel: string }>();
    pagamentos.forEach(p => {
      // Usa nome_pagador + papel_pagador como chave única para garantir que "João (Mensalista)"
      // seja diferente de "João (Convidado)" se houvesse tal caso.
      const key = `${p.nome_pagador}-${p.papel_pagador}`;
      if (!uniqueParticipantes.has(key)) {
        uniqueParticipantes.set(key, { nome: p.nome_pagador, papel: p.papel_pagador });
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

    uniqueParticipantes.forEach(({ nome, papel }) => {
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
        valorRegistrado = pagamentoIsento.valor_registrado; // Pode ser 0 para isento
        tipoRegistro = pagamentoIsento.tipo_registro;
        idPagamento = pagamentoIsento.id;
      } else if (pagamentoPendente) {
        statusMesAtual = 'Pendente';
        valorRegistrado = pagamentoPendente.valor_registrado; // Pode ser 0 para pendente
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
        if (statusMesAtual === 'Isento') {
          currentStatusGeral.goleirosIsentos++;
        }
      }
    });

    setParticipantesFinanceiros(currentParticipantes.sort((a, b) => a.nome.localeCompare(b.nome)));
    setTotalArrecadado(currentTotalArrecadado);
    setStatusGeral(currentStatusGeral);
    console.log("Participantes processados:", currentParticipantes); // Para depuração
    console.log("Status Geral:", currentStatusGeral); // Para depuração

  }, [pagamentos, mesAno, loading]); // Depende de pagamentos e mesAno

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
        const { data, error } = await supabase
            .from('pagamentos')
            .insert({
                nome_pagador: novoParticipanteNome.trim(),
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

      // Tenta encontrar um registro existente para o mês/ano e participante
      const { data: existingRecords, error: fetchError } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('nome_pagador', participante.nome)
        .eq('papel_pagador', participante.papel)
        .eq('mes_referencia', mesAnoFormatado);

      if (fetchError) throw fetchError;

      const existingPayment = existingRecords?.[0]; // Pega o primeiro registro encontrado

      if (participante.statusMesAtual === 'Pago') {
        // Se já está pago, vamos marcar como Pendente (ou deletar o registro de pago)
        if (existingPayment && existingPayment.status_pagamento === 'Pago') {
            const { error } = await supabase
                .from('pagamentos')
                .update({ status_pagamento: 'Pendente', valor_registrado: 0, data_efetivacao: null })
                .eq('id', existingPayment.id);
            if (error) throw error;
            alert(`Pagamento de ${participante.nome} desmarcado como Pago.`);
        } else {
            // Isso não deveria acontecer se a lógica de status estiver correta
            alert('Erro: Não foi possível desmarcar o pagamento. Registro não encontrado ou status incorreto.');
        }
      } else {
        // Se está Pendente ou Isento, vamos marcar como Pago
        if (existingPayment) {
            // Atualiza um registro existente
            const { error } = await supabase
                .from('pagamentos')
                .update({ 
                    status_pagamento: 'Pago', 
                    valor_registrado: 50.00, // Valor padrão, pode ser editável depois
                    data_efetivacao: new Date().toISOString() 
                })
                .eq('id', existingPayment.id);
            if (error) throw error;
            alert(`Pagamento de ${participante.nome} marcado como Pago!`);
        } else {
            // Cria um novo registro de pagamento se não existir para o mês
            const { error } = await supabase
                .from('pagamentos')
                .insert({
                    nome_pagador: participante.nome,
                    papel_pagador: participante.papel,
                    mes_referencia: mesAnoFormatado,
                    tipo_registro: 'Mensalidade', // Pode ser editável
                    valor_registrado: 50.00, // Valor padrão
                    status_pagamento: 'Pago',
                    data_efetivacao: new Date().toISOString(),
                });
            if (error) throw error;
            alert(`Pagamento de ${participante.nome} registrado como Pago!`);
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

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Formulário para Adicionar Novo Participante Financeiro */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Adicionar Novo Participante</h2>
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
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-gray-600">NOME DO PARTICIPANTE</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-gray-600">PAPEL</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-gray-600">STATUS ({mesAno})</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-gray-600">VALOR REGISTRADO</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-gray-600">TIPO REG.</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-gray-600">AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {participantesFinanceiros.map((participante, index) => (
                  <tr key={`${participante.nome}-${participante.papel}-${index}`} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-900">{participante.nome}</td>
                    <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-900">{participante.papel}</td>
                    <td className="py-3 px-4 border-b border-gray-200 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        participante.statusMesAtual === 'Pago' ? 'bg-green-100 text-green-800' :
                        participante.statusMesAtual === 'Pendente' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {participante.statusMesAtual}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-900">
                      {participante.valorRegistrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-900">{participante.tipoRegistro || '-'}</td>
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

      