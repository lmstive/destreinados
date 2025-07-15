// pages/api/auth/[...nextauth].ts

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Lista de e-mails que têm permissão para serem administradores
const adminEmails = [
  'lmstive@gmail.com',
    'famm@outlook.com.br',
];

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Se o email do usuário que está tentando logar estiver na nossa lista de admins,
      // o login é permitido.
      if (user.email && adminEmails.includes(user.email)) {
        return true;
      }
      
      // Se não, o login é bloqueado e nenhuma sessão é criada.
      // O usuário será redirecionado para uma página de erro por padrão.
      console.error(`Tentativa de login bloqueada para o e-mail: ${user.email}`);
      return false; 
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});