// pages/pedidos.tsx
import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import Head from 'next/head';
import Link from 'next/link';

// FUNÇÃO AUXILIAR PARA ESCAPAR CARACTERES ESPECIAIS EM REGEX
// Isso garante que os colchetes [] sejam tratados como literais na busca.
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& significa o caractere encontrado
}

// Definindo os templates de requerimento
const requerimentosTemplates = [
  {
    id: 'vale-futebol',
    titulo: 'Requerimento Oficial de Vale-Futebol',
    textoBase: `REQUERIMENTO OFICIAL DE VALE-FUTEBOL
Para: A Chefa Suprema desta casa, Rainha do Controle Remoto e do meu WhatsApp.
De: Seu marido, aquele projeto de atleta que você ama (eu acho).
Assunto: Uma questão de vida ou morte.

Meu amor,

Venho por meio desta carta (tá, é um texto no celular, mas finge que é oficial) fazer um pedido muito sério.
Os pía, aquele bando de pernas de pau que você já conhece, estão me convocando para a nossa tradicional batalha contra a dignidade no futebol. Sim, o glorioso "Destreinados FC" vai entrar em campo e minha presença é... bem, eles precisam de alguém pra buscar a bola quando ela vai longe.
Meu corpo, que hoje só conhece o formato do sofá, implora por um pouco de exercício (e por uma desculpa para tomar uma cervejinha depois).

Então, eu queria humildemente pedir sua liberação no dia [DATA_DO_JOGO], mais ou menos entre as [HORARIO_INICIAL] e as [HORARIO_FINAL]. Esse tempo já inclui a partida e a resenha obrigatória pra gente discutir de quem foi a culpa da derrota.

O COMBINADO (pra ninguém sair bravo):

A VOLTA: Prometo não voltar parecendo que lutei com um porco na lama.
O DIA SEGUINTE: Se eu acordar todo quebrado, juro que vou sofrer em silêncio. Sem ficar me arrastando pela casa e gemendo como se estivesse no fim da vida. A louça do almoço ainda será minha inimiga e eu vou encará-la.
A TROCA JUSTA: Em troca desse vale-esportivo, você ganha um "vale-tarefa"! Pode escolher uma das opções abaixo:
[TROCA_JUSTA_OPCOES]
A PAZ MUNDIAL: Você ganha o direito de falar "Eu te avisei" até 3 vezes se eu aparecer com algum roxo ou mancando.

Por favor, analise meu caso com o carinho de sempre. Minha felicidade (e a chance de fazer um gol contra) está em suas mãos.

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
      { id: 'horario_inicial', label: 'Horário Inicial:', placeholder: 'HH:MM', type: 'time', default: '20:00' },
      { id: 'horario_final', label: 'Horário Final:', placeholder: 'HH:MM', type: 'time', default: '23:00' },
    ],
    opcoesTrocaJusta: [
      { id: 'lavoLouca', texto: 'Eu lavo TODA a louça.' },
      { id: 'filmeSerie', texto: 'Eu assisto aquele filme/série que eu sempre durmo, e juro que dessa vez fico acordado.' },
      { id: 'shopping', texto: 'Passeio no shopping sem reclamar e ainda dou opinião nas roupas.' },
    ]
  },
  {
    id: 'vale-churrasco',
    titulo: 'Requerimento Oficial de Vale-Churrasco',
    textoBase: `O Pedido Oficial Para o Churrasco dos Deuses

Para: A Grande Mestra do Lar, Rainha do Meu Coração (e do Cartão de Crédito). (Ou, simplesmente, "Amor da Minha Vida")

De: Seu parceiro, que jura ter sentido o cheiro de carne na brasa de uns 5 km de distância.

Assunto: Missão de Sobrevivência Essencial: Urgência Churrasqueira!

Minha amada,

Estou escrevendo este pedido urgente (com a barriga roncando alto!) para falar de algo muito, muito sério.

Recebi uma convocação ultra-secreta para um evento de vida ou morte: o churrasco épico que vai rolar no dia [DATA_DO_CHURRASCO]. Sim, a turma do "Destreinados FC" vai se encontrar, e minha presença é indispensável – tipo, se eu não for, o churrasco nem começa, sabe? Alguém tem que testar a qualidade da carne e conferir se a cerveja ta gelada!

Meu corpo, que ultimamente só conhece a forma do sofá e o som da TV, precisa urgentemente de vitamina B (de Brasa) e vitamina C (de cerveja) e um pouco de sol. A alma também pede um respiro, um bate-papo sem pensar no trabalho.

Então, com a humildade de quem está implorando por um pedaço de picanha, peço sua liberação oficial entre as [HORARIO_INICIAL_CHURRASCO] e as [HORARIO_FINAL_CHURRASCO]. Esse tempo já inclui a arte de acender o fogo, a paciência para ver a carne no ponto e a "resenha obrigatória" pra gente botar a fofoca em dia.

---
O Pacto Sagrado do Churrasco (Para a Sua Total Tranquilidade):

A VOLTA: Prometo não voltar cheirando a churrasco como se tivesse abraçado a grelha. E, se voltar, tomo banho na hora!
NO DIA SEGUINTE: Se eu acordar meio baleado ou com o estômago reclamando, prometo ficar na minha. Sem mimimi, sem drama…
A Troca Justa (Escolha seu "prêmio"): Em troca desse meu "vale-churrasco", você ganha um "vale-tarefa" exclusivo! Pode escolher UMA das opções abaixo, e eu faço na hora, sem reclamar:
[TROCA_JUSTA_OPCOES_CHURRASCO]
A Paz Mundial: Você pode me dar bronca (e me lembrar do meu juramento de sofrer em silêncio) até 5 vezes se eu começar a mancar ou reclamar de dor no corpo no dia seguinte.

Por favor, minha querida, analise meu caso com carinho. Minha felicidade (e a chance de comer um pão de alho perfeito) está em suas mãos.

Com o amor de quem já está sonhando com um espetinho,
Seu eterno fã número 1 do churrasco (e da sua comida também!),

[SOLICITANTE_NOME_CHURRASCO]

---
Resposta da Chefia (Marque com um X ou mande um áudio engraçado):

( ) SIM, PODE IR. ✅ (Mas ai de você se esquecer de trazer um pedaço daquela carne boa, viu?! Ou um chocolate de recompensa!)
( ) TÁ, VAI. 🤔 (Mas a partir das [HORARIO_FINAL_MAIS_30MIN_CHURRASCO], começo a mandar figurinhas de "cadê você?" e a ligar de 5 em 5 minutos pra saber se tá vivo(a).)
( ) NEM PENSAR. ❌ (Temos churrasco AQUI EM CASA! E sua função é ser meu(minha) fiel escudeiro(a) da churrasqueira. Traga seu avental!)`,
    campos: [
      { id: 'solicitante_nome_churrasco', label: 'Seu Nome:', placeholder: 'Fulano de Tal', type: 'text', default: '' },
      { id: 'data_do_churrasco', label: 'Data do Churrasco:', placeholder: 'DD/MM/AAAA', type: 'date', default: '2025-07-14' }, // Exemplo com data futura
      { id: 'horario_inicial_churrasco', label: 'Horário Inicial:', placeholder: 'HH:MM', type: 'time', default: '20:00' },
      { id: 'horario_final_churrasco', label: 'Horário Final:', placeholder: 'HH:MM', type: 'time', default: '23:00' },
    ],
    opcoesTrocaJusta: [
      { id: 'lavoLoucaChurrasco', texto: 'Eu lavo TODA a louça da casa por dois dias seguidos (sim, as panelas também!).' },
      { id: 'filmeSerieChurrasco', texto: 'Eu assisto com você aquele filme/série que eu sempre durmo, e prometo ficar acordado(a) e até elogiar o enredo!' },
      { id: 'comprasMercadoChurrasco', texto: 'Eu vou ao mercado sozinho(a), compro tudo que precisa, e ainda carrego as sacolas com um sorriso no rosto, mesmo que pareçam tijolos.' },
    ]
  }
];

const PedidosPage: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(requerimentosTemplates[0].id);
  const currentTemplate = requerimentosTemplates.find(t => t.id === selectedTemplateId) || requerimentosTemplates[0];

  const [formValues, setFormValues] = useState<{ [key: string]: string | boolean }>(() => {
    const initialValues: { [key: string]: string | boolean } = {};
    currentTemplate.campos.forEach(campo => {
      initialValues[campo.id] = campo.default;
    });
    currentTemplate.opcoesTrocaJusta.forEach((opcao, index) => {
      initialValues[opcao.id] = index === 0;
    });
    return initialValues;
  });

  const generatedTextRef = useRef<HTMLTextAreaElement>(null);
  const [copySuccess, setCopySuccess] = useState('');

  // Efeito para redefinir os valores do formulário quando o template mudar
  useEffect(() => {
    const newInitialValues: { [key: string]: string | boolean } = {};
    currentTemplate.campos.forEach(campo => {
      newInitialValues[campo.id] = campo.default;
    });
    currentTemplate.opcoesTrocaJusta.forEach((opcao, index) => {
      newInitialValues[opcao.id] = index === 0;
    });
    setFormValues(newInitialValues);
  }, [selectedTemplateId, currentTemplate]);


  // Função auxiliar para adicionar tempo a uma string de tempo (HH:MM)
  const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    return date.toTimeString().slice(0, 5); // Retorna HH:MM
  };

  // Função para gerar o texto final
  const generateFinalText = () => {
    let final = currentTemplate.textoBase;

    // 1. Substituir campos dinâmicos
    currentTemplate.campos.forEach(campo => {
      const rawPlaceholder = `[${campo.id.toUpperCase().replace('-', '_')}]`;
      const escapedPlaceholder = escapeRegExp(rawPlaceholder);
      let valueToReplace = (formValues[campo.id] as string) || campo.placeholder;

      // Formatar data para exibição se for do tipo 'date'
      if (campo.type === 'date' && valueToReplace) {
        try {
          const [year, month, day] = valueToReplace.split('-');
          if (year && month && day) {
            valueToReplace = `${day}/${month}/${year}`;
          } else {
            valueToReplace = campo.placeholder;
          }
        } catch {
          valueToReplace = campo.placeholder;
        }
      }
      final = final.replace(new RegExp(escapedPlaceholder, 'g'), valueToReplace);
    });

    // 2. Substituir a seção "A TROCA JUSTA" completa
    const trocaJustaPlaceholder = currentTemplate.id === 'vale-churrasco' ? '[TROCA_JUSTA_OPCOES_CHURRASCO]' : '[TROCA_JUSTA_OPCOES]';
    const escapedTrocaPlaceholder = escapeRegExp(trocaJustaPlaceholder);
    const trocaJustaOpcoesFormatadas = currentTemplate.opcoesTrocaJusta.map(opcao => {
      const isChecked = formValues[opcao.id];
      return `(${isChecked ? 'X' : ' '}) ${opcao.texto}`;
    }).join('\n');
    final = final.replace(new RegExp(escapedTrocaPlaceholder, 'g'), trocaJustaOpcoesFormatadas);

    // 3. Substituir placeholders de horário dinâmicos na resposta da diretoria
    if (currentTemplate.id === 'vale-futebol') {
      const rawHorarioPlaceholder = '[HORARIO_FINAL_MAIS_1H]';
      const escapedHorarioPlaceholder = escapeRegExp(rawHorarioPlaceholder);
      const horarioFinal = formValues.horario_final as string;
      const horarioFinalMais1h = horarioFinal ? addMinutesToTime(horarioFinal, 60) : 'HH:MM + 1h'; // Adiciona 60 min
      final = final.replace(new RegExp(escapedHorarioPlaceholder, 'g'), horarioFinalMais1h);
    } else if (currentTemplate.id === 'vale-churrasco') {
      const rawHorarioPlaceholder = '[HORARIO_FINAL_MAIS_30MIN_CHURRASCO]';
      const escapedHorarioPlaceholder = escapeRegExp(rawHorarioPlaceholder);
      const horarioFinal = formValues.horario_final_churrasco as string;
      const horarioFinalMais30Min = horarioFinal ? addMinutesToTime(horarioFinal, 30) : 'HH:MM + 30min'; // Adiciona 30 min
      final = final.replace(new RegExp(escapedHorarioPlaceholder, 'g'), horarioFinalMais30Min);
    }

    return final;
  };

  const finalRequerimentoText = generateFinalText();

  const handleCopy = async () => {
    if (generatedTextRef.current) {
      try {
        await navigator.clipboard.writeText(finalRequerimentoText);
        setCopySuccess('Copiado! ✅');
      } catch (err) { // <<<===== CORREÇÃO APLICADA AQUI
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    const newTrocaJustaValues: { [key: string]: boolean } = {};

    // Filtra as opções de troca justa para o template atual
    currentTemplate.opcoesTrocaJusta.forEach(opcao => {
      newTrocaJustaValues[opcao.id] = false;
    });

    if (checked) {
      newTrocaJustaValues[id] = true;
    }

    setFormValues(prev => ({ ...prev, ...newTrocaJustaValues }));
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

        {/* Campos do Formulário */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {currentTemplate.campos.map(campo => (
            <div key={campo.id}>
              <label htmlFor={campo.id} className="block text-gray-700 text-sm font-bold mb-2">
                {campo.label}
              </label>
              <input
                type={campo.type}
                id={campo.id}
                value={formValues[campo.id] as string}
                onChange={handleInputChange}
                placeholder={campo.placeholder}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          ))}
        </div>

        {/* Seção "A TROCA JUSTA" */}
        <div className="mb-6">
          <p className="text-gray-700 text-sm font-bold mb-2">A TROCA JUSTA: Escolha uma opção:</p>
          {currentTemplate.opcoesTrocaJusta.map(opcao => (
            <div key={opcao.id} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={opcao.id}
                checked={!!formValues[opcao.id]}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={opcao.id} className="text-gray-700">{opcao.texto}</label>
            </div>
          ))}
        </div>

        {/* Área de Texto Gerada */}
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
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
        >
          Copiar para WhatsApp {copySuccess && `(${copySuccess})`}
        </button>
      </div>

      <Link href="/" className="text-blue-600 hover:underline mt-8 inline-block">
        ← Voltar para o início
      </Link>
    </Layout>
  );
};

export default PedidosPage;