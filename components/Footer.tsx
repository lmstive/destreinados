import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 p-4 text-white text-center mt-auto">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} Destreinados FC. Todos os direitos reservados.</p>
        <p>Desenvolvido por Luis Miguel</p>
      </div>
    </footer>
  );
};

export default Footer;
