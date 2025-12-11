import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import Keycloak from 'keycloak-js';
import httpClient from "./HttpClient";
import { KeycloakProvider } from './KeycloakProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KeycloakProvider>
      <App />
    </KeycloakProvider>
  </StrictMode>,
)
