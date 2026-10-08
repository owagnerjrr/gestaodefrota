import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuração pública do aplicativo Web Firebase (não contém chave administrativa).
const defaults = {
  apiKey: 'AIzaSyDnmoJ1xAexgnPEQf3xW3ZBJXc_N7PNVgQ',
  authDomain: 'gestaodefrota-c046f.firebaseapp.com',
  projectId: 'gestaodefrota-c046f',
  storageBucket: 'gestaodefrota-c046f.firebasestorage.app',
  messagingSenderId: '694487242228',
  appId: '1:694487242228:web:b79a724bc1ee11dfdc95a1'
};
const envNames = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID'
};
const config = Object.fromEntries(Object.entries(defaults).map(([key,value]) => [key,import.meta.env[envNames[key]] || value]));
export const configured = Boolean(config.apiKey && config.projectId);
const app = initializeApp(config);
export const db = getFirestore(app);
export const auth = getAuth(app);
