// components/Estatuto.tsx

import React from 'react';
import {
  UserGroupIcon,
  LightBulbIcon,
  ClipboardDocumentListIcon,
  ScaleIcon,
  IdentificationIcon,
  PuzzlePieceIcon,
  CurrencyDollarIcon,
  NoSymbolIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

// Para organizar melhor, criamos um array com os dados de cada artigo
// As frases com aspas foram movidas para variáveis para garantir a compilação
const fraseEquilibrados = 'Times são "equilibrados" (Nem sempre!)';
const frasePix = 'Quem não pagar, leva exposed no grupo e figurinha com a frase: "Esqueci o Pix, irmão..."';
const fraseInflacao = 'Este estatuto pode ser atualizado sempre que a zoeira aumentar ou o Xisto disser que "a inflação tá osso".';


const estatutoData = [
  {
    id: 'Artigo 1',
    title: 'Quem somos?',
    icon: UserGroupIcon,
    iconColor: 'bg-sky-100 text-sky-600',
    content: <p>O Destreinados FC é um time de futebol amador, que se reúnem religiosamente (quarta-feira) para bater uma bolinha, rir dos próprios erros, e tomar umas no pós-jogo.</p>,
  },
  {
    id: 'Artigo 2',
    title: 'Qual é a ideia?',
    icon: LightBulbIcon,
    iconColor: 'bg-amber-100 text-amber-600',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>Juntar a turma;</li>
        <li>Marcar o jogo;</li>
        <li>Fazer gol (ou dar aquela furada épica);</li>
        <li>Tomar umas no pós-jogo, com a desculpa de “hidratar”;</li>
        <li>E contar vantagem no grupo do WhatsApp como se fosse final de Copa.</li>
      </ul>
    ),
  },
  {
    id: 'Artigo 3',
    title: 'Quem faz parte?',
    icon: ClipboardDocumentListIcon,
    iconColor: 'bg-indigo-100 text-indigo-600',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li><strong className="font-semibold">Mensalistas</strong> – Heróis fixos, quase sócios do campo;</li>
        <li><strong className="font-semibold">Convidados</strong> – Só entram se a diretoria autorizar.</li>
      </ul>
    ),
  },
  {
    id: 'Artigo 4',
    title: 'Regras (ou o que fingimos seguir)',
    icon: ScaleIcon,
    iconColor: 'bg-gray-100 text-gray-600',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>Chegue antes do horário;</li>
        <li>Pague o jogo – o Pix é leve, mas o <strong className="font-semibold">Xisto</strong> pesa na cobrança;</li>
        <li>Nada de UFC;</li>
        <li>Respeite os outros, mesmo quando isolarem a bola na lua;</li>
        <li>Se for reclamar demais, não vai.</li>
      </ul>
    ),
  },
  {
    id: 'Artigo 5',
    title: 'Diretoria',
    icon: IdentificationIcon,
    iconColor: 'bg-teal-100 text-teal-600',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li><strong className="font-semibold">Xisto</strong> – Presidente, tesoureiro e fiscal do Pix;</li>
        <li><strong className="font-semibold">Stive</strong> – Manda p**** nenhuma, mas ajuda.</li>
      </ul>
    ),
  },
  {
    id: 'Artigo 6',
    title: 'O jogo é nosso (mesmo sem tática)',
    icon: PuzzlePieceIcon,
    iconColor: 'bg-rose-100 text-rose-600',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>Partidas marcadas no grupo;</li>
        <li>Segunda-feira sai a lista, fique atento!</li>
        <li>Quem confirmar primeiro, joga.</li>
        {/* CORREÇÃO: Usando a variável para evitar o erro */}
        <li>{fraseEquilibrados}</li>
      </ul>
    ),
  },
  {
    id: 'Artigo 7',
    title: 'Dinheiro não faz gol, mas paga o campo',
    icon: CurrencyDollarIcon,
    iconColor: 'bg-green-100 text-green-600',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>O rateio é lei;</li>
        <li>O Pix é dever cívico;</li>
        {/* CORREÇÃO: Usando a variável para evitar o erro */}
        <li>{frasePix}</li>
      </ul>
    ),
  },
  {
    id: 'Artigo 8',
    title: 'Bagunçou, rodou',
    icon: NoSymbolIcon,
    iconColor: 'bg-red-100 text-red-600',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>Treta? <strong className="font-semibold text-red-600">Ban.</strong></li>
        <li>Briga? <strong className="font-semibold text-red-600">Ban.</strong></li>
        <li>Chute no saco? <strong className="font-semibold text-red-600">Ban.</strong></li>
        <li>DR de relacionamento no grupo? (Vira crônica).</li>
      </ul>
    ),
  },
  {
    id: 'Artigo 10',
    title: 'Regra de Ouro',
    icon: StarIcon,
    iconColor: 'bg-yellow-100 text-yellow-600',
    content: <p>Aqui ninguém é profissional, mas a zoeira sim! Respeito é regra, risada é rotina, e bola rolando é obrigação (ainda que desastrosa).</p>,
  },
];


const Estatuto = () => {
  return (
    <section className="mt-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-800 sm:text-4xl">
          Estatuto Oficial <em className="text-gray-500 font-normal">(ou quase)</em>
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-600">
          As regras que mantêm a nossa pelada minimamente organizada e a zoeira em dia.
        </p>
      </div>

      {/* Grid responsivo para os cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {estatutoData.map((item) => {
          const Icon = item.icon; // Pega o componente do ícone
          return (
            <div 
              key={item.id} 
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-full mr-4 ${item.iconColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold text-gray-800">{item.title}</h4>
              </div>
              <div className="text-gray-700 flex-grow">
                {item.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Seção final */}
      <div className="pt-8 border-t mt-12 text-center text-sm text-gray-500">
          <p className="font-semibold">Fim do estatuto (por enquanto)</p>
          {/* CORREÇÃO: Usando a variável para evitar o erro */}
          <p>{fraseInflacao}</p>
      </div>
    </section>
  );
};

export default Estatuto;
