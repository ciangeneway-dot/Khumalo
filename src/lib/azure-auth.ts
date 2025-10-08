import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser';

// Azure AD B2C Configuration
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
    authority: `https://${import.meta.env.VITE_AZURE_TENANT_NAME}.b2clogin.com/${import.meta.env.VITE_AZURE_TENANT_NAME}.onmicrosoft.com/${import.meta.env.VITE_AZURE_POLICY_NAME}`,
    knownAuthorities: [`${import.meta.env.VITE_AZURE_TENANT_NAME}.b2clogin.com`],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
export const initializeMsal = async () => {
  await msalInstance.initialize();
};

// Authentication scopes
export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
};

export const tokenRequest = {
  scopes: ['openid', 'profile', 'email'],
};

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
}

// Convert MSAL account to our User type
export const accountToUser = (account: AccountInfo | null): User | null => {
  if (!account) return null;

  return {
    id: account.localAccountId,
    email: account.username || '',
    name: account.name || '',
    givenName: account.idTokenClaims?.given_name as string,
    familyName: account.idTokenClaims?.family_name as string,
  };
};

// Authentication functions
export const login = async (): Promise<AuthenticationResult | null> => {
  try {
    const response = await msalInstance.loginPopup(loginRequest);
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const account = msalInstance.getActiveAccount();
    if (account) {
      await msalInstance.logoutPopup({
        account: account,
        postLogoutRedirectUri: window.location.origin,
      });
    }
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

export const getCurrentUser = (): User | null => {
  const account = msalInstance.getActiveAccount();
  return accountToUser(account);
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const account = msalInstance.getActiveAccount();
    if (!account) return null;

    const response = await msalInstance.acquireTokenSilent({
      ...tokenRequest,
      account: account,
    });

    return response.accessToken;
  } catch (error) {
    console.error('Token acquisition failed:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const account = msalInstance.getActiveAccount();
  return account !== null;
};
