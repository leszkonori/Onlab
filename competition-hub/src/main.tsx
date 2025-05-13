import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import Keycloak from 'keycloak-js';
import httpClient from "./HttpClient";
import { KeycloakProvider } from './KeycloakProvider.tsx';


/* export const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'master', // Az általad használt realm neve
  clientId: 'my-react-app', // A létrehozott kliens ID-ja
});

keycloak.init({
  onLoad: 'login-required',
  checkLoginIframe: true,
  pkceMethod: 'S256'
}).then((auth) => {
  if (!auth) {
    window.location.reload();
  } else {
    console.info('Authenticated');
    console.log('auth', auth);
    console.log('Keycloak', keycloak);
    console.log('Access token', keycloak.token);
    console.log(keycloak.tokenParsed?.preferred_username);

    httpClient.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`;

    keycloak.onTokenExpired = () => {
      console.log('token expired');
    }
  }
}); */

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KeycloakProvider>
      <App />
    </KeycloakProvider>
  </StrictMode>,
)
