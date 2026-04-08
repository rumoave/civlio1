import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const hasRealCredentials =
  supabaseUrl && supabaseKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseKey.includes('placeholder');

// ─── Local auth (used when Supabase credentials are not configured) ───────────
function createLocalAuth() {
  const ACCOUNTS_KEY = 'civly-local-accounts';
  const SESSION_KEY  = 'civly-local-session';
  const listeners    = new Set();

  const getAccounts = () => {
    try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}'); }
    catch { return {}; }
  };

  const getSession = () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  };

  const saveSession = (session) => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  };

  const notify = (event, session) => {
    listeners.forEach(cb => cb(event, session));
  };

  const makeUser = (email, meta = {}) => ({
    id: btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24),
    email,
    user_metadata: {
      full_name: meta.displayName || '',
      avatar_url: '',
    },
    app_metadata: { provider: 'email' },
  });

  const makeSession = (user) => ({
    user,
    access_token: btoa(user.email + ':' + Date.now()),
  });

  return {
    signUp: async ({ email, password }) => {
      if (!email || !password)
        return { error: { message: 'Email and password are required.' }, data: {} };

      const accounts = getAccounts();
      if (accounts[email])
        return { error: { message: 'An account with this email already exists.' }, data: {} };

      if (password.length < 6)
        return { error: { message: 'Password must be at least 6 characters.' }, data: {} };

      accounts[email] = { password, createdAt: Date.now() };
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

      const user    = makeUser(email);
      const session = makeSession(user);
      saveSession(session);
      notify('SIGNED_IN', session);
      return { error: null, data: { session, user } };
    },

    signInWithPassword: async ({ email, password }) => {
      if (!email || !password)
        return { error: { message: 'Email and password are required.' }, data: {} };

      const accounts = getAccounts();
      if (!accounts[email])
        return { error: { message: 'Invalid login credentials.' }, data: {} };
      if (accounts[email].password !== password)
        return { error: { message: 'Invalid login credentials.' }, data: {} };

      const user    = makeUser(email);
      const session = makeSession(user);
      saveSession(session);
      notify('SIGNED_IN', session);
      return { error: null, data: { session, user } };
    },

    signInWithOAuth: async () => {
      return {
        error: {
          message: 'Google and Apple sign-in require Supabase configuration. Please use email/password.',
        },
      };
    },

    signOut: async () => {
      saveSession(null);
      notify('SIGNED_OUT', null);
      return { error: null };
    },

    onAuthStateChange: (callback) => {
      listeners.add(callback);
      // Fire immediately with current session state
      const session = getSession();
      setTimeout(() => callback(session ? 'SIGNED_IN' : 'INITIAL_SESSION', session), 0);
      return {
        data: {
          subscription: { unsubscribe: () => listeners.delete(callback) },
        },
      };
    },

    getSession: async () => {
      const session = getSession();
      return { data: { session }, error: null };
    },
  };
}

// ─── Export ───────────────────────────────────────────────────────────────────
let supabaseInstance;

if (hasRealCredentials) {
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
} else {
  supabaseInstance = { auth: createLocalAuth() };
}

export const supabase = supabaseInstance;
