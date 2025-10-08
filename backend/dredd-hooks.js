const hooks = require('hooks');
const fetch = require('node-fetch');

let token = null;

async function ensureToken() {
  if (token) return token;

  const email = process.env.DREDD_EMAIL || 'admin@agrotrade.com';
  const password = process.env.DREDD_PASSWORD || 'admin123';

  try {
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed with status ${response.status}`);
    }

    const data = await response.json();
    token = data?.access_token || data?.accessToken || data?.token;
    if (!token) {
      throw new Error('Login succeeded but no token found in response');
    }
    return token;
  } catch (error) {
    console.error('Failed to obtain token for Dredd:', error.message);
    throw error;
  }
}

hooks.beforeAll(async (transactions, done) => {
  try {
    await ensureToken();
    done();
  } catch (error) {
    done(error);
  }
});

hooks.beforeEach(async (transaction, done) => {
  try {
    const bearer = await ensureToken();
    transaction.request.headers.Authorization = `Bearer ${bearer}`;
    done();
  } catch (error) {
    done(error);
  }
});
