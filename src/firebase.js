import {initializeApp} from 'firebase/app';import {getFirestore} from 'firebase/firestore';import {getAuth} from 'firebase/auth';
const keys=['API_KEY','AUTH_DOMAIN','PROJECT_ID','STORAGE_BUCKET','MESSAGING_SENDER_ID','APP_ID'];
const names=['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'];
const config=Object.fromEntries(keys.map((k,i)=>[names[i],import.meta.env['VITE_FIREBASE_'+k]]));
export const configured=Boolean(config.apiKey&&config.projectId);
const app=configured?initializeApp(config):null;
export const db=app?getFirestore(app):null;export const auth=app?getAuth(app):null;