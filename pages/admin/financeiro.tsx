// pages/admin/financeiro.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Head from 'next/head';
import { supabase } from '../../lib/supabase'; // Importa 'supabase' do arquivo lib/supabase.ts
// CORRIGIDO: Removido XCircleIcon pois não é usado diretamente aqui
// CORRIGIDO: CheckCircleIcon e PendenteIcon são agora usados diretamente nos spans
import { CheckCircleIcon, ClockIcon as PendenteIcon } from '@heroicons/react/24/solid'; // Alterado para /24/solid para ícones preenchidos
import Link from 'next/link';

// Interfaces para os tipos de dados
// CORRIGIDO: Removida interface Jogador, pois não é usada diretamente aqui
// interface Jogador { /* ... */ } 

interface Pagamento { 
  id: string;
  nome_pagador: string;
  apelido_pagador: string | null;
  papel_pagador: 'Mensalista' | 'Convidado' | 'Goleiro';
  mes_referencia: string;
  tipo_registro: 'Mensalidade' | 'Jogo Avulso' | 'Isenção Goleiro';
  valor_registrado: number;
  status_pagamento: 'Pago' | 'Pendente' | 'Isento';
  data_efetivacao: string | null;
  created_at: string;
}

interface ParticipanteFinanceiro {
  nome: string;
  papel: 'Mensalista' | 'Convidado' | 'Goleiro';
  apelido: string | null;
  statusMesAtual: 'Pago' | 'Pendente' | 'Isento';
  valorRegistrado: number; // Valor que deve ser pago ou foi registrado
  tipoRegistro: string;
  idPagamento: string | null;
}

// Valores fixos de pagamento (declarados fora do componente)
const valorMensalidade = 50; 
const valorJogoAvulso = 15;  

const AdminFinanceiroPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mesAno, setMesAno] = useState<string>(new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }).replace('/', '/'));
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]); // Pagamentos brutos da DB
  const [participantesFinanceiros, setParticipantesFinanceiros] = useState<ParticipanteFinanceiro[]>([]); // Lista processada para exibição
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

  const [novoParticipanteNome, setNovoParticipanteNome] = useState<string>('');
  const [novoParticipantePapel, setNovoParticipantePapel] = useState<'Mensalista' | 'Convidado' | 'Goleiro'>('Mensalista');
  const [adicionarParticipanteError, setAdicionarParticipanteError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
    }
  }, [session, status, router]);

  // Função principal para buscar todos os registros de pagamentos
  const fetchPagamentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // CORRIGIDO: Usado 'pagamentosData' e 'fetchError' para evitar variáveis 'data' e 'error' não usadas
      const { data: pagamentosData, error: fetchError } = await supabase
        .from('pagamentos')
        .select('*');

      if (fetchError) throw fetchError;

      setPagamentos(pagamentosData || []);
      console.log("Dados brutos de pagamentos carregados:", pagamentosData);

    } catch (err: unknown) { // CORRIGIDO: Tipado o catch como 'unknown' e feito o cast para Error
      console.error("Erro ao carregar pagamentos:", (err as Error).message);
      setError("Erro ao carregar dados de pagamentos: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []); // Sem dependências para ser estável para o useEffect

  // Carrega todos os pagamentos na montagem inicial
  useEffect(() => {
    fetchPagamentos();
  }, [fetchPagamentos]);

  // Lógica para processar os pagamentos e gerar a lista de participantes
  useEffect(() => {
    // CORRIGIDO: Ajustado a condição de retorno para evitar processamento desnecessário
    if (loading && pagamentos.length === 0) return;
    if (!pagamentos.length && !loading) {
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

    const uniqueParticipantes = new Map<string, { nome: string; papel: 'Mensalista' | 'Convidado' | 'Goleiro'; apelido: string | null }>();
    pagamentos.forEach(p => {
      const key = `${p.nome_pagador}-${p.papel_pagador}`;
      if (!uniqueParticipantes.has(key)) {
        uniqueParticipantes.set(key, { nome: p.nome_pagador, papel: p.papel_pagador, apelido: p.apelido_pagador });
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

    uniqueParticipantes.forEach(({ nome, papel, apelido }) => {
      const pagamentosDoParticipanteNoMes = pagamentos.filter(p =>
        p.nome_pagador === nome &&
        p.papel_pagador === papel &&
        p.mes_referencia === mesAnoFormatado
      );

      let statusMesAtual: 'Pago' | 'Pendente' | 'Isento' = 'Pendente';
      let valorRegistrado = 0;
      let tipoRegistro: string = '';
      let idPagamento: string | null = null;

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
      
      if (!pagamentoPago && !pagamentoIsento && !pagamentoPendente) {
        if (papel === 'Goleiro') {
          statusMesAtual = 'Isento';
        } else {
          statusMesAtual = 'Pendente';
        }
        // Definir valor inicial para participantes sem registro no mês atual
        if (papel === 'Mensalista') valorRegistrado = valorMensalidade;
        else if (papel === 'Convidado') valorRegistrado = valorJogoAvulso;
        else if (papel === 'Goleiro') valorRegistrado = 0; 
      }


      currentParticipantes.push({
        nome,
        papel,
        apelido, 
        statusMesAtual,
        valorRegistrado,
        tipoRegistro,
        idPagamento,
      });

      if (statusMesAtual === 'Pago') {
        currentTotalArrecadado += valorRegistrado;
      }

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
    console.log("Participantes processados:", currentParticipantes); 
    console.log("Status Geral:", currentStatusGeral); 

  }, [pagamentos, mesAno, loading, valorMensalidade, valorJogoAvulso]); 

  // Lidar com a mudança do mês/ano
  const handleMesAnoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMesAno(e.target.value);
  }, []); 

  // Função para adicionar um novo participante financeiro
  const handleAddParticipante = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdicionarParticipanteError(null);

    if (!novoParticipanteNome.trim()) {
      setAdicionarParticipanteError("O nome do participante não pode ser vazio.");
      return;
    }

    const nomeFormatado = novoParticipanteNome.trim();

    const participanteExistente = participantesFinanceiros.some(p => 
        p.nome.toLowerCase() === nomeFormatado.toLowerCase() && 
        p.papel === novoParticipantePapel
    );

    if (participanteExistente) {
        setAdicionarParticipanteError(`O participante "${nomeFormatado}" com o papel "${novoParticipantePapel}" já existe na lista.`);
        return;
    }

    setLoading(true); 
    try {
        const { error: insertError } = await supabase 
            .from('pagamentos')
            .insert({
                nome_pagador: nomeFormatado,
                apelido_pagador: null, 
                papel_pagador: novoParticipantePapel,
                mes_referencia: mesAno, 
                tipo_registro: 'Mensalidade', 
                valor_registrado: 0, 
                status_pagamento: 'Pendente', 
                data_efetivacao: null,
            });

        if (insertError) throw insertError;

        setNovoParticipanteNome(''); 
        setNovoParticipantePapel('Mensalista'); 
        fetchPagamentos(); 
        alert('Participante adicionado com sucesso e marcado como Pendente para o mês atual!');

    } catch (err: unknown) { 
        console.error("Erro ao adicionar participante:", (err as Error).message);
        setAdicionarParticipanteError("Erro ao adicionar participante: " + (err as Error).message);
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

      let valorParaStatusDesejado = 0;
      let tipoRegistroParaStatusDesejado: Pagamento['tipo_registro'] = 'Mensalidade'; 

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
        if (participante.idPagamento) { 
            const { error: updateError } = await supabase 
                .from('pagamentos')
                .update({ 
                    status_pagamento: 'Pendente', 
                    valor_registrado: 0, 
                    tipo_registro: tipoRegistroParaStatusDesejado, 
                    data_efetivacao: null 
                })
                .eq('id', participante.idPagamento); 

            if (updateError) throw updateError;
            alert(`Pagamento de ${participante.nome} (${participante.papel}) desmarcado.`);
        } else {
            setError('Erro interno: Registro de pagamento não encontrado para desmarcar.');
        }

      } else {
        // Se está Pendente, vamos marcar como Pago ou Isento
        const statusDesejado: 'Pago' | 'Isento' = participante.papel === 'Goleiro' ? 'Isento' : 'Pago';
        const dataEfetivacao = new Date().toISOString();

        if (participante.idPagamento) {
            // Atualiza um registro existente se já tiver um ID de pagamento
            const { error: updateError } = await supabase 
                .from('pagamentos')
                .update({
                    status_pagamento: statusDesejado,
                    valor_registrado: valorParaStatusDesejado,
                    tipo_registro: tipoRegistroParaStatusDesejado,
                    data_efetivacao: dataEfetivacao,
                })
                .eq('id', participante.idPagamento);
            if (updateError) throw updateError;
            alert(`Pagamento de ${participante.nome} (${participante.papel}) marcado como ${statusDesejado}!`);
        } else {
            // Cria um novo registro de pagamento se não existir para o mês
            const { error: insertError } = await supabase 
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
            if (insertError) throw insertError;
            alert(`Pagamento de ${participante.nome} (${participante.papel}) registrado como ${statusDesejado}!`);
        }
      }
      fetchPagamentos(); // Recarrega os dados
    } catch (err: unknown) { 
      console.error("Erro ao atualizar pagamento:", (err as Error).message);
      setError("Erro ao atualizar pagamento: " + (err as Error).message);
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
      const { error: deleteError } = await supabase 
        .from('pagamentos')
        .delete()
        .eq('nome_pagador', nome)
        .eq('papel_pagador', papel); 

      if (deleteError) throw deleteError;
      alert(`${nome} (${papel}) e seus registros de pagamento foram deletados com sucesso.`);
      fetchPagamentos(); // Recarrega os dados
    } catch (err: unknown) { 
      console.error("Erro ao deletar participante:", (err as Error).message);
      setError("Erro ao deletar participante: " + (err as Error).message);
    } finally {
      setLoading(false); 
    }
  };

  // Mostra mensagem de carregamento enquanto a sessão é verificada ou dados são carregados
  if (status === 'loading' || !session) { 
    return <Layout><p className="p-8 text-center text-gray-700">Verificando permissão e carregando Controle Financeiro...</p></Layout>;
  }
  
  // Se não estiver autenticado após carregar, redireciona
  if (!session) {
    router.push('/');
    return null; 
  }

  return (
    <Layout>
      <Head>
        <title>Destreinados FC - Controle Financeiro</title>
      </Head>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Controle Financeiro</h1>

      {error && <p className="text-red-500 mb-4 p-2 bg-red-100 rounded">{error}</p>}

      {/* Formulário para Adicionar Novo Participante Financeiro */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Adicionar Novo Participante Financeiro</h2>
        <form onSubmit={handleAddParticipante} className="space-y-4">
          <div>
            <label htmlFor="novoParticipanteNome" className="block text-sm font-medium text-black">Nome do Participante</label>
            <input
              type="text"
              id="novoParticipanteNome"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black placeholder-gray-500"
              value={novoParticipanteNome}
              onChange={(e) => setNovoParticipanteNome(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="novoParticipantePapel" className="block text-sm font-medium text-black">Papel</label>
            <select
              id="novoParticipantePapel"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
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
          <label htmlFor="mesAno" className="block text-sm font-medium text-black">Ver Pagamentos de: (MM/AAAA)</label>
          <input
            type="text"
            id="mesAno"
            className="mt-1 block w-40 border border-gray-300 rounded-md shadow-sm p-2 text-black placeholder-gray-500"
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
            <p className="text-black">Mensalistas Pagos: {statusGeral.mensalistasPagos} de {statusGeral.mensalistasCadastrados} cadastrados</p>
            <p className="text-black">Convidados Pagos: {statusGeral.convidadosPagos} de {statusGeral.convidadosCadastrados} cadastrados</p>
            <p className="text-black">Goleiros Isentos: {statusGeral.goleirosIsentos} de {statusGeral.goleirosCadastrados} cadastrados</p>
          </div>
        </div>
      </div>

      {/* Status de Pagamento por Participante */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Status de Pagamento por Participante</h2>
        {!loading && participantesFinanceiros.length === 0 ? ( 
          <p className="text-gray-600">Nenhum participante financeiro cadastrado ou encontrado para este mês. Use o formulário acima para adicionar.</p>
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