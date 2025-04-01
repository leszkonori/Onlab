import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'master', // Az általad használt realm neve
  clientId: 'my-react-app', // A létrehozott kliens ID-ja
});

export default keycloak;