// pages/admin/presenca.tsx
import React, { useState, useRef } from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';

const AdminPresencaPage: React.FC = () => {
  // Constrói a mensagem para o WhatsApp
  const gerarMensagemWhatsapp = () => {
    // A linha de cabeçalho foi removida conforme sua solicitação
    let mensagem = ``; // Começamos com uma mensagem vazia ou apenas com a linha do jogo

    mensagem += `⚽️ Jogo de Quarta-feira (22:00h - Arena Biasi)\n\n`;
    mensagem += `*Goleiros:*\n`;
    // 2 slots para goleiros titulares, 1 para reserva
    for (let i = 0; i < 2; i++) {
        mensagem += `${String(i + 1).padStart(2, '0')} - \n`;
    }
    mensagem += `02 - \n`; // Slot extra para goleiro reserva
    mensagem += `\n`;

    mensagem += `*Jogadores de Linha:*\n`;
    // 12 slots para jogadores de linha
    for (let i = 0; i < 12; i++) {
        mensagem += `${String(i + 1).padStart(2, '0')} - \n`;
    }
    mensagem += `\n`;

    mensagem += `*Reservas:*\n`;
    // 4 slots para reservas
    for (let i = 0; i < 4; i++) {
        mensagem += `${String(i + 1).padStart(2, '0')} - \n`;
    }
    mensagem += `\n`;

    // As linhas de instrução de confirmação foram removidas aqui
    return mensagem;
  };

  const mensagemGerada = gerarMensagemWhatsapp();
  const [copySuccess, setCopySuccess] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const copiarParaAreaDeTransferencia = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
      document.execCommand('copy');
      setCopySuccess('Copiado!');
      setTimeout(() => setCopySuccess(''), 2000); // Limpa a mensagem após 2 segundos
    }
  };

  return (
    <Layout>
      <Head>
        <title>Destreinados FC - Gerar Confirmação de Presença</title>
      </Head>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gerar Mensagem de Confirmação de Presença</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <p className="text-gray-700 mb-4">
          Use esta ferramenta para gerar a mensagem de confirmação de presença para o jogo de quarta-feira.
          Basta copiar o texto e colar no grupo do WhatsApp do time.
        </p>

        <button
          onClick={copiarParaAreaDeTransferencia}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4"
        >
          Copiar Mensagem para WhatsApp {copySuccess && `(${copySuccess})`}
        </button>

        <textarea
          ref={textareaRef}
          value={mensagemGerada}
          readOnly
          rows={20} // Aumentei as linhas para melhor visualização
          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-800 font-mono text-sm"
        ></textarea>
      </div>

      <Link href="/admin" className="text-blue-600 hover:underline mt-4 inline-block">
        ← Voltar para o Dashboard Admin
      </Link>
    </Layout>
  );
};

export default AdminPresencaPage;