// Test OAuth URL construction
const APP_CONFIG = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api'
};

const apiUrl = APP_CONFIG.API_URL;
const googleOAuthUrl = `${apiUrl}/auth/google`;

console.log('OAuth URL that will be used:');
console.log(googleOAuthUrl);

console.log('\nTo test the OAuth flow:');
console.log('1. Make sure the backend is running on port 4000');
console.log('2. Make sure you have configured Google OAuth credentials in backend .env');
console.log('3. Click "Continue with Google" in the app');
console.log('4. The browser should redirect to:', googleOAuthUrl);
console.log('5. After Google authentication, you should be redirected back to http://localhost:8081/auth/callback');