import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase Konfigürasyonu - Geliştirme ortamı için
const firebaseConfig = {
  apiKey: "AIzaSyDemoKey1234567890",
  authDomain: "papix-platform.firebaseapp.com",
  projectId: "papix-platform",
  storageBucket: "papix-platform.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Firebase hizmetlerini eksport et
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Kalıcı oturum ayarla
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('Firebase persistence could not be set:', err);
});

export default app;
