import Layout from '../components/Layout';
import Head from 'next/head';
// Importando os ícones que vamos usar
import { FaWhatsapp, FaInstagram, FaFacebook, FaYoutube } from 'react-icons/fa';

const Contato: React.FC = () => {

  // --- INFORMAÇÕES DO TIME (Substitua pelos seus dados) ---
  const WHATSAPP_NUMBER = '5545999215410'; // Use o número para marcar amistosos
  const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/DqoTIIlZStC3gjtWNBDnmL'; // Link de convite do grupo
  const INSTAGRAM_URL = 'https://instagram.com/destreinadosfc';
  const FACEBOOK_URL = 'https://facebook.com/destreinadosfc';
  const YOUTUBE_URL = 'https://www.youtube.com/@Destreinados';
  
  // --- DADOS DO MAPA ATUALIZADOS ---
  // 1. COLE A URL DE INCORPORAÇÃO QUE VOCÊ COPIOU DO GOOGLE MAPS AQUI:
  const MAP_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3616.72020793749!2d-53.4994056!3d-24.9756323!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94f3d7006a469d65%3A0x87f254093cde5762!2sArena%20Biasi!5e0!3m2!1spt-BR!2sbr!4v1752546756409!5m2!1spt-BR!2sbr";
  
  // 2. Nome do local para exibição e link
  const MAP_LOCATION_NAME = "R. Guaiás, 264 - Cascavel, PR";
  
  // 3. Link direto para o Google Maps (gerado a partir da busca)
  const MAP_DIRECT_LINK = "https://maps.google.com/?cid=2509727405892094867&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ";
  // --- FIM DAS INFORMAÇÕES ---

  const whatsappApiUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=Olá! Gostaria de marcar um amistoso com o Destreinados FC.`;

  return (
    <Layout>
      <Head>
        <title>Destreinados FC - Contato e Localização</title>
        <meta name="description" content="Entre em contato, junte-se ao nosso grupo e veja onde jogamos!" />
      </Head>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-3">Fale com a Gente</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Entre para o nosso grupo ou chame para marcar aquele amistoso!
        </p>
      </div>

      {/* --- Cartões de Ação --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
        {/* Card para Marcar Amistoso */}
        <a
          href={whatsappApiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group"
        >
          <FaWhatsapp className="text-6xl text-green-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Marcar um Amistoso</h2>
          <p className="text-gray-600">Clique aqui para abrir o WhatsApp e combinar um jogo com nosso representante.</p>
        </a>

        {/* Card para Grupo do WhatsApp */}
        <a
          href={WHATSAPP_GROUP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group"
        >
          <FaWhatsapp className="text-6xl text-teal-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Nosso Grupo</h2>
          <p className="text-gray-600">Faça parte da nossa comunidade no WhatsApp para ficar por dentro das novidades e resenhas.</p>
        </a>
      </div>
      
      {/* --- Redes Sociais --- */}
      <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Siga o Destreinados</h2>
          <div className="flex justify-center space-x-6">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-pink-600 transition-colors">
                  <FaInstagram size={40} />
              </a>
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 transition-colors">
                  <FaFacebook size={40} />
              </a>
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-600 transition-colors">
                  <FaYoutube size={40} />
              </a>
          </div>
      </div>

      {/* --- Mapa de Localização --- */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Onde Jogamos</h2>
        <div className="bg-white p-4 rounded-2xl shadow-lg max-w-4xl mx-auto">
          <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
            <iframe
              src={MAP_EMBED_URL}
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa para ${MAP_LOCATION_NAME}`}
            ></iframe>
          </div>
          <p className="mt-4 font-semibold text-gray-700">
            <a 
              href={MAP_DIRECT_LINK} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              Ver no Google Maps: {MAP_LOCATION_NAME}
            </a>
          </p>
        </div>
      </div>

    </Layout>
  );
};

export default Contato;