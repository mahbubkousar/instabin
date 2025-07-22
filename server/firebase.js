const admin = require('firebase-admin');

// Initialize Firebase Admin
let db;

const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      // For local development, use service account key
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } 
      // For production deployment, use default credentials
      else if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }
      else {
        throw new Error('Firebase configuration missing');
      }
    }
    
    db = admin.firestore();
    console.log('Firebase initialized successfully');
    return db;
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
    throw error;
  }
};

const getDb = () => {
  if (!db) {
    return initializeFirebase();
  }
  return db;
};

module.exports = {
  initializeFirebase,
  getDb,
  admin
};