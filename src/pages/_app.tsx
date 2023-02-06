import "../styles/globals.css";
import type { AppProps } from "next/app";
import NoSSR from "react-no-ssr";
import { createGlobalStyle } from "styled-components";

import { ClientContextProvider } from "../contexts/ClientContext";
import { JsonRpcContextProvider } from "../contexts/JsonRpcContext";
import { ChainDataContextProvider } from "../contexts/ChainDataContext";

import { globalStyle } from "../styles";
const GlobalStyle = createGlobalStyle`
  ${globalStyle}
`;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <GlobalStyle />
      <ChainDataContextProvider>
        <ClientContextProvider>
          <JsonRpcContextProvider>
            <NoSSR>
              <Component {...pageProps} />
            </NoSSR>
          </JsonRpcContextProvider>
        </ClientContextProvider>
      </ChainDataContextProvider>
    </>
  );
}

export default MyApp;
