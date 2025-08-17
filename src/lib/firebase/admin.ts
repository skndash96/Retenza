import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
}
const serviceAccount = JSON.parse(serviceAccountKey) as Record<string, unknown>;
if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

export const adminAuth = getAuth();