// pages/pedidos.tsx

import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import Head from 'next/head';
import Link from 'next/link';

// FUNÇÃO AUXILIAR PARA ESCAPAR CARACTERES ESPECIAIS EM REGEX
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Definindo os templates de requerimento
const requerimentosTemplates = [
  {
    id: 'vale-futebol',
    titulo: 'Requerimento Oficial de Vale-Futebol',
    textoBase: `REQUERIMENTO OFICIAL DE VALE-FUTEBOL
Para: A Chefa Suprema desta casa, Rainha do Controle Remoto e do meu WhatsApp.
De: [SOLICITANTE_NOME]
Assunto: Uma questão de vida ou morte.

Meu amor,
Venho por meio desta carta (tá, é um texto no celular, mas finge que é oficial) fazer um pedido muito sério.
Os pía, aquele bando de pernas de pau que você já conhece, estão me convocando para a nossa tradicional batalha contra a dignidade no futebol. Sim, o glorioso "Destreinados FC" vai entrar em campo.
Então, eu queria humildemente pedir sua liberação no dia [DATA_DO_JOGO], mais ou menos entre as [HORARIO_INICIAL] e as [HORARIO_FINAL].

O COMBINADO (pra ninguém sair bravo):
A VOLTA: Prometo não voltar parecendo que lutei com um porco na lama.
O DIA SEGUINTE: Se eu acordar todo quebrado, juro que vou sofrer em silêncio.
A TROCA JUSTA: Em troca desse vale-esportivo, você ganha um "vale-tarefa"! Pode escolher UMA das opções abaixo:
[TROCA_JUSTA_OPCOES]

Por favor, analise meu caso com o carinho de sempre.
Com o amor de quem já está até vestindo o meião por baixo da calça,
Seu eterno camisa 10 (do time reserva),
[SOLICITANTE_NOME]

Resposta da Diretoria:(Marque com um X ou mande um áudio)
( ) SIM, PODE IR. ✅ (Mas ai de você se esquecer de trazer um chocolate na volta!)
( ) TÁ, VAI. 🤔 (Mas a partir das [HORARIO_FINAL_MAIS_1H], começo a te ligar de 5 em 5 minutos.)
( ) NEM PENSAR. ❌ (A pia também está te convocando e o jogo dela é mais importante.)`,
    campos: [
      { id: 'solicitante_nome', label: 'Seu Nome:', placeholder: 'Fulano de Tal', type: 'text', default: '' },
      { id: 'data_do_jogo', label: 'Data do Jogo:', placeholder: 'DD/MM/AAAA', type: 'date', default: '' },
      { id: 'horario_inicial', label: 'Horário Inicial:', placeholder: 'HH:MM', type: 'time', default: '22:00' },
      { id: 'horario_final', label: 'Horário Final:', placeholder: 'HH:MM', type: 'time', default: '23:00' },
    ],
    opcoes: [
      {
        id: 'trocaJustaFutebol',
        titulo: 'A TROCA JUSTA: Escolha uma opção:',
        placeholder: '[TROCA_JUSTA_OPCOES]',
        opcoes: [
          { id: 'futebol_louca', texto: 'Eu lavo TODA a louça.' },
          { id: 'futebol_filme', texto: 'Eu assisto aquele filme/série que eu sempre durmo, e juro que dessa vez fico acordado.' },
          { id: 'futebol_shopping', texto: 'Passeio no shopping sem reclamar e ainda dou opinião nas roupas.' },
        ]
      }
    ]
  },
  {
    id: 'vale-churrasco',
    titulo: 'Requerimento Oficial de Vale-Churrasco',
    textoBase: `O Pedido Oficial Para o Churrasco dos Deuses
Para: A Grande Mestra do Lar, Rainha do Meu Coração (e do Cartão de Crédito).
De: [SOLICITANTE_NOME_CHURRASCO]
Assunto: Missão de Sobrevivência Essencial: Urgência Churrasqueira!

Minha amada,
Recebi uma convocação ultra-secreta para o churrasco épico que vai rolar no dia [DATA_DO_CHURRASCO]. Minha presença é indispensável para testar a qualidade da carne e conferir se a cerveja ta gelada!
Então, com a humildade de quem está implorando por um pedaço de picanha, peço sua liberação oficial entre as [HORARIO_INICIAL_CHURRASCO] e as [HORARIO_FINAL_CHURRASCO].

O Pacto Sagrado do Churrasco (Para a Sua Total Tranquilidade):
A VOLTA: Prometo não voltar cheirando a fumaça e tomo banho na hora!
NO DIA SEGUINTE: Se eu acordar meio baleado, prometo ficar na minha, sem mimimi.
A Troca Justa (Escolha seu "prêmio"):
[TROCA_JUSTA_OPCOES_CHURRASCO]

Por favor, minha querida, analise meu caso com carinho.
Com o amor de quem já está sonhando com um espetinho,
[SOLICITANTE_NOME_CHURRASCO]

Resposta da Chefia (Marque com um X ou mande um áudio engraçado):
( ) SIM, PODE IR. ✅ (Mas traga um pedaço daquela carne boa, viu?!)
( ) TÁ, VAI. 🤔 (Mas a partir das [HORARIO_FINAL_MAIS_30MIN_CHURRASCO], começo a mandar figurinhas de "cadê você?")
( ) NEM PENSAR. ❌ (Temos churrasco AQUI EM CASA! E sua função é ser meu fiel escudeiro da churrasqueira.)`,
    campos: [
      { id: 'solicitante_nome_churrasco', label: 'Seu Nome:', placeholder: 'Fulano de Tal', type: 'text', default: '' },
      { id: 'data_do_churrasco', label: 'Data do Churrasco:', placeholder: 'DD/MM/AAAA', type: 'date', default: '' },
      { id: 'horario_inicial_churrasco', label: 'Horário Inicial:', placeholder: 'HH:MM', type: 'time', default: '20:00' },
      { id: 'horario_final_churrasco', label: 'Horário Final:', placeholder: 'HH:MM', type: 'time', default: '23:00' },
    ],
    opcoes: [
      {
        id: 'trocaJustaChurrasco',
        titulo: 'A Troca Justa (Escolha seu "prêmio"):',
        placeholder: '[TROCA_JUSTA_OPCOES_CHURRASCO]',
        opcoes: [
          { id: 'churrasco_louca', texto: 'Eu lavo TODA a louça da casa por dois dias seguidos (sim, as panelas também!).' },
          { id: 'churrasco_filme', texto: 'Eu assisto com você aquele filme/série que eu sempre durmo, e prometo ficar acordado(a) e até elogiar o enredo!' },
          { id: 'churrasco_mercado', texto: 'Eu vou ao mercado sozinho(a), compro tudo que precisa, e ainda carrego as sacolas com um sorriso no rosto.' },
        ]
      }
    ]
  },
  {
    id: 'aditivo-resenha',
    titulo: 'Aditivo Contratual para a Resenha Pós-Jogo',
    textoBase: `ADITIVO CONTRATUAL [TITULO_DINAMICO] AO ALVARÁ DE LIBERAÇÃO ESPORTIVA
ASSUNTO: Extensão de Prazo para Atividade de Análise Tática e Terapêutica Pós-Jogo (Resenha)
DE: [NOME_SOLICITANTE_ADITIVO]
PARA: A Magnífica Reitora do Lar, Chefa Suprema do Controle Remoto e Gestora da Paz Conjugal.

Prezada Diretoria,
Venho por meio deste documento oficial, com o suor da batalha ainda no rosto e a dignidade parcialmente intacta, solicitar uma prorrogação de caráter emergencial ao meu "Vale-Futebol" previamente aprovado.
Considerando que a partida foi um evento de alta complexidade tática (leia-se: um caos) e que a análise dos lances duvidosos, das furadas épicas e das raras genialidades é fundamental para a saúde mental deste time, a "resenha" se tornou uma extensão obrigatória e inadiável do evento esportivo.

CLÁUSULA PRIMEIRA - O OBJETO DO PEDIDO
Fica solicitada a extensão do prazo de retorno ao lar, estipulado no alvará original, por mais [HORAS_EXTRAS] a contar do presente momento.

CLÁUSULA SEGUNDA - JUSTIFICATIVA IRREFUTÁVEL (Marque a principal)
A presente necessidade de horas extras se fundamenta em:
[JUSTIFICATIVA_OPCOES]

CLÁUSULA TERCEIRA - A PROPOSTA DE COMPENSAÇÃO (A troca justa)
Em troca da aprovação deste aditivo, o solicitante se compromete a executar UMA das seguintes tarefas, a critério da Contratante:
[COMPENSACAO_OPCOES]

CLÁUSULA QUARTA - TERMOS DE RETORNO
O Contratado compromete-se a realizar um retorno silencioso, com a furtividade de um ninja, e a não acender luzes desnecessárias. Odores de pós-jogo (ex: fritura, fumaça) devem ser neutralizados antes da entrada no quarto conjugal.

Na certeza do vosso bom senso e magnanimidade, aguardo ansiosamente o deferimento.
Atenciosamente,
[NOME_SOLICITANTE_ADITIVO]

PARECER DA DIRETORIA (A ser preenchido pela Chefa Suprema)
Após análise do pleito, decido:
( ) APROVADO. Concedido. A compensação escolhida foi a de [ESCREVER_COMPENSACAO] e sua execução começa amanhã.
( ) APROVADO COM RESSALVAS. O prazo foi reduzido para [ESCREVER_TEMPO] e a compensação será [ESCREVER_NOVA_CONDICAO].
( ) REPROVADO. O sofá já foi devidamente preparado para recebê-lo. O não cumprimento do horário original acarretará em sanções previstas no Artigo 7 do nosso relacionamento ("Dormir com o cachorro").`,
    campos: [
      { id: 'nome_solicitante_aditivo', label: 'Seu Nome:', placeholder: 'Fulano de Tal', type: 'text', default: '' },
      { id: 'horas_extras', label: 'Extensão Solicitada (ex: 1 hora):', placeholder: '1 hora', type: 'text', default: '1 hora' },
    ],
    opcoes: [
      {
        id: 'justificativa',
        titulo: 'CLÁUSULA SEGUNDA - JUSTIFICATIVA IRREFUTÁVEL (Escolha uma):',
        placeholder: '[JUSTIFICATIVA_OPCOES]',
        opcoes: [
          { id: 'justificativa_analise', texto: 'Análise técnica aprofundada dos piores momentos da partida.' },
          { id: 'justificativa_consolacao', texto: 'Sessão de consolação coletiva a um companheiro que jogou pior do que eu.' },
          { id: 'justificativa_hidratacao', texto: 'Hidratação estratégica e reposição de líquidos (à base de cevada e lúpulo).' },
          { id: 'justificativa_gol', texto: 'Celebração de um gol meu (evento raro que, pela lei, exige comemoração estendida).' },
          { id: 'justificativa_fofoca', texto: 'Simplesmente porque a fofoca sobre os outros times está boa demais.' },
        ]
      },
      {
        id: 'compensacao',
        titulo: 'CLÁUSULA TERCEIRA - PROPOSTA DE COMPENSAÇÃO (Escolha uma):',
        placeholder: '[COMPENSACAO_OPCOES]',
        opcoes: [
          { id: 'compensacao_cafe', texto: 'Vale-Café na Cama: Um café da manhã completo, entregue na cama no próximo fim de semana.' },
          { id: 'compensacao_controle', texto: 'Delegação do Controle Remoto: Entrega total e incondicional do controle da TV por 24 horas.' },
          { id: 'compensacao_mercado', texto: 'Missão "Supermercado" Nível Expert: Comprometo-me a ir ao mercado, sozinho, e trazer TODOS os itens da lista sem precisar ligar ou mandar foto para confirmação.' },
          { id: 'compensacao_tpm', texto: 'Paz na Tensão Pré-Menstrual (TPM): Garanto silêncio e fornecimento de chocolate durante o período supracitado, sem questionamentos.' },
        ]
      }
    ]
  }
];

