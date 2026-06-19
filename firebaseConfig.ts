import { initializeApp, getApp, getApps } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyD3bMHPQXge3K6ypRSDrTiDiVF28OUINsI",
  authDomain: "easyfinancelearning.firebaseapp.com",
  projectId: "easyfinancelearning",
  storageBucket: "easyfinancelearning.firebasestorage.app",
  messagingSenderId: "822778405428",
  appId: "1:822778405428:web:a84625a6546bcc01d4e061",
};

// Avoid initializing app twice during Metro hot-reload (HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Avoid initializing auth twice during Metro hot-reload (HMR)
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: any) {
  authInstance = getAuth(app);
}

export const auth = authInstance;