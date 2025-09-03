// src/lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Read the JSON string from Vercel/environment
    const jsonCredentials = process.env.GOOGLE_CREDENTIALS_JSON;

    if (!jsonCredentials) {
      throw new Error('GOOGLE_CREDENTIALS_JSON environment variable not set.');
    }

    // Parse the JSON string into an object
    const credentials = JSON.parse(jsonCredentials);
    
    admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId: 'painting-estimator-sync', 
    });

  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminDb = admin.firestore();
export { admin };