const PedidosPage: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(requerimentosTemplates[0].id);
  const currentTemplate = requerimentosTemplates.find(t => t.id === selectedTemplateId) || requerimentosTemplates[0];

  const [formValues, setFormValues] = useState<{ [key: string]: string | boolean }>({});
  const generatedTextRef = useRef<HTMLTextAreaElement>(null);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    const newInitialValues: { [key: string]: string | boolean } = {};
    currentTemplate.campos.forEach(campo => {
      newInitialValues[campo.id] = campo.default;
    });
    currentTemplate.opcoes?.forEach(grupo => {
      grupo.opcoes.forEach((opcao, index) => {
        newInitialValues[opcao.id] = index === 0;
      });
    });
    setFormValues(newInitialValues);
  }, [selectedTemplateId, currentTemplate]);

  const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    return date.toTimeString().slice(0, 5);
  };

  const generateFinalText = () => {
    let final = currentTemplate.textoBase;

    currentTemplate.campos.forEach(campo => {
      const placeholder = `[${campo.id.toUpperCase()}]`;
      const value = (formValues[campo.id] as string) || '';
      final = final.replace(new RegExp(escapeRegExp(placeholder), 'gi'), value);
    });

    currentTemplate.opcoes?.forEach(grupo => {
      const placeholder = grupo.placeholder;
      const selectedOption = grupo.opcoes.find(op => formValues[op.id]);
      const replacementText = selectedOption ? selectedOption.texto : '';
      final = final.replace(new RegExp(escapeRegExp(placeholder), 'g'), replacementText);
    });
    
    // Substituições especiais
    if (currentTemplate.id === 'vale-futebol') {
      const horarioFinal = formValues.horario_final as string;
      final = final.replace(new RegExp(escapeRegExp('[HORARIO_FINAL_MAIS_1H]'), 'g'), horarioFinal ? addMinutesToTime(horarioFinal, 60) : 'HH:MM');
    }
    if (currentTemplate.id === 'vale-churrasco') {
      const horarioFinal = formValues.horario_final_churrasco as string;
      final = final.replace(new RegExp(escapeRegExp('[HORARIO_FINAL_MAIS_30MIN_CHURRASCO]'), 'g'), horarioFinal ? addMinutesToTime(horarioFinal, 30) : 'HH:MM');
    }
    if (currentTemplate.id === 'aditivo-resenha') {
        const hoje = new Date();
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
        const numeroDoProcesso = `${dia}${mes}`;
        const tituloDinamico = `Nº ${ano}-${numeroDoProcesso} (EMITIDO EM ${dataFormatada})`;
        final = final.replace(new RegExp(escapeRegExp('[TITULO_DINAMICO]'), 'g'), tituloDinamico);

        const compensacaoEscolhida = currentTemplate.opcoes?.find(g => g.id === 'compensacao')?.opcoes.find(o => formValues[o.id])?.texto || '';
        final = final.replace(new RegExp(escapeRegExp('[ESCREVER_COMPENSACAO]'), 'g'), compensacaoEscolhida);
        final = final.replace(new RegExp(escapeRegExp('[ESCREVER_TEMPO]'), 'g'), formValues.horas_extras as string || '');
        final = final.replace(new RegExp(escapeRegExp('[ESCREVER_NOVA_CONDICAO]'), 'g'), '[Escrever nova condição]');
    }

    return final;
  };

  const finalRequerimentoText = generateFinalText();

  const handleCopy = async () => {
    if (generatedTextRef.current) {
      try {
        await navigator.clipboard.writeText(finalRequerimentoText);
        setCopySuccess('Copiado! ✅');
      } catch (err) {
        console.error('Falha ao copiar texto: ', err);
        setCopySuccess('Erro ao copiar! ❌');
      } finally {
        setTimeout(() => setCopySuccess(''), 2000);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormValues(prev => ({ ...prev, [id]: value }));
  };
  
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>, grupoId: string) => {
    const { id: selectedOptionId } = e.target;
    const grupo = currentTemplate.opcoes?.find(g => g.id === grupoId);

    if (!grupo) return;

    const newGroupValues: { [key: string]: boolean } = {};
    grupo.opcoes.forEach(opcao => {
      newGroupValues[opcao.id] = false;
    });
    newGroupValues[selectedOptionId] = true;

    setFormValues(prev => ({ ...prev, ...newGroupValues }));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplateId(e.target.value);
  };

  return (
    <Layout>
      <Head>
        <title>Destreinados FC - Gerador de Requerimentos</title>
      </Head>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gerador de Requerimentos Oficiais</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="mb-4">
          <label htmlFor="template-select" className="block text-gray-700 text-sm font-bold mb-2">
            Escolha o Tipo de Requerimento:
          </label>
          <select
            id="template-select"
            value={selectedTemplateId}
            onChange={handleTemplateChange}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {requerimentosTemplates.map(template => (
              <option key={template.id} value={template.id}>
                {template.titulo}
              </option>
            ))}
          </select>
        </div>

        <p className="text-gray-700 mb-4">
          Preencha os campos abaixo para personalizar seu requerimento:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {currentTemplate.campos.map(campo => (
            <div key={campo.id}>
              <label htmlFor={campo.id} className="block text-gray-700 text-sm font-bold mb-2">
                {campo.label}
              </label>
              <input
                type={campo.type}
                id={campo.id}
                value={formValues[campo.id] as string || ''}
                onChange={handleInputChange}
                placeholder={campo.placeholder}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          ))}
        </div>
        
        {currentTemplate.opcoes?.map(grupo => (
          <div key={grupo.id} className="mb-6">
            <p className="text-gray-700 text-sm font-bold mb-2">{grupo.titulo}</p>
            {grupo.opcoes.map(opcao => (
              <div key={opcao.id} className="flex items-center mb-2">
                <input
                  type="radio"
                  id={opcao.id}
                  name={grupo.id}
                  checked={!!formValues[opcao.id]}
                  onChange={(e) => handleRadioChange(e, grupo.id)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={opcao.id} className="text-gray-700">{opcao.texto}</label>
              </div>
            ))}
          </div>
        ))}

        <h2 className="text-2xl font-bold text-gray-700 mb-4">Requerimento Gerado</h2>
        <textarea
          ref={generatedTextRef}
          value={finalRequerimentoText}
          readOnly
          rows={25}
          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-800 font-mono text-sm"
        ></textarea>

        <button
          onClick={handleCopy}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 w-full"
        >
          {copySuccess ? copySuccess : 'Copiar para WhatsApp'}
        </button>
      </div>

      <Link href="/" className="text-blue-600 hover:underline mt-8 inline-block">
        ← Voltar para o início
      </Link>
    </Layout>
  );
};

export default PedidosPage;