// firebase/firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCN2ONj8OZCbFBe4HTJYmE14XTV1GnKZTg",
  authDomain: "f-design-dadf5.firebaseapp.com",
  projectId: "f-design-dadf5",
  storageBucket: "f-design-dadf5.firebasestorage.app",
  messagingSenderId: "354207895648",
  appId: "1:354207895648:web:90437adc86c6ec00163305"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
