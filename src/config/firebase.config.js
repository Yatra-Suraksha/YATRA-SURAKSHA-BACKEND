import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseApp;

const initializeFirebase = () => {
    try {
      
        if (firebaseApp) {
            return firebaseApp;
        }

        // Check if service account file exists
        if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            const serviceAccountPath = join(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
            
            if (!existsSync(serviceAccountPath)) {
                console.warn(`Firebase service account file not found at: ${serviceAccountPath}`);
                console.warn('Please add your Firebase service account JSON file or use environment variables.');
                return null;
            }

            const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
            
            // Check if the service account has placeholder values
            if (serviceAccount.private_key.includes('YOUR_PRIVATE_KEY_HERE')) {
                console.warn('Firebase service account file contains placeholder values.');
                console.warn('Please replace with actual Firebase service account credentials.');
                return null;
            }
            
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
            
            console.log('Firebase Admin initialized successfully');
            return firebaseApp;
        }
        // For production: use environment variables
        else if (process.env.FIREBASE_PRIVATE_KEY) {
            const serviceAccount = {
                type: "service_account",
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: "https://accounts.google.com/o/oauth2/auth",
                token_uri: "https://oauth2.googleapis.com/token",
                auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
            };

            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        } else {
            console.warn('Firebase configuration not found. Authentication features will be disabled.');
            return null;
        }

        console.log('Firebase Admin initialized successfully');
        return firebaseApp;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        console.warn('Firebase authentication will be disabled. Server will continue without auth.');
        return null;
    }
};

// Initialize Firebase
const firebase = initializeFirebase();

export default firebase;
export const auth = firebase ? admin.auth() : null;