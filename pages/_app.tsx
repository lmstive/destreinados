// pages/_app.tsx
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import type { ReactElement, ReactNode } from "react";
import "../styles/globals.css";

// Suporte a getLayout por página
type NextPageWithLayout = AppProps["Component"] & {
  getLayout?: (page: ReactElement) => ReactNode;
};

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const Page = Component as NextPageWithLayout;
  const getLayout = Page.getLayout ?? ((page) => page);

  return (
    <SessionProvider session={session}>
      {getLayout(<Page {...pageProps} />)}
    </SessionProvider>
  );
}
