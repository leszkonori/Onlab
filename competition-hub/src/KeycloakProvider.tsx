import { createContext, useContext, useEffect, useRef, useState } from 'react';
import httpClient from './HttpClient';
import keycloak from './keycloak';
import { User } from './types';


type KeycloakContextType = {
    isAuthenticated: boolean;
    initialized: boolean;
    user: User | null;
    token: string | null;
    hasRole: (role: string, clientId?: string) => boolean;
    logout: () => void;
};

const KeycloakContext = createContext<KeycloakContextType | undefined>(undefined);

export const KeycloakProvider = ({ children }: { children: React.ReactNode }) => {
    const [initialized, setInitialized] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const hasRunRef = useRef(false);

    useEffect(() => {
        if (hasRunRef.current) return;
        hasRunRef.current = true;

        keycloak
            .init({
                onLoad: 'login-required',
                checkLoginIframe: true,
                pkceMethod: 'S256',
            })
            .then(auth => {
                setIsAuthenticated(auth);
                setToken(keycloak.token || null);

                if (auth && keycloak.tokenParsed) {
                    const parsed = keycloak.tokenParsed;
                    const roles = parsed.realm_access?.roles || [];

                    setUser({
                        id: parsed.sub || '',
                        username: parsed.preferred_username || '',
                        email: parsed.email,
                        name: parsed.name,
                        roles,
                    });

                    httpClient.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`;

                    // Refresh token automatikusan
                    keycloak.onTokenExpired = () => {
                        keycloak.updateToken(30).then(refreshed => {
                            if (refreshed) {
                                setToken(keycloak.token || null);
                            }
                        });
                    };
                }

                setInitialized(true);
            });
    }, []);

    const logout = () => {
        keycloak.logout({ redirectUri: 'http://localhost:3000/' });
    };

    const hasRole = (role: string, clientId?: string): boolean => {
        if (!keycloak.tokenParsed) return false;

        if (clientId) {
            return (
                keycloak.tokenParsed.resource_access?.[clientId]?.roles?.includes(role) || false
            );
        }

        return (
            keycloak.tokenParsed.realm_access?.roles?.includes(role) || false
        );
    };

    return (
        <KeycloakContext.Provider
            value={{ isAuthenticated, initialized, user, token, hasRole, logout }}
        >
            {initialized ? children : <p>Betöltés...</p>}
        </KeycloakContext.Provider>
    );
};

export const useKeycloak = () => {
    const context = useContext(KeycloakContext);
    if (!context) throw new Error('useKeycloak must be used within a KeycloakProvider');
    return context;
};
