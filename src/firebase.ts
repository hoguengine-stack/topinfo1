import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

const viteEnvironment = (import.meta as ImportMeta & {
  env?: { PROD?: boolean; VITE_FIREBASE_APP_CHECK_SITE_KEY?: string };
}).env;
const appCheckSiteKey = viteEnvironment?.VITE_FIREBASE_APP_CHECK_SITE_KEY?.trim();

function initializeOptionalAppCheck() {
  if (!viteEnvironment?.PROD || !appCheckSiteKey || typeof window === "undefined") return null;

  try {
    return initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.error("Firebase App Check initialization failed.", error);
    return null;
  }
}

export const appCheck = initializeOptionalAppCheck();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
