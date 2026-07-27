import { initializeApp, getApps, getApp } from 'firebase/app';
//@ts-ignore — getReactNativePersistence works at runtime, types just don't expose it yet (firebase-js-sdk#9316)
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyC7-a2Rv3__bbODfwuyqgUMIxXjdQ6VJJ0",
  authDomain: "envol-b2de4.firebaseapp.com",
  projectId: "envol-b2de4",
  storageBucket: "envol-b2de4.firebasestorage.app",
  messagingSenderId: "129174828009",
  appId: "1:129174828009:web:84d74ba123c3fe7d519178"
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
