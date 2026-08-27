const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient = null;
let currentToken = null;
let refreshCallbacks = [];

export function initAuth() {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval);
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: response => {
            if (response.error) return;
            currentToken = response.access_token;
            // notify all waiting callers
            refreshCallbacks.forEach(cb => cb(currentToken));
            refreshCallbacks = [];
          },
        });
        resolve();
      }
    }, 100);
  });
}

export function signIn() {
  return new Promise((resolve, reject) => {
    refreshCallbacks.push(resolve);
    try {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch {
      refreshCallbacks = refreshCallbacks.filter(cb => cb !== resolve);
      reject(new Error('Sign in failed'));
    }
  });
}

export function signOut() {
  if (currentToken) {
    window.google.accounts.oauth2.revoke(currentToken);
    currentToken = null;
  }
}

export function getToken() {
  return currentToken;
}

// Call this when a request returns 401 — silently refreshes without consent prompt
export function refreshToken() {
  return new Promise((resolve, reject) => {
    refreshCallbacks.push(resolve);
    try {
      tokenClient.requestAccessToken({ prompt: '' });
    } catch {
      refreshCallbacks = refreshCallbacks.filter(cb => cb !== resolve);
      reject(new Error('Token refresh failed'));
    }
  });
}
