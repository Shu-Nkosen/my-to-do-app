import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  // eslint-disable-next-line no-console
  console.warn(
    `Firebase config is missing environment variables: ${missingKeys.join(', ')}`,
  );
}

const shouldInitializeFirebase =
  missingKeys.length === 0 && process.env.NODE_ENV !== 'test';

const app = shouldInitializeFirebase
  ? getApps()[0] || initializeApp(firebaseConfig)
  : undefined;

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export const isFirebaseConfigured = Boolean(app);

export default app;
