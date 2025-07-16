// components/Estatuto.tsx

import React from 'react';

const Estatuto = () => {
  return (
    // Seção que envolve todo o estatuto
    <section className="bg-white p-6 md:p-8 rounded-lg shadow-md mt-8">
      
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6 border-b pb-4">
        Estatuto Oficial <em className="text-gray-500">(ou quase)</em> do Destreinados FC
      </h2>

      <div className="space-y-6 text-gray-700">
        <div>
          <h4 className="text-xl font-bold text-gray-800">Artigo 1 – Quem somos?</h4>
          <p>O Destreinados FC é um time de futebol amador, que se reúnem religiosamente (quarta-feira) para bater uma bolinha, rir dos próprios erros, e tomar umas no pós-jogo.</p>
        </div>

        <div>
          <h4 className="text-xl font-bold text-gray-800">Artigo 2 – Qual é a ideia?</h4>
          <p>A missão é clara, quase divina:</p>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li>Juntar a turma;</li>
            <li>Marcar o jogo;</li>
            <li>Fazer gol (ou dar aquela furada épica);</li>
            <li>Tomar umas no pós-jogo, com a desculpa de “hidratar”;</li>
            <li>E contar vantagem no grupo do WhatsApp como se fosse final de Copa.</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xl font-bold text-gray-800">Artigo 3 – Quem faz parte?</h4>
          <p>O elenco é formado por:</p>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li><strong className="font-semibold">Mensalistas</strong> – Heróis fixos, quase sócios do campo;</li>
            <li><strong className="font-semibold">Convidados</strong> – Só entram se a diretoria autorizar e o time estiver com menos de 12 (ou sem reservas).</li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-xl font-bold text-gray-800">Artigo 4 – Regras (<em>ou o que fingimos seguir</em>)</h4>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li>Chegue antes do horário;</li>
            <li>Pague o jogo – o Pix é leve, mas o <strong className="font-semibold">Xisto</strong> pesa na cobrança;</li>
            <li>Nada de UFC;</li>
            <li>Respeite os outros, mesmo quando isolarem a bola na lua;</li>
            <li>Se for reclamar demais, não vai.</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xl font-bold text-gray-800">Artigo 5 – Diretoria</h4>
          <p>O poder está descentralizado, mas o respeito é centralizado nos mitos:</p>
           <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li><strong className="font-semibold">Xisto</strong> – Presidente tesoureiro implacável, fiscal do Pix, cobrador oficial do “dízimo”;</li>
            <li><strong className="font-semibold">Stive</strong> – Manda p**** nenhuma, mas ajuda em algumas coisas.</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xl font-bold text-gray-800">Artigo 6 – O jogo é nosso (<em>mesmo sem tática</em>)</h4>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li>Partidas marcadas no grupo;</li>
            <li>Segunda-feira sai a lista no grupo, fique atento!</li>
            <li>Quem confirmar primeiro, joga.</li>
            <li>Times são "equilibrados" (Nem sempre!);</li>
            <li>Gols bonitos não valem mais, mas viram vídeo com trilha sonora dramática.</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xl font-bold text-gray-800">Artigo 7 – Dinheiro não faz gol, mas paga o campo</h4>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li>O rateio é lei;</li>
            <li>O Pix é dever cívico;</li>
            <li>Quem não pagar, leva <em className="italic">exposed</em> no grupo e figurinha personalizada com sua cara e a frase: "Esqueci o Pix, irmão..."</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xl font-bold text-gray-800">Artigo 8 – Bagunçou, rodou</h4>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li>Treta? <strong className="font-semibold text-red-600">Ban.</strong></li>
            <li>Briga? <strong className="font-semibold text-red-600">Ban.</strong></li>
            <li>Chute no saco? <strong className="font-semibold text-red-600">Ban.</strong></li>
            <li>DR de relacionamento no grupo? (Vira crônica).</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xl font-bold text-gray-800">Artigo 9 – Regras adicionais de sobrevivência no grupo</h4>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li>Figurinha zoando vale mais que argumento.</li>
            <li>Fake news de escalação serão investigadas.</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xl font-bold text-gray-800">Artigo 10 – Regra de ouro</h4>
          <p>Aqui ninguém é profissional, mas a zoeira sim! Respeito é regra, risada é rotina, e bola rolando é obrigação (ainda que desastrosa).</p>
        </div>

        <div className="pt-4 border-t mt-6 text-center text-sm text-gray-500">
            <p className="font-semibold">Fim do estatuto (por enquanto)</p>
            <p>Este estatuto foi aprovado por todos os membros que leram até aqui (ou não). Pode ser atualizado sempre que:</p>
            <ul className="list-none mt-2 space-y-1">
                <li>A zoeira aumentar;</li>
                <li>Ou o Xisto subir o preço do campo dizendo que “a inflação tá osso”.</li>
            </ul>
        </div>

      </div>
    </section>
  );
};

export default Estatuto;