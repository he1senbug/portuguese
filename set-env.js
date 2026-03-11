const fs = require('fs');
const path = require('path');
require('dotenv').config();

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';

// Allow fallback if no .env exists (e.g. in CI where secrets are injected via sed)
if (!fs.existsSync(path.resolve(__dirname, envFile)) && !process.env.FIREBASE_API_KEY) {
  console.warn(`[set-env] Warning: No ${envFile} found and FIREBASE_API_KEY is not set in environment.`);
}

const targetDir = path.resolve(__dirname, './src/environments');
const targetPath = path.join(targetDir, 'firebase.config.ts');

// Create directory if it doesn't exist (needed for CI)
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
const envConfigFile = `export const firebaseConfig = {
  apiKey: '${process.env.FIREBASE_API_KEY || 'REPLACE_API_KEY'}',
  authDomain: '${process.env.FIREBASE_AUTH_DOMAIN || 'REPLACE_AUTH_DOMAIN'}',
  projectId: '${process.env.FIREBASE_PROJECT_ID || 'REPLACE_PROJECT_ID'}',
  storageBucket: '${process.env.FIREBASE_STORAGE_BUCKET || 'REPLACE_STORAGE_BUCKET'}',
  messagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID || 'REPLACE_MESSAGING_SENDER_ID'}',
  appId: '${process.env.FIREBASE_APP_ID || 'REPLACE_APP_ID'}'
};
`;

fs.writeFileSync(targetPath, envConfigFile, { encoding: 'utf8' });
console.log(`[set-env] Successfully generated ${targetPath}`);